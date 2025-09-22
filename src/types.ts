import { Str } from "chanfana";
import { z } from "zod";

export const JoinRequest = z.object({
	name: Str({ example: "lorem" }),
	number: Str({ example: "3240000000" }),
	major: Str({ example: "计算机科学与技术" }),
	class: Str({ example: "计科2001" }),
	email: Str({ example: "xxx@qq.com" }),
	phone: Str({ example: "12345678901" }),
	qq: Str({ example: "123456789" }),
	memo: Str({ example: "lorem ipsum" }),
	captcha: Str({ example: "abc123" }).optional(),
});

// Database schema that includes the submission time
export const FreshmanRecord = z.object({
	name: z.string(),
	number: z.string(),
	major: z.string(),
	class: z.string(),
	email: z.string(),
	phone: z.string(),
	qq: z.string(),
	memo: z.string(),
	submissionTime: z.date(),
});
