import * as duckdb from "@duckdb/duckdb-wasm";

export async function copyCsv (db: duckdb.AsyncDuckDB, sql: string, fileName: string) {
  const conn = await db.connect();
  await conn.query(`copy (${sql}) to '${fileName}' (HEADER, DELIMITER ',');`);
  const csv_buffer = await db.copyFileToBuffer(fileName);
  const blob = new Blob([ csv_buffer ], { type: "text/plain" });
  await conn.close();

  const url = URL.createObjectURL(blob);
  return url;
}