import { Bool, OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { insert } from "sqlite-cloudflare-d1";
import { z } from "zod";
import type { Env } from "../../worker-configuration";
import { checkTable } from "../database";
import { JoinRequest } from "../types";
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
		const db = env.ACTIVE_DB as D1Database;
		try {
			await checkTable(db, "freshman", JoinRequest);
			const row = await insert(db, {
				into: "freshman",
				data: {
					...dataToCreate,
					time: new Date().toISOString(),
				},
			});
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
