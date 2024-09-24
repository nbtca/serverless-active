
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