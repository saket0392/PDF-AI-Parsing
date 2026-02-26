**🧠 AI PDF Chat (RAG Application)**

An AI-powered PDF chat application that allows users to upload multiple PDF documents and interact with them using Retrieval-Augmented Generation (RAG).

**🚀 Features**

Upload multiple PDFs
Automatic text chunking
OpenAI embeddings (text-embedding-3-small)
Cosine similarity semantic search
Context-aware answers via gpt-4o-mini
Multi-document querying
Persistent chat session (localStorage)
Fully deployed (Frontend + Backend)

**🛠 Tech Stack**

Frontend: React (Vite), TailwindCSS
Backend: Node.js, Express
Database: MongoDB Atlas
AI: OpenAI API (Embeddings + GPT-4o-mini)
Deployment: Vercel (Frontend), Render (Backend)

**🏗 How It Works**

PDFs are uploaded and parsed.
Text is chunked (~500 words per chunk).
Each chunk is converted into embeddings.
Embeddings are stored in MongoDB.
User question → embedding → cosine similarity search.
Top relevant chunks are injected into GPT for response generation.

**📚 What This Project Demonstrates**

Retrieval-Augmented Generation (RAG)
Vector similarity search
Embedding-based information retrieval
Full-stack AI system deployment
Production-level CORS handling & environment config

**👤 Author**
Saket Kumar
