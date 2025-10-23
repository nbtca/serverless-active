import type { AlterTableColumnAlteringBuilder, Kysely } from "kysely";
import { sql } from "kysely";
import type { ColumnDataType } from "kysely";
import {
	ZodBoolean,
	ZodDate,
	ZodNumber,
	ZodOptional,
	type ZodRawShape,
	ZodString,
	type ZodType,
	type z,
} from "zod";
import { ZodArray, ZodBigInt } from "zod";

function toSqlType(type: ZodType): ColumnDataType {
	if (type instanceof ZodString) return "text";
	if (type instanceof ZodDate) return "datetime";
	if (type instanceof ZodNumber) return "real";
	if (type instanceof ZodBoolean) return "boolean";
	if (type instanceof ZodBigInt) return "bigint";
	if (type instanceof ZodArray) return "json";
	if (type instanceof ZodOptional) {
		return toSqlType(type._def.innerType);
	}
	throw new Error(`Unsupported type: ${type.constructor.name}`);
}
export async function createTable<
	DB,
	T extends keyof DB & string,
	R extends ZodRawShape = ZodRawShape,
>(db: Kysely<DB>, tableName: T, schema: z.ZodObject<R>) {
	let sql = db.schema.createTable(tableName).ifNotExists();
	for (const [name, type] of Object.entries(schema.shape)) {
		sql = sql.addColumn(name, toSqlType(type));
	}
	await sql.execute();
}

export async function checkTable<
	DB,
	T extends keyof DB & string,
	R extends ZodRawShape = ZodRawShape,
>(db: Kysely<DB>, tableName: T, schema: z.ZodObject<R>) {
	const columns = Object.entries(schema.shape).map(
		([name, type]: [string, ZodType]) =>
			[name, toSqlType(type)] as [string, ColumnDataType],
	);
	// const sql = `PRAGMA table_info(${tableName})`;
	const { rows: result } = await sql<{
		cid: number;
		name: string;
		type: string;
	}>`PRAGMA table_info(${sql.lit(tableName)});`.execute(db);
	// const result = (await db.selectNoFrom(sql<string>"").all()).results;
	if (result.length === 0) {
		// If the table does not exist, create it
		await createTable(db, tableName, schema);
		return;
	}
	const columnNames = result.map((row) => row.name);
	const missingColumns = columns.filter(
		// Compare the columns
		([columnName, _]) => !columnNames.includes(columnName),
	);
	if (missingColumns.length > 0) {
		let alterSql = db.schema.alterTable(
			tableName,
		) as unknown as AlterTableColumnAlteringBuilder;
		for (const [columnName, columnType] of missingColumns) {
			alterSql = alterSql.addColumn(columnName, columnType);
		}
		alterSql.execute();
	}
}
