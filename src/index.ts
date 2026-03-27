import { fromHono } from "chanfana";
import { Hono } from "hono";
import { FreshmanAdd } from "./endpoints/freshmanAdd";
// import { TaskDelete } from "./endpoints/freshmanDelete";
// import { FreshmanFetch } from "./endpoints/freshmanFetch";
import { FreshmanList } from "./endpoints/freshmanList";
import { Scalar } from "@scalar/hono-api-reference";
import { createAuth } from "./auth";
import type { Env } from "../worker-configuration";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// better-auth: 处理所有 /api/auth/* 路由（登录、回调、登出、session 等）
app.all("/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

// 保护 GET /api/freshman：要求有效的 session（支持 Bearer Token 和 Cookie）
app.use("/api/freshman", async (c, next) => {
	if (c.req.method !== "GET") return next();
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	return next();
});

// Setup OpenAPI registry
app.use("*", async (c, next) => {
	c.res.headers.set("Access-Control-Allow-Origin", "*");
	c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (c.req.method === "OPTIONS") {
		return c.newResponse("OK",
			200,
			{
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
			}
		);
	}
	await next();
});
const openapiUrl = "openapi.json";

const openapi = fromHono(app, {
	openapi_url: openapiUrl,
	docs_url: null,
	redoc_url: "redoc",
});

app.get("/docs", Scalar({ url: openapiUrl }));
// Register OpenAPI endpoints
openapi.post("/api/freshman", FreshmanAdd);
openapi.get("/api/freshman", FreshmanList);
// openapi.get("/api/freshman/:name", FreshmanFetch);
// openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Export the Hono app
export default app;
