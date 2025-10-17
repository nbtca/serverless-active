import type { D1Database } from "@cloudflare/workers-types/experimental";
import { OpenAPIRoute } from "chanfana";
import type { Context } from "hono";
import { insert } from "sqlite-cloudflare-d1";
import { z } from "zod";
import type { Env } from "../../worker-configuration";
import { checkTable } from "../database";
import { generateWelcomeEmail, sendEmail } from "../services/emailService";
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
							emailSent: z.boolean().optional(),
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

			// Send welcome email after successful database insertion
			let emailSent = false;
			try {
				const emailData = generateWelcomeEmail(dataToCreate);
				emailSent = await sendEmail(env, emailData);
				if (!emailSent) {
					console.warn("Failed to send welcome email to:", dataToCreate.email);
				}
			} catch (emailError) {
				console.error("Email sending error:", emailError);
				// Don't fail the entire request if email fails
			}

			return {
				success: true,
				result: row,
				emailSent,
			};
		} catch (error) {
			return {
				success: false,
				error: error.toString(),
				emailSent: false,
			};
		}
	}
}
