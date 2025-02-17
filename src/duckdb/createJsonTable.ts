import * as duckdb from "@duckdb/duckdb-wasm";

export async function createJsonTable (db: duckdb.AsyncDuckDB, content: Uint8Array, tableName: string) {
  await db.registerFileBuffer("uploaded_json", content);
  const conn = await db.connect();
  const isExists = await conn.query(`SELECT EXISTS ( SELECT 1 FROM information_schema.tables WHERE table_name = '${tableName}' ) as is_exists;`);
  if (!isExists.toArray()[0].is_exists) {
    await conn.query(`CREATE TABLE ${tableName} AS SELECT * FROM read_json('uploaded_json');`);
  }
  await conn.close();
}