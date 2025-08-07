import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import * as dotenv from "dotenv";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'https://resume-analyzer-frontend-1iwb.onrender.com' // hardcoded frontend
}));

const upload = multer({ dest: "uploads/" });

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const History = [];

let currentDocs = null;
let embeddings = null;

// Upload and process PDF
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    currentDocs = await splitter.splitDocuments(rawDocs);

    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "text-embedding-004",
    });

    await PineconeStore.fromDocuments(currentDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });

    fs.unlinkSync(filePath); // delete after processing
    res.json({ message: "Resume uploaded and processed successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload or processing failed" });
  }
});

// Query API
app.post("/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!embeddings || !currentDocs) {
      return res.status(400).json({ error: "Please upload a resume first" });
    }

    const queryVector = await embeddings.embedQuery(question);

    const results = await pineconeIndex.query({
      topK: 10,
      vector: queryVector,
      includeMetadata: true,
    });

    const context = results.matches
      .map((match) => match?.metadata?.text || "")
      .join("\n\n---\n\n");

    History.push({ role: "user", parts: [{ text: question }] });

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: History,
      config: {
        systemInstruction: `You are a resume analysis expert.
You will be given a context from the resume and a user question.
Answer ONLY based on this context.
If no answer, say: "I could not find the answer in the provided document.".

Context: ${context}`,
      },
    });

    const response = await result.response;
    const text = await response.text();

    History.push({ role: "model", parts: [{ text }] });

    res.json({ answer: text });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Query failed" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Frontend is available at: https://resume-analyzer-frontend-1iwb.onrender.com");
});
