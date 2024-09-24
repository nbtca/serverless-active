import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { JoinRequest } from "../types";
import { Context } from "hono";
import { Env } from "../../worker-configuration";
import { pageQuery } from "database";

export class FreshmanList extends OpenAPIRoute {
	schema = {
		tags: ["Freshman"],
		summary: "获取新人列表",
		request: {
			query: z.object({
				page: Num({
					description: "页码",
					default: -1
				}).optional()
			}),
		},
		responses: {
			"200": {
				description: "返回列表",
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
		const data = await this.getValidatedData<typeof this.schema>();
		const { page } = data.query;
		const { ACTIVE_DB: db } = request.env as Env;
		try {
			const pageSize = 10;
			return {
				success: true,
				list: await pageQuery(db, {
					from: "freshman",
					select: "*",
					...page < 0 ? {} : {
						limit: pageSize,
						offset: pageSize * (page - 1),
					}
				}),
			};
		} catch (error) {
			return {
				success: false,
				error: error.message,
			};
		}
	}
}
