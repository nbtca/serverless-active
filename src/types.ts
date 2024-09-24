import { DateTime, Str } from "chanfana";
import { number, z } from "zod";

// export const Task = z.object({
// 	name: Str({ example: "lorem" }),
// 	slug: Str(),
// 	description: Str({ required: false }),
// 	completed: z.boolean().default(false),
// 	due_date: DateTime(),
// });
export const JoinRequest = z.object({
	name: Str({ example: "lorem" }),
	number: Str({ example: "3240000000" }),
	email: Str({ example: "xxx@qq.com" }),
	phone: Str({ example: "12345678901" }),
	qq: Str({ example: "123456789" }),
});