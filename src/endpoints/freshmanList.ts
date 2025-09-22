import { Num, OpenAPIRoute } from "chanfana";
import { pageQuery } from "database";
import type { Context } from "hono";
import { z } from "zod";
import type { Env } from "../../worker-configuration";
import { FreshmanRecord } from "../types";

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
							list: z.array(FreshmanRecord),
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
		const { ACTIVE_DB: db } = request.env as Env;
		try {
			const pageSize = 10;
			return (await pageQuery(db, {
				from: "freshman",
				select: "*",
				...(page === undefined || page <= 0
					? {}
					: {
							limit: pageSize,
							offset: pageSize * (page - 1),
						}),
			})) satisfies {
				total: number;
			};
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
