import React, { useState } from "react";
import axios from "axios"; // import axios for HTTP requests
import {
  Upload,
  FileText,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a PDF file.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      await axios.post("https://resume-analyzer-2wos.onrender.com/upload", formData);
      setUploaded(true);
      showToast("Resume uploaded successfully!", "success");
    } catch (error) {
      console.error("Upload failed:", error);
      showToast("Failed to upload resume.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!question.trim()) {
      showToast("Please enter a question.", "error");
      return;
    }

    setIsQuerying(true);
    try {
      const response = await fetch("https://resume-analyzer-2wos.onrender.com/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data.answer);
      } else {
        throw new Error("Query failed");
      }
    } catch (error) {
      console.error("Query failed:", error);
      showToast("Failed to get response.", "error");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
            Resume Analysis System
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload your resume and ask intelligent questions to get instant
            insights and analysis
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl mr-4">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Upload Resume</h2>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-blue-50/50 hover:bg-blue-100/50 transition-all duration-300 group"
              >
                <Upload className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-600">
                  {file ? file.name : "Click to select PDF file"}
                </span>
                <span className="text-xs text-gray-500 mt-1">PDF files only</span>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Resume</span>
                </>
              )}
            </button>

            {uploaded && (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-green-800 font-medium">
                  Resume uploaded successfully!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Query Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-xl mr-4">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Ask Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about this resume?"
                className="w-full py-4 px-6 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 bg-white/70"
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleQuery()}
              />
            </div>

            <button
              onClick={handleQuery}
              disabled={!uploaded || !question.trim() || isQuerying}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              {isQuerying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  <span>Ask Question</span>
                </>
              )}
            </button>

            {!uploaded && (
              <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-3" />
                <span className="text-amber-800 font-medium">
                  Please upload a resume first
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        {response && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-xl mr-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Analysis Result</h2>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">Powered by AI • Secure file processing • Instant analysis</p>
        </div>

        {/* Toast Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center p-4 rounded-2xl shadow-lg backdrop-blur-sm border transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full ${
                toast.type === "success"
                  ? "bg-green-50/90 border-green-200 text-green-800"
                  : toast.type === "error"
                  ? "bg-red-50/90 border-red-200 text-red-800"
                  : "bg-blue-50/90 border-blue-200 text-blue-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {toast.type === "info" && (
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
