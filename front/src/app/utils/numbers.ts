export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function fixDecimal(value: number) {
  return Math.round(value * 100) / 100;
}