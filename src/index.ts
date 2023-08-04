import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { GetSearch } from "./search";
import { IndexToPinecone } from './pinecone'

export const router = OpenAPIRouter({
	schema: {
		info: {
			title: "Notion Search",
			description:
				"A plugin that allows the user to index their Notion workspace and query it",
			version: "v0.0.1",
		},
	},
	docs_url: "/",
	aiPlugin: {
		name_for_human: "Notion Search",
		name_for_model: "notionsearch",
		description_for_human: "Notion Workspace Search",
		description_for_model:
			"Query your Notion workspace from ChatGPT.",
		contact_email: "support@example.com",
		legal_info_url: "http://www.example.com/legal",
		logo_url: "https://workers.cloudflare.com/resources/logo/logo.svg",
	},
});

router.get("/search", GetSearch);
router.original.get("/pinecone", IndexToPinecone);

// 404 for everything else
router.all("*", () => new Response("Not Found.", { status: 404 }));

export default {
	fetch: router.handle,
};
