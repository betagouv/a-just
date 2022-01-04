export const exportFileToBlob = (file: File) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = function (e) {
      // @ts-ignore
      let blob = new Blob([new Uint8Array(e.target.result)], {
        type: file.type,
      });
      resolve(blob);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const exportFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      resolve(reader.result as string);
    };
    reader.onerror = function (error) {
      reject(error);
    };
  });
};

export const exportBase64ToBlob = (base64: string, type: string = 'text/csv') => {
  var byteString = atob(base64.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type });
};

export const exportFileToString = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      resolve(reader.result as string);
    };
    reader.onerror = function (error) {
      reject(error);
    };
  });
};
