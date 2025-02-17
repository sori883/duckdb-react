export function checkFileType(targetFileName: string): { fileName: string; fileType: string;} | null | undefined {
  const allowedExtensions = [".jsonl", ".csv", ".parquet"];
  if (!targetFileName.includes(".")) {
    return undefined; 
  }
  const fileType = targetFileName.slice(targetFileName.lastIndexOf("."));
  const fileName = targetFileName.slice(0, targetFileName.indexOf("."));
  return allowedExtensions.includes(fileType) ? { fileName, fileType } : null;
}