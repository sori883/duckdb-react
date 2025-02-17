import * as duckdb from "@duckdb/duckdb-wasm";

export async function createCsvTable (db: duckdb.AsyncDuckDB, content: Uint8Array, tableName: string) {
  await db.registerFileBuffer("uploaded_csv", content);
  const conn = await db.connect();
  const isExists = await conn.query(`SELECT EXISTS ( SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}' ) as is_exists;`);
  if (!isExists.toArray()[0].is_exists) {
    await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_csv('uploaded_csv');`);
  }
  await conn.close();
}