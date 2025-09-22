import { fromHono } from "chanfana";
import { Hono } from "hono";
import { FreshmanAdd } from "./endpoints/freshmanAdd";
// import { TaskDelete } from "./endpoints/freshmanDelete";
// import { FreshmanFetch } from "./endpoints/freshmanFetch";
import { FreshmanList } from "./endpoints/freshmanList";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
app.use("*", async (c, next) => {
	c.res.headers.set("Access-Control-Allow-Origin", "*");
	c.res.headers.set(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS",
	);
	c.res.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	if (c.req.method === "OPTIONS") {
		return c.newResponse("OK", 200, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});
	}
	await next();
});
const openapi = fromHono(app, {
	docs_url: "/docs",
});
// Register OpenAPI endpoints
openapi.post("/api/freshman", FreshmanAdd);
openapi.get("/api/freshman", FreshmanList);
// openapi.get("/api/freshman/:name", FreshmanFetch);
// openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Export the Hono app
export default app;
