import { useRef, useState } from "react";

import { createdb } from "../duckdb/createdb";
import { createCsvTable } from "../duckdb/createCsvTable";
import { createJsonTable } from "../duckdb/createJsonTable";
import { createParquetTable } from "../duckdb/createParquet";

import { checkFileType } from "../utils/checkFileType";
import { convertFileToUint8Array } from "../utils/convertFileToUint8Array";

import Editor from "@monaco-editor/react";
import Button from "./elements/Button";

import type { editor } from "monaco-editor";

export default function Duckdb() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const deleteDirectory = async () => {

    // OPFSのファイルを削除する
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("duckdb-wasm.db", { recursive: true });
    await root.removeEntry("duckdb-wasm.db.wal", { recursive: true });
    alert("OPFS削除完了");
  };

  const execSql = async () => {
    const { db } = await createdb();
    const conn = await db.connect();
    const result = await conn.query(editorRef.current?.getValue() || "SHOW TABLES;");
    await conn.close();

    setHeaders(Object.keys(result.toArray()[0]));
    setRows(result.toArray());
    await db.terminate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    // 複数テーブル作ると作るとエラーになるので、毎回削除するようにした
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("duckdb-wasm.db", { recursive: true });
    await root.removeEntry("duckdb-wasm.db.wal", { recursive: true });

    const { db } = await createdb();
    // ファイルがなかったら何もしない
    if (!(e.target.files && e.target.files[0])) return;

    const file = e.target.files[0];
    const checkedFile = checkFileType(file.name);
    // ファイル拡張子がなかったら何もしない
    if (!checkedFile)  return;

    // ファイルの中身を取得する
    const fileContent = await convertFileToUint8Array(file);

    // dbにテーブルを作成する
    if (checkedFile.fileType === ".csv") {
      await createCsvTable(db, fileContent, checkedFile.fileName);
    } else if (checkedFile.fileType === ".jsonl") {
      await createJsonTable(db, fileContent, checkedFile.fileName);
    } else if (checkedFile.fileType === ".parquet") {
      await createParquetTable(db, fileContent, checkedFile.fileName);
    };

    await db.terminate();
    // setDb(null);
    alert("テーブル作成完了");
  };


  return (
    <div>
        <p className="mt-2">
          これ必須級→<a className="text-blue-700 " href="https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd?authuser=1&hl=ja&pli=1" target="_blank" rel="noreferrer">OPFS Explorer</a>
        </p>
        <div className="my-2">
          <Button onClick={deleteDirectory}>OPFS削除</Button>
        </div>
        <div className="my-2">
        </div>
        <div className="mt-4 mb-2">
          <label htmlFor="fileInput" className="block">DBテーブルを作成するためのファイルを選択（ファイル名でテーブル作成します）</label>
          <input type="file" id="fileInput" accept=".csv,.parquet,.jsonl" onChange={handleFileUpload} className="file:mr-4 file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-600 dark:file:text-indigo-100 dark:hover:file:bg-indigo-500 border border-indigo-400 text-indigo-700" />
        </div>
        <div>
        <Button className="mb-2" onClick={execSql}>SQL実行</Button>
        <Editor onMount={(editor)=> editorRef.current = editor} className="border" height="300px" defaultLanguage="sql" options={{minimap: {enabled: false}}} defaultValue="SHOW TABLES;" />
        </div>
      <div className="my-2">
        <table className="border-collapse border border-indigo-400">
          <thead className="bg-indigo-200 sticky top-[-1px]">
            <tr>
              { headers.map((header) => (<th className="px-2 py-1 border border-indigo-400">{header}</th>)) }</tr>
          </thead>
          <tbody>
            { rows.map((row, i) => (
              <tr key={i}>
                { headers.map((header) => (<td className="px-2 py-1 border border-indigo-400">{row[header].toString()}</td>)) }
              </tr>
            )) }
          </tbody>
        </table>
      </div>
    </div>
  );
}