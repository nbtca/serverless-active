import {
	_condition_to_sql,
	_select_columns_to_sql,
	type Condition,
	type Row,
	type Value,
} from "sqlite-cloudflare-d1";

async function all(db: D1Database, query: string, values: Value[]) {
	try {
		const { results, success, error } = await db
			.prepare(query)
			.bind(...values)
			.all();
		console.log(query);

		if (!success) {
			throw new Error(`${error}\n${query}`);
		}

		return results as Row[];
	} catch (error) {
		error.message += `\n${query}`;
		throw error;
	}
}
export async function pageQuery(
	db: D1Database,
	{
		select = "*",
		from,
		where,
		group_by,
		having,
		limit,
		offset,
	}: {
		select?: string | string[] | Record<string, string>;
		from: string;
		group_by?: string;
		where?: Condition | Condition[];
		having?: Condition | Condition[];
		limit?: number;
		offset?: number;
	},
) {
	const sqlList: string[] = ["FROM", from];
	const values: Value[] = [];
	if (where) {
		const { sql, values } = _condition_to_sql(where);
		sqlList.push("WHERE", sql);
		values.push(...values);
	}
	if (group_by) {
		sqlList.push("GROUP BY", group_by);
		if (having) {
			const { sql, values } = _condition_to_sql(having);
			sqlList.push("HAVING", sql);
			values.push(...values);
		}
	}
	const totalQuery = `${["SELECT COUNT(*) as count", ...sqlList].join(" ")};`;
	const total = (await all(db, totalQuery, values))[0].count as number;
	if (Number.isInteger(limit)) {
		sqlList.push("LIMIT", "?");
		values.push(limit);
	}
	if (Number.isInteger(offset)) {
		sqlList.push("OFFSET", "?");
		values.push(offset);
	}
	const query = `${["SELECT", _select_columns_to_sql(select), ...sqlList].join(
		" ",
	)};`;
	return {
		total,
		list: await all(db, query, values),
	};
}
