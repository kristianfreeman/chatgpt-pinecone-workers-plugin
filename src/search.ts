import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { OpenAPIRoute, Query } from "@cloudflare/itty-router-openapi";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { VectorDBQAChain } from "langchain/chains";

export class GetSearch extends OpenAPIRoute {
	static schema = {
		tags: ["Search"],
		summary: "Make health queries against Huberman Lab podcast transcripts",
		parameters: {
			q: Query(String, {
				description: "The query to search for",
				default: "how do I sleep better?",
			}),
		},
		responses: {
			"200": {
				schema: {
					text: 'Example content',
					sourceDocuments: [
						{
							pageContent: 'Example content',
							metadata: {
								id: '02. Master Your Sleep & Be More Alert When Awake.md'
							}
						}
					]
				},
			},
		},
	};

	async handle(request: Request, env, ctx, data: Record<string, any>) {
		const pinecone = new PineconeClient();

		await pinecone.init({
			environment: env.PINECONE_ENVIRONMENT,
			apiKey: env.PINECONE_API_KEY,
		});

		const pineconeIndex = pinecone.Index(env.PINECONE_INDEX_NAME)
		const vectorStore = await PineconeStore.fromExistingIndex(
			new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY }),
			{ pineconeIndex }
		);

		const model = new OpenAI({
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
	}
}
