import type { z } from "zod";
import type { Env } from "../../worker-configuration";
import type { JoinRequest } from "../types";

export interface EmailData {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

// Function to get Lark access token
async function getLarkAccessToken(env: Env): Promise<string | null> {
	try {
		const response = await fetch(
			"https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					app_id: env.LARK_APP_ID,
					app_secret: env.LARK_APP_SECRET,
				}),
			},
		);

		const result = await response.json();
		if (result.code === 0) {
			return result.app_access_token;
		}
		console.error("Failed to get Lark access token:", result);
		return null;
	} catch (error) {
		console.error("Error getting Lark access token:", error);
		return null;
	}
}

export async function sendEmail(
	env: Env,
	emailData: EmailData,
): Promise<boolean> {
	try {
		// Get access token first
		const accessToken = await getLarkAccessToken(env);
		if (!accessToken) {
			console.error("Failed to obtain Lark access token");
			return false;
		}

		// Send email via Lark Mail API
		const response = await fetch(
			"https://open.feishu.cn/open-apis/mail/v1/user_mailboxes/send",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					to: [emailData.to],
					subject: emailData.subject,
					body: emailData.html,
					body_type: "html",
					from: env.EMAIL_FROM,
				}),
			},
		);

		const result = await response.json();
		if (response.ok && result.code === 0) {
			return true;
		}

		console.error("Failed to send email via Lark:", result);
		return false;
	} catch (error) {
		console.error("Failed to send email:", error);
		return false;
	}
}

export function generateWelcomeEmail(
	joinRequest: z.infer<typeof JoinRequest>,
): EmailData {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>欢迎加入NBTCA计协</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <img style="height: 175px; display: block; margin: 0 auto;" src="https://www.nbtca.space/_astro/nbtca.BfIAeE3P.gif" alt="nbtca" />
    </div>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">欢迎加入NBTCA计协！</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">感谢您的加入，让我们一起探索技术的无限可能</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0; margin-bottom: 20px; font-size: 20px;">您的申请信息</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d; width: 80px;">姓名：</td>
                <td style="padding: 10px 0;">${joinRequest.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d;">学号：</td>
                <td style="padding: 10px 0;">${joinRequest.number}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d;">专业：</td>
                <td style="padding: 10px 0;">${joinRequest.major}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d;">班级：</td>
                <td style="padding: 10px 0;">${joinRequest.class}</td>
            </tr>
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d;">手机：</td>
                <td style="padding: 10px 0;">${joinRequest.phone}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #6c757d;">QQ：</td>
                <td style="padding: 10px 0;">${joinRequest.qq}</td>
            </tr>
        </table>
    </div>
    
    <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
        <h3 style="margin-top: 0; color: #007bff; font-size: 18px;">接下来的步骤</h3>
        <ul style="margin: 15px 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">我们会在3个工作日内审核您的申请</li>
            <li style="margin-bottom: 8px;">审核通过后会有相关负责人联系您</li>
            <li style="margin-bottom: 8px;">请保持QQ和手机畅通，以便我们联系您</li>
        </ul>
    </div>
    
    <div style="text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <div style="margin-bottom: 15px;">
            <img src="https://www.nbtca.space/_astro/nbtca.BfIAeE3P.gif" style="height: 50px;" alt="nbtca">
        </div>
        <h2 style="font-size: 20px; font-weight: bold; margin: 0; color: #333;">计协开发部</h2>
        <p style="font-size: 14px; color: #666666; line-height: 1.5; margin-top: 10px;">
            负责设计和开发社团的技术项目，包括网站、应用程序、运维、项目实践等。
        </p>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
            如有疑问，请联系我们：<a href="mailto:contact@nbtca.space" style="color: #007bff;">contact@nbtca.space</a>
        </p>
    </div>
</body>
</html>
`;

	const text = `
欢迎加入NBTCA计协！

感谢您的加入，让我们一起探索技术的无限可能。

您的申请信息：
姓名：${joinRequest.name}
学号：${joinRequest.number}
专业：${joinRequest.major}
班级：${joinRequest.class}
手机：${joinRequest.phone}
QQ：${joinRequest.qq}

接下来的步骤：
- 我们会在3个工作日内审核您的申请
- 审核通过后会有相关负责人联系您
- 请保持QQ和手机畅通，以便我们联系您

如有疑问，请联系我们：contact@nbtca.space

NBTCA计协开发部
负责设计和开发社团的技术项目，包括网站、应用程序、运维、项目实践等。
`;

	return {
		to: joinRequest.email,
		subject: "欢迎加入NBTCA计协 - 申请已收到",
		html,
		text,
	};
}
