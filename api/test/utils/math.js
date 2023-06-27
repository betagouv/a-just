export const roundFloat = (num, precision = 2) => {
  const tmp = Math.pow(10, precision)
  return Math.round(num * tmp) / tmp
}
