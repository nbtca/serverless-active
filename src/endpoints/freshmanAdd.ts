import { Kysely } from "kysely";
import type { D1Database } from "@cloudflare/workers-types/experimental";
import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import { checkTable } from "../database";
import { type Database, JoinRequest } from "../types";
import { D1Dialect } from "kysely-d1";
export class FreshmanAdd extends OpenAPIRoute {
	schema = {
		tags: ["Freshman"],
		summary: "添加新人",
		request: {
			body: {
				content: {
					"application/json": {
						schema: JoinRequest,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "返回创建结果",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							result: JoinRequest.optional(),
							error: z.string().optional(),
						}),
					},
				},
			},
		},
	};
	async handle(request: Context) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();
		// Retrieve the validated request body
		const dataToCreate = data.body;
		// Implement your own object insertion here
		const env = request.env as Env;
		const db = new Kysely<Database>({
			dialect: new D1Dialect({ database: env.ACTIVE_DB as D1Database }),
		});
		try {
			await checkTable(db, "freshman", JoinRequest);
			const row = await db
				.insertInto("freshman")
				.values({
					...dataToCreate,
					time: new Date().toISOString(),
				})
				.returningAll()
				.executeTakeFirst();
			return {
				success: true,
				result: row,
			};
		} catch (error) {
			return {
				success: false,
				error: error.toString(),
			};
		}
	}
}
