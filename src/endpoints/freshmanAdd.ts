import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { JoinRequest } from "../types";
import { Context } from "hono";
import { Env } from "../../worker-configuration";
import { insert } from "sqlite-cloudflare-d1";
import { compareTable as checkTable } from '../database';
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
				description: "Returns the created task",
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
		const env = request.env as Env
		const db = env.ACTIVE_DB as D1Database;
		try {
			await checkTable(db, 'freshman', JoinRequest);
			const row = await insert(db, {
				into: "freshman",
				data: dataToCreate,
			});
			return {
				success: true,
				result: row
			};
		} catch (error) {
			return {
				success: false,
				error: error.toString(),
			};
		}
	}
}
