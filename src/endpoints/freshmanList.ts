import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { JoinRequest } from "../types";
import { query } from "sqlite-cloudflare-d1";
import { Context } from "hono";
import { Env } from "../../worker-configuration";

export class FreshmanList extends OpenAPIRoute {
	schema = {
		tags: ["Freshman"],
		summary: "获取新人列表",
		request: {
			query: z.object({
				// page: Num({
				// 	description: "Page number",
				// 	default: 0,
				// }),
				// isCompleted: Bool({
				// 	description: "Filter by completed flag",
				// 	required: false,
				// }),
			}),
		},
		responses: {
			"200": {
				description: "Returns a list of tasks",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							list: z.array(JoinRequest),
						}),
					},
				},
			},
		},
	};

	async handle(request: Context) {
		// const data = await this.getValidatedData<typeof this.schema>();
		// const { page, isCompleted } = data.query;
		const env = request.env as Env;
		const db = env.ACTIVE_DB as D1Database;
		try {

			const result = await query(db, {
				from: "freshman",
				select: "*",
				// limit: 10, 
				// offset: 10 * page,
			});
			return {
				success: true,
				list: result,
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}
}
