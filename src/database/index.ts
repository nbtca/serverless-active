
import {
    DateTime, Str, Int, Bool, DateOnly, Num,
} from "chanfana";
import {
    z, ZodString, ZodType, ZodDate, ZodBoolean, ZodNumber,
} from "zod";
function toSqlType(type: ZodType): string {
    const name = type.constructor.name;
    if (name === ZodString.name) {
        return "TEXT";
    } else if (name === ZodDate.name) {
        return "DATETIME";
    }
    else if (name === ZodNumber.name) {
        return "REAL";
    }
    else if (name === ZodBoolean.name) {
        return "BOOLEAN";
    }
    throw new Error(`Unsupported type: ${type}`);
}
export async function createTable(db: D1Database, tableName: string, schema: z.ZodObject<any, any>) {
    const columns = Object.entries(schema.shape).map(([name, type]: [string, ZodType]) => `${name} ${toSqlType(type)}`);
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(", ")})`;
    console.log(sql);
    await db.exec(sql);
}

export async function compareTable(db: D1Database, tableName: string, schema: z.ZodObject<any, any>) {
    const columns = Object.entries(schema.shape).map(([name, type]: [string, ZodType]) => `${name} ${toSqlType(type)}`);
    const sql = `PRAGMA table_info(${tableName})`;
    const result = (await db.prepare(sql).all()).results;
    if (result.length === 0) {
        await createTable(db, tableName, schema);
        return;
    }
    const columnNames = result.map((row) => row.name);
    const missingColumns = columns.filter((column) => !columnNames.includes(column.split(" ")[0]));
    if (missingColumns.length > 0) {
        for (const column of missingColumns) {
            const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${column}`;
            console.log(alterSql);
            await db.exec(alterSql);
        }
    }
}
import { _condition_to_sql, _select_columns_to_sql, Condition, Row, Value, } from "sqlite-cloudflare-d1";
async function all(db: D1Database, query: string, values: Value[]) {
    try {
        const { results, success, error } = await db
            .prepare(query)
            .bind(...values)
            .all();

        if (!success) {
            throw new Error(error + "\n" + query);
        }

        return results as Row[];
    } catch (error: any) {
        error.message += "\n" + query;
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
        offset
    }: {
        select?: string | string[] | Record<string, string>;
        from: string;
        group_by?: string;
        where?: Condition | Condition[];
        having?: Condition | Condition[];
        limit?: number;
        offset?: number;
    }
) {
    const sql_: string[] = [];
    const values_: Value[] = [];
    if (where) {
        const { sql, values } = _condition_to_sql(where);
        sql_.push("WHERE", sql);
        values_.push(...values);
    }
    if (group_by) {
        sql_.push("GROUP BY", group_by);
        if (having) {
            const { sql, values } = _condition_to_sql(having);
            sql_.push("HAVING", sql);
            values_.push(...values);
        }
    }
    const countQuery_ = ["SELECT COUNT(*) as count FROM", ...sql_].join(" ") + ";";
    const count = (await all(db, countQuery_, values_))[0].count as number;
    if (limit !== undefined) {
        sql_.push("LIMIT", "?");
        values_.push(limit);
    }
    if (offset !== undefined) {
        sql_.push("OFFSET", "?");
        values_.push(offset);
    }
    const query_ = ["SELECT", _select_columns_to_sql(select), "FROM", from, ...sql_].join(" ") + ";";
    return {
        count,
        list: await all(db, query_, values_)
    };
}

