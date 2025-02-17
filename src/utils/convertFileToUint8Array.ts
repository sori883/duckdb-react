export const convertFileToUint8Array = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(event.target.result);
        resolve(uint8Array);
      } else {
        reject(new Error("Failed to convert file to ArrayBuffer."));
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};