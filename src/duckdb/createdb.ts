import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";


export async function createdb () {
  const worker = new Worker(duckdb_worker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(duckdb_wasm);
  await db.open({
    path: "opfs://duckdb-wasm.db",
    accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
  });

  return {
    worker,
    logger,
    db
  };
}