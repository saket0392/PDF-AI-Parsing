import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [documentIds, setDocumentIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) setChatHistory(JSON.parse(saved));

    const savedDocs = localStorage.getItem("uploadedDocs");
    if (savedDocs) setUploadedDocs(JSON.parse(savedDocs));

    const savedIds = localStorage.getItem("documentIds");
    if (savedIds) setDocumentIds(JSON.parse(savedIds));
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("uploadedDocs", JSON.stringify(uploadedDocs));
  }, [uploadedDocs]);

  useEffect(() => {
    localStorage.setItem("documentIds", JSON.stringify(documentIds));
  }, [documentIds]);

  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleClearContext = () => {
    setChatHistory([]);
    setUploadedDocs([]);
    setDocumentIds([]);

    localStorage.removeItem("chatHistory");
    localStorage.removeItem("uploadedDocs");
    localStorage.removeItem("documentIds");
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      const res = await fetch("https://pdf-ai-parsing.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setUploadedDocs((prev) => [...prev, ...files.map((f) => f.name)]);
      if (data.documentIds) {
        setDocumentIds((prev) => [...prev, ...data.documentIds]);
      }

      setFiles([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setIsUploading(false);
  };

  const handleSend = async () => {
    if (!question.trim() || isTyping) return;

    const userMessage = {
      role: "user",
      content: question,
      time: nowTime(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsTyping(true);

    try {
      const res = await fetch("https://pdf-ai-parsing.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentIds }),
      });

      const data = await res.json();

      let text = "";
      const words = data.answer.split(" ");

      const assistantMessage = {
        role: "assistant",
        content: "",
        time: nowTime(),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);

      for (let i = 0; i < words.length; i++) {
        text += words[i] + " ";
        await new Promise((r) => setTimeout(r, 25));

        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = text;
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b1120] text-white flex flex-col">

      <div className="w-full border-b border-white/10 bg-[#0b1220]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          AI PDF Parsing Chat
        </h1>

        <button
          onClick={handleClearContext}
          className="text-xs md:text-sm bg-red-600/20 hover:bg-red-600/40 px-3 py-2 rounded-lg transition"
        >
          New Session
        </button>
      </div>

      {/* 🔹 Mobile Upload Bar */}
<div className="md:hidden p-4 border-b border-white/10 flex flex-col gap-3">

  <label className="w-full bg-[#1f2937] border border-gray-700 px-4 py-3 rounded-xl text-sm text-gray-300 cursor-pointer text-center">
    {files.length > 0 ? `${files.length} file(s) selected` : "Choose PDF files"}
    <input
      type="file"
      multiple
      onChange={handleFileChange}
      className="hidden"
    />
  </label>

  <button
    onClick={handleUpload}
    disabled={isUploading}
    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-3 rounded-xl font-medium transition"
  >
    {isUploading ? "Uploading..." : "Upload Files"}
  </button>

  {uploadedDocs.length > 0 && (
    <div className="mt-3 space-y-2 text-xs">
      {uploadedDocs.map((doc, i) => (
        <div
          key={i}
          className="bg-[#1f2937] px-3 py-2 rounded-lg flex justify-between items-center"
        >
          <span className="truncate">{doc}</span>
          <span className="text-green-400">✓</span>
        </div>
      ))}
    </div>
  )}

  {uploadSuccess && (
    <div className="text-green-400 text-xs text-center">
      ✅ Upload successful
    </div>
  )}
</div>
      <div className="flex flex-1">
        <div className="hidden md:flex w-72 flex-col bg-[#111827] border-r border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-6">📄 Documents</h2>

          <input type="file" multiple onChange={handleFileChange}
            className="text-sm file:bg-indigo-600 file:border-0 file:px-4 file:py-2 file:rounded-lg file:text-white" />

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>

          <div className="mt-8 space-y-2 text-sm">
            {uploadedDocs.map((doc, i) => (
              <div key={i} className="bg-[#1f2937] px-3 py-2 rounded-lg">
                {doc}
              </div>
            ))}
          </div>
        </div>

        
        <div className="flex-1 flex flex-col">

          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {chatHistory.map((msg, index) => (
              <div key={index}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>

                <div className={`max-w-[85%] md:max-w-[60%] px-4 py-3 rounded-2xl ${
                  msg.role === "user" ? "bg-indigo-600" : "bg-[#1f2937]"
                }`}>

                  <ReactMarkdown
                    components={{
                      strong: ({node, ...props}) => (
                        <strong className="font-semibold text-white" {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="mb-2" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="ml-4 list-disc" {...props} />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                </div>

                <span className="text-xs text-gray-400 mt-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="bg-[#1f2937] px-4 py-3 rounded-2xl w-fit">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          
          <div className="border-t border-white/10 p-4 bg-[#0f172a]">
            <div className="flex gap-3">
              <textarea
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none bg-[#1f2937] border border-gray-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={isTyping || documentIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-6 py-3 rounded-xl"
              >
                Send
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;