import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { GetSearch } from "./search";

export const router = OpenAPIRouter({
	schema: {
		info: {
			title: "Huberman Lab Podcast Transcript Search",
			description:
				"A plugin that allows the user to search the Huberman Lab podcast transcripts.",
			version: "v0.0.1",
		},
	},
	docs_url: "/",
	aiPlugin: {
		name_for_human: "Huberman Lab Transcript Search",
		name_for_model: "hubermanlabpodcasttranscriptsearch",
		description_for_human: "Huberman Lab Podcast Transcript Search",
		description_for_model:
			"Query the Huberman Lab podcast transcripts for health information.",
		contact_email: "support@example.com",
		legal_info_url: "http://www.example.com/legal",
		logo_url: "https://workers.cloudflare.com/resources/logo/logo.svg",
	},
});

router.get("/search", GetSearch);

// 404 for everything else
router.all("*", () => new Response("Not Found.", { status: 404 }));

export default {
	fetch: router.handle,
};
