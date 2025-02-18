import * as duckdb from "@duckdb/duckdb-wasm";

export async function copyParquet (db: duckdb.AsyncDuckDB, sql: string, fileName: string) {
  const conn = await db.connect();
  await conn.query(`copy (${sql}) to '${fileName}' (FORMAT PARQUET);`);
  const json_buffer = await db.copyFileToBuffer(fileName);
  const blob = new Blob([ json_buffer ], { type: "application/octet-stream" });
  await conn.close();

  const url = URL.createObjectURL(blob);
  return url;
}