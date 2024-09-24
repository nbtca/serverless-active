import { fromHono } from "chanfana";
import { Hono } from "hono";
import { FreshmanAdd } from "./endpoints/freshmanAdd";
// import { TaskDelete } from "./endpoints/freshmanDelete";
// import { FreshmanFetch } from "./endpoints/freshmanFetch";
import { FreshmanList } from "./endpoints/freshmanList";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
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
