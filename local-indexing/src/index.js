import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";

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
  } else {
    console.log("Existing index found. Skipping index creation.")
  }
}

async function generatePineconeDocumentsForNotion() {
  console.log("Loading documents from Notion...")

  const pageLoader = new NotionAPILoader({
    clientOptions: {
      auth: process.env.NOTION_INTEGRATION_TOKEN
    },
    id: process.env.NOTION_PAGE_ID,
    type: "page",
  });

  const pageDocs = await pageLoader.loadAndSplit();

  console.log(`Loaded ${pageDocs.length} documents from Notion.`)

  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME)
  const res = await PineconeStore.fromDocuments(
    pageDocs,
    new OpenAIEmbeddings(),
    { pineconeIndex }
  );

  console.log(`Created documents in Pinecone.`)

  return res
}

async function main() {
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  await createIndex(VECTOR_SIZE)
  await generatePineconeDocumentsForNotion()

  console.log("Completed.")
}

main()
