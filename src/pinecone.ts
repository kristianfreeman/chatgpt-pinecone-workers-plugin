import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";

class IndexToPineconeHandler {
  VECTOR_SIZE = 1536;
  #env: Record<string, string> = {};
  pinecone = new PineconeClient();

  async createIndex(dimension) {
    const indexes = await this.pinecone.listIndexes()
    const index = indexes.find(i => i === this.#env.PINECONE_INDEX_NAME)

    if (!index) {
      console.log("Existing index not found. Creating a new index.")
      const createRequest = {
        name: this.#env.PINECONE_INDEX_NAME,
        dimension,
        metric: "euclidean",
      }
      await this.pinecone.createIndex({ createRequest })
      console.log("Your index has been created. Please wait a few minutes for it to become ready... document creation may fail in the meantime.")
    } else {
      console.log("Existing index found. Skipping index creation.")
    }
  }

  async generatePineconeDocumentsForNotion() {
    console.log("Loading documents from Notion...")

    const pageLoader = new NotionAPILoader({
      clientOptions: {
        auth: this.#env.NOTION_INTEGRATION_TOKEN
      },
      id: this.#env.NOTION_PAGE_ID,
      type: "page",
    });

    const pageDocs = await pageLoader.loadAndSplit();

    console.log(`Loaded ${pageDocs.length} documents from Notion.`)

    const pineconeIndex = this.pinecone.Index(this.#env.PINECONE_INDEX_NAME)
    const res = await PineconeStore.fromDocuments(
      pageDocs,
      new OpenAIEmbeddings({
        openAIApiKey: this.#env.OPENAI_API_KEY,
      }),
      { pineconeIndex }
    );

    console.log(`Created documents in Pinecone.`)

    return res
  }

  async handle(request: Request, env, ctx) {
    this.#env = env;

    const unauthorized = () => new Response("Unauthorized", { status: 401 })

    const authHeader = request.headers.get("Authorization")
    const authToken = this.#env.AUTHORIZATION

    if (authToken && !authHeader) return unauthorized()

    if (authHeader && authToken) {
      const parsedBearer = authHeader.split("Bearer ")[1]
      if (parsedBearer !== authToken) return unauthorized()
    }

    await this.pinecone.init({
      environment: this.#env.PINECONE_ENVIRONMENT,
      apiKey: this.#env.PINECONE_API_KEY,
    });

    await this.createIndex(this.VECTOR_SIZE)
    await this.generatePineconeDocumentsForNotion()

    return new Response("Done!")
  }
}

export const IndexToPinecone = (request, env, ctx) => {
  const handler = new IndexToPineconeHandler();
  return handler.handle(request, env, ctx);
}