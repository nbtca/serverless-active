import {
	ZodBoolean,
	ZodDate,
	ZodNumber,
	type ZodRawShape,
	ZodString,
	type ZodType,
	type z,
} from "zod";

function toSqlType(type: ZodType): string {
	const name = type.constructor.name;
	if (name === ZodString.name) {
		return "TEXT";
	}
	if (name === ZodDate.name) {
		return "DATETIME";
	}
	if (name === ZodNumber.name) {
		return "REAL";
	}
	if (name === ZodBoolean.name) {
		return "BOOLEAN";
	}
	throw new Error(`Unsupported type: ${type}`);
}
export async function createTable<T extends ZodRawShape>(
	db: D1Database,
	tableName: string,
	schema: z.ZodObject<T>,
) {
	const columns = Object.entries(schema.shape).map(
		([name, type]: [string, ZodType]) => `${name} ${toSqlType(type)}`,
	);
	const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(", ")})`;
	console.log(sql);
	await db.exec(sql);
}

export async function checkTable<T extends ZodRawShape>(
	db: D1Database,
	tableName: string,
	schema: z.ZodObject<T>,
) {
	const columns = Object.entries(schema.shape).map(
		([name, type]: [string, ZodType]) => `${name} ${toSqlType(type)}`,
	);
	const sql = `PRAGMA table_info(${tableName})`;
	const result = (await db.prepare(sql).all()).results;
	if (result.length === 0) {
		// If the table does not exist, create it
		await createTable(db, tableName, schema);
		return;
	}
	const columnNames = result.map((row) => row.name);
	const missingColumns = columns.filter(
		// Compare the columns
		(column) => !columnNames.includes(column.split(" ")[0]),
	);
	if (missingColumns.length > 0) {
		for (const column of missingColumns) {
			// Add missing columns
			const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${column}`;
			console.log(alterSql);
			await db.exec(alterSql);
		}
	}
}
