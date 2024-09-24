import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { JoinRequest } from "../types";
import { Context } from "hono";
import { Env } from "../../worker-configuration";
import { insert } from "sqlite-cloudflare-d1";

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
							series: z.object({
								success: Bool(),
								result: z.object({
									task: JoinRequest,
								}),
							}),
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
		// create a new freshman
		// const sql = db.prepare("INSERT INTO freshman (name, number, email, phone, qq) VALUES (?, ?, ?, ?, ?)");
		// sql.bind(taskToCreate.name, taskToCreate.number, taskToCreate.email, taskToCreate.phone, taskToCreate.qq);
		// const result = await sql.run();
		try {
			const row = await insert(db, {
				into: "freshman",
				data: dataToCreate,
			});
			return {
				success: true,
				result: row
			};
		} catch (error) {
			if (error.message === 'D1_ERROR: no such table: freshman: SQLITE_ERROR') {
				db.exec("CREATE TABLE IF NOT EXISTS freshman (name TEXT, number TEXT, email TEXT, phone TEXT, qq TEXT)");
				const row = await insert(db, {
					into: "freshman",
					data: dataToCreate,
				});
				return {
					success: true,
					result: row
				};
			}
			return {
				success: false,
				error: error.toString(),
			};
		}
	}
}
