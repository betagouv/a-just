/**
 * Ajout d'un HTML à un document PDF pour les exports en PDF
 * @param doc
 * @param htmlDom
 * @returns
 */
export const addHTML = (doc: any, htmlDom: HTMLElement) => {
  return new Promise((resolve) => {
    doc.html(htmlDom, {
      callback: function () {
        resolve(true)
      },
    })
  })
}
