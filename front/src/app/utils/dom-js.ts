/**
 * Select HTML element and focus it
 * @param selectorValue
 */
export const autoFocus = (selectorValue: string) => {
  const getElement = document.querySelector(selectorValue)
  if (getElement) {
    // @ts-ignore
    if (getElement.focus) {
      // @ts-ignore
      getElement.focus()
      // @ts-ignore
      getElement.select()
    }
  } else {
    setTimeout(() => {
      autoFocus(selectorValue)
    }, 200)
  }
}
