export const copyArray = (arrayToCopy: any[]): any[] => {
  return JSON.parse(JSON.stringify(arrayToCopy));
}