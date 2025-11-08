import { Str } from "chanfana";
import { z } from "zod";

export const JoinRequest = z.object({
	name: Str({ example: "lorem", description: "姓名（必填）" }).min(1, "姓名不能为空"),
	number: Str({ example: "3240000000", description: "学号（必填）" }).min(1, "学号不能为空"),
	major: Str({ example: "计算机科学与技术", description: "专业（必填）" }).min(1, "专业不能为空"),
	class: Str({ example: "计科2001", description: "班级（必填）" }).min(1, "班级不能为空"),
	email: Str({ example: "xxx@qq.com", description: "邮箱（必填）" }).min(1, "邮箱不能为空").email("邮箱格式不正确"),
	phone: Str({ example: "12345678901" }).optional(),
	qq: Str({ example: "123456789" }).optional(),
	memo: Str({ example: "lorem ipsum" }).optional(),
	time: Str({ example: "2025-10-17T00:00:00.000Z", description: "提交时间" }).optional(),
});
export interface Database{
	freshman: z.infer<typeof JoinRequest>;
}