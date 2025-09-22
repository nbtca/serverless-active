import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { insert } from "sqlite-cloudflare-d1";
import { z } from "zod";
import type { Env } from "../../worker-configuration";
import { checkTable } from "../database";
import { FreshmanRecord, JoinRequest } from "../types";

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
							result: FreshmanRecord.optional(),
							error: z.string().optional(),
							requiresCaptcha: z.boolean().optional(),
						}),
					},
				},
			},
		},
	};

	// Simple captcha validation (you can replace with more sophisticated validation)
	private validateCaptcha(captcha: string): boolean {
		// For demo purposes, we'll accept any 6-character string
		// In production, this should validate against a proper captcha service
		return captcha && captcha.length >= 6;
	}

	// Check if this is a duplicate submission based on email, phone, or student number
	private async isDuplicateSubmission(
		db: D1Database,
		data: z.infer<typeof JoinRequest>,
	): Promise<boolean> {
		try {
			const query = `
				SELECT COUNT(*) as count 
				FROM freshman 
				WHERE email = ? OR phone = ? OR number = ?
			`;
			const result = await db
				.prepare(query)
				.bind(data.email, data.phone, data.number)
				.first<{ count: number }>();

			return (result?.count || 0) > 0;
		} catch (error) {
			console.error("Error checking duplicate submission:", error);
			return false;
		}
	}

	async handle(request: Context) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();
		// Retrieve the validated request body
		const dataToCreate = data.body;
		// Implement your own object insertion here
		const env = request.env as Env;
		const db = env.ACTIVE_DB as D1Database;

		try {
			await checkTable(db, "freshman", FreshmanRecord);

			// Check for duplicate submission
			const isDuplicate = await this.isDuplicateSubmission(db, dataToCreate);

			if (isDuplicate) {
				// If duplicate and no captcha provided, require captcha
				if (!dataToCreate.captcha) {
					return {
						success: false,
						error: "重复提交检测到，请输入验证码",
						requiresCaptcha: true,
					};
				}

				// If duplicate and captcha provided, validate captcha
				if (!this.validateCaptcha(dataToCreate.captcha)) {
					return {
						success: false,
						error: "验证码无效，请重新输入",
						requiresCaptcha: true,
					};
				}
			}

			// Prepare data for insertion (exclude captcha from database)
			const { captcha: _captcha, ...dataForDB } = dataToCreate;
			const recordToInsert = {
				...dataForDB,
				submissionTime: new Date(),
			};

			const row = await insert(db, {
				into: "freshman",
				data: recordToInsert,
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
