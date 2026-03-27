import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { bearer } from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Env } from "../worker-configuration";

/**
 * 每次请求时创建 better-auth 实例。
 * Cloudflare Workers 的 D1 binding 仅在请求上下文中可用，
 * 因此无法在模块顶层初始化，必须在请求处理器内调用此工厂函数。
 */
export function createAuth(env: Env) {
	const db = new Kysely({
		dialect: new D1Dialect({ database: env.ACTIVE_DB }),
	});

	return betterAuth({
		database: kyselyAdapter(db, { type: "sqlite" }),
		secret: env.BETTER_AUTH_SECRET,
		plugins: [
			bearer(),
			genericOAuth({
				config: [
					{
						providerId: "logto",
						clientId: env.LOGTO_CLIENT_ID,
						clientSecret: env.LOGTO_CLIENT_SECRET,
						discoveryUrl: `${env.LOGTO_ISSUER}/.well-known/openid-configuration`,
						pkce: true,
					},
				],
			}),
		],
	});
}
