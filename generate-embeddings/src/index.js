import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";

import Dotenv from 'dotenv'
import fs from 'fs'
Dotenv.config()

const VECTOR_SIZE = 1536
const pinecone = new PineconeClient();

async function createIndex(dimension) {
  const indexes = await pinecone.listIndexes()
  const index = indexes.find(i => i === process.env.PINECONE_INDEX_NAME)

  if (!index) {
    console.log("Existing index not found. Creating a new index.")
    const createRequest = {
      name: process.env.PINECONE_INDEX_NAME,
      dimension,
      metric: "euclidean",
    }
    await pinecone.createIndex({ createRequest })
    console.log("Your index has been created. Please wait a few minutes for it to become ready... document creation may fail in the meantime.")
  }
}

async function generatePineconeDocumentForDoc(doc) {
  const filename = `./docs/${doc}`
  console.log(`Generating pinecone document for ${filename}`)

  const loader = new TextLoader(filename);
  const splitter = new RecursiveCharacterTextSplitter()
  const docs = await loader.load();
  const splitDocs = await splitter.splitDocuments(docs)

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME)
  const res = await PineconeStore.fromDocuments(
    splitDocs,
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );

  return res
}

async function main() {
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  await createIndex(VECTOR_SIZE)

  const docs = fs.readdirSync("./docs")

  for (const doc of docs) {
    await generatePineconeDocumentForDoc(doc)
  }

  console.log("completed")
}

main()
