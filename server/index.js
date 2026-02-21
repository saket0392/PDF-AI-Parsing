app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://pdf-ai-parsing-thfz.vercel.app"
  ],
  credentials: true
}));
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
require('dotenv').config();
const mongoose = require('mongoose');
const { OpenAI } = require('openai');

const mongoDb = require('./Connection');
const Document = require('./models/Document');
const Chunk = require('./models/Chunks');

mongoDb();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
const uploads = multer({ dest: 'uploads/' });
const port = 3000;

app.use(cors());
app.use(express.json());

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return dot / (normA * normB);
}

app.get('/', (req, res) => {
  res.send('hello world');
});



app.post('/upload', uploads.array('file'), async (req, res) => {

  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  try {

    const createdDocumentIds = [];

    for (let file of files) {

      if (file.mimetype !== 'application/pdf') {
        continue;
      }

      const textbuffer = fs.readFileSync(file.path);
      const data = await pdf(textbuffer);
      const extractedtext = data.text;

      const newDocument = await Document.create({
        filename: file.originalname,
      });

      createdDocumentIds.push(newDocument._id);

      const chunks = [];
      const paragraphs = extractedtext.split('\n\n');
      let currentchunk = '';

      for (let paragraph of paragraphs) {
        currentchunk += paragraph + ' ';
        const wordcount = currentchunk.trim().split(/\s+/).length;

        if (wordcount >= 500) {
          chunks.push(currentchunk.trim());
          currentchunk = '';
        }
      }

      if (currentchunk.trim().length > 0) {
        chunks.push(currentchunk.trim());
      }

      console.log(`Processing ${file.originalname} - chunks: ${chunks.length}`);

      for (let chunkText of chunks) {

        const response = await client.embeddings.create({
          model: "text-embedding-3-small",
          input: chunkText,
        });

        const embedding = response.data[0].embedding;

        await Chunk.create({
          text: chunkText,
          embedding: embedding,
          document: newDocument._id
        });
      }

      fs.unlinkSync(file.path);
    }

    res.status(200).json({
      message: "Files processed successfully",
      documentIds: createdDocumentIds,
      totalFiles: createdDocumentIds.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Upload failed" });
  }
});


app.post('/ask', async (req, res) => {

  const newques = req.body.question;
  const docids = req.body.documentIds;
  const history = req.body.history || [];
  if (!newques) {
    return res.status(400).json({ message: "No question provided" });
  }

  if (!Array.isArray(docids) || docids.length === 0) {
    return res.status(400).json({ message: "documentIds must be a non-empty array" });
  }

  try {

    const embques = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: newques,
    });

    const questionEmbedding = embques.data[0].embedding;
    const objectIds = docids.map(id => new mongoose.Types.ObjectId(id));

    const dbChunks = await Chunk.find({
      document: { $in: objectIds }
    }).lean();

    if (dbChunks.length === 0) {
      return res.status(404).json({ message: "No chunks found for given documents" });
    }

    const scoredChunks = dbChunks.map(chunk => ({
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding)
    }));

    scoredChunks.sort((a, b) => b.score - a.score);

    const topchunks = scoredChunks.slice(0, 3);

    const context = topchunks.map(c => c.text).join("\n\n");

    const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `
          You are an AI assistant helping users understand their uploaded documents.

          Rules:
          - You are NOT the person described in the document.
          - Never assume the identity of the document subject.
          - Refer to document subjects in third person.
          - If the question relates to the document, use the provided document context.
          - If the question is casual or unrelated, respond naturally like ChatGPT.
          `
              },

              {
                role: "system",
                content: `Document context:\n${context}`
              },

              ...history,

              {
                role: "user",
                content: newques
              }
            ],
          });

    const answer = response.choices[0].message.content;

    res.status(200).json({
      question: newques,
      answer: answer,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ask failed" });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});