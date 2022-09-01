export const copyArray = (arrayToCopy) => {
  return JSON.parse(JSON.stringify(arrayToCopy))
}