export const addHTML = (doc: any, htmlDom: HTMLElement) => {
  return new Promise((resolve) => {
    doc.html(htmlDom, {
      callback: function () {
        resolve(true);
      },
    });
  });
};
