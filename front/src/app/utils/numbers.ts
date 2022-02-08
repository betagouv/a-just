export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function fixDecimal(value: number, base: number = 100) {
  return Math.round(value * base) / base;
}