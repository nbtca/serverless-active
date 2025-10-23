import { Bool, Num, OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";
import type { Env } from "../../worker-configuration";
import { type Database, JoinRequest } from "../types";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export class FreshmanList extends OpenAPIRoute {
	schema = {
		tags: ["Freshman"],
		summary: "获取新人列表",
		request: {
			query: z.object({
				page: Num({
					description: "页码",
					default: undefined,
				}).optional(),
			}),
		},
		responses: {
			"200": {
				description: "返回列表",
				content: {
					"application/json": {
						schema: z.object({
							list: z.array(JoinRequest),
							total: z.number(),
						}),
					},
				},
			},
			"500": {
				description: "服务器错误",
				content: {
					"application/json": {
						schema: z.object({
							error: z.string(),
							stacks: z.string(),
						}),
					},
				},
			},
		},
	};
	async handle(request: Context) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { page } = data.query;
		const env = request.env as Env;
		const db = new Kysely<Database>({
			dialect: new D1Dialect({ database: env.ACTIVE_DB as D1Database }),
		});
		try {
			const query = db.selectFrom("freshman");
			const pageSize = 10;
			if (page === undefined || page <= 0) {
				return await query.selectAll().execute();
			}
			return await query
				.selectAll()
				.limit(pageSize)
				.offset(pageSize * (page - 1))
				.execute();
		} catch (error) {
			return request.json(
				{
					error: error.message,
					stacks: error.stack,
				},
				500,
			);
		}
	}
}
