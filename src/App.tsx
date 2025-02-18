import { useRef, useState } from "react";

import { createdb } from "./duckdb/createdb";
import { createCsvTable } from "./duckdb/createCsvTable";
import { createJsonTable } from "./duckdb/createJsonTable";
import { createParquetTable } from "./duckdb/createParquet";
import { copyCsv } from "./duckdb/copyCsv";
import { copyJson } from "./duckdb/copyJson";
import { copyParquet } from "./duckdb/copyParquet";

import { checkFileType } from "./utils/checkFileType";
import { convertFileToUint8Array } from "./utils/convertFileToUint8Array";

import Editor from "@monaco-editor/react";
import Button from "./components/Button";

import type { editor } from "monaco-editor";


function App() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [ download, setDownload ] = useState<{ url:string, fileName: string } | null>(null);
  const [ headers, setHeaders ] = useState<string[]>([]);
  const [ rows, setRows ] = useState<Record<string, string>[]>([]);

  const deleteDirectory = async () => {
    // OPFSのファイルを削除する
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("duckdb-wasm.db", { recursive: true });
    await root.removeEntry("duckdb-wasm.db.wal", { recursive: true });
    alert("OPFS削除完了");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 複数テーブル作ると作るとエラーになるので、毎回削除するようにした
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("duckdb-wasm.db", { recursive: true });
    await root.removeEntry("duckdb-wasm.db.wal", { recursive: true });

    const { db } = await createdb();

    try {
    // ファイルがなかったら何もしない
    if (!(e.target.files && e.target.files[0])) throw new Error("ファイルが選択されていません");

    const file = e.target.files[0];
    const checkedFile = checkFileType(file.name);
    // ファイル拡張子がなかったら何もしない
    if (!checkedFile)  throw new Error("ファイル拡張子が不正です");

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
    alert("テーブル作成完了");
  } catch (error) {
    console.error(error);
  } finally {
    await db.terminate();
  }
  };

  // SQL実行
  const execSql = async () => {
    const { db } = await createdb();
    try {
      const conn = await db.connect();
      const result = await conn.query(editorRef.current?.getValue() || "SHOW TABLES;");
      await conn.close();

      // 取得した値はテーブル生成用にStateに入れる
      setHeaders(Object.keys(result.toArray()[0]));
      setRows(result.toArray());
    } catch (error) {
      console.error(error);
    } finally {
      await db.terminate();
    }
  };

  // CSVダウンロードのリンク生成
  const downloadCSV = async () => {    
    const downloadFileaNme = "output.csv";
    const { db } = await createdb();
    try {
    const url = await copyCsv(db, editorRef.current?.getValue() || "SHOW TABLES;", downloadFileaNme);
    setDownload({ url, fileName: downloadFileaNme });
    } catch (error) {
      console.error(error);
    } finally {
      db.terminate();
    }
  };

  // Jsonダウンロードのリンク生成
  const downloadJson = async () => {    
    const downloadFileaNme = "output.jsonl";
    const { db } = await createdb();
    try {
      const url = await copyJson(db, editorRef.current?.getValue() || "SHOW TABLES;", downloadFileaNme);
      setDownload({ url, fileName: downloadFileaNme });
      } catch (error) {
        console.error(error);
      } finally {
        db.terminate();
      }
  };

   // Parquetダウンロードのリンク生成
  const downloadParquet = async () => {    
    const downloadFileaNme = "output.parquet";
    const { db } = await createdb();
    try {
      const url = await copyParquet(db, editorRef.current?.getValue() || "SHOW TABLES;", downloadFileaNme);
      setDownload({ url, fileName: downloadFileaNme });
      } catch (error) {
        console.error(error);
      } finally {
        db.terminate();
      }
  };

  return (
    <div>
        <p className="mt-2">
          OPFS Explorer→<a className="text-blue-700 " href="https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd?authuser=1&hl=ja&pli=1" target="_blank" rel="noreferrer">OPFS Explorer</a>
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
        <div className="mb-2">
          <Button className="mr-2" onClick={execSql}>SQL実行</Button>
          <Button className="mr-2" onClick={downloadCSV}>CSVダウンロード</Button>
          <Button className="mr-2" onClick={downloadJson}>Jsonダウンロード</Button>
          <Button className="mr-2" onClick={downloadParquet}>Parquetダウンロード</Button>
        </div>
        <div>
          { download && <a href={download.url} download={download.fileName} className="text-blue-700">ダウンロードリンク発行しました。{download.fileName}</a> }
        </div>
        <div className="my-2">
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

export default App;
