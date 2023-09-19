import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { OpenAPIRoute, Query } from "@cloudflare/itty-router-openapi";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";
import { CloudflareKVCache } from "langchain/cache/cloudflare_kv";

export class GetSearch extends OpenAPIRoute {
	static schema = {
		tags: ["Search"],
		summary: "Make queries against your Notion workspace about your life",
		parameters: {
			q: Query(String, {
				description: "The query to search for",
				default: "What books should I read?",
			}),
		},
		responses: {
			"200": {
				schema: {
					text: 'Example content',
					sourceDocuments: [
						{
							pageContent: 'Example content',
							metadata: {}
						}
					]
				},
			},
		},
	};

	async handle(request: Request, env, ctx, data: Record<string, any>) {
		try {
			const pinecone = new PineconeClient();

			await pinecone.init({
				environment: env.PINECONE_ENVIRONMENT,
				apiKey: env.PINECONE_API_KEY,
			});

			const cache = new CloudflareKVCache(env.KV_NAMESPACE)

			const pineconeIndex = pinecone.Index(env.PINECONE_INDEX_NAME)
			const vectorStore = await PineconeStore.fromExistingIndex(
				new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY }),
				// @ts-ignore
				{ pineconeIndex }
			);

			const model = new OpenAI({
				cache,
				openAIApiKey: env.OPENAI_API_KEY,
			});

			const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
				k: 10,
				returnSourceDocuments: true,
			});

			const response = await chain.call({ query: data.q });

			return new Response(JSON.stringify(response), {
				headers: { "content-type": "application/json" },
			});
		} catch (err) {
			console.log(err.message)
			return new Response(err.message, { status: 500 });
		}
	}
}
