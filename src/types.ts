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
	time: Str({ example: "2025-10-17T00:00:00.000Z", description: "提交时间" }).optional(),
});
export interface Database{
	freshman: z.infer<typeof JoinRequest>;
}