/**
 * Conversion de degrees en Radian
 * @param degrees 
 * @returns 
 */
export function degreesToRadians(degrees: number) {
  const pi = Math.PI;
  return degrees * (pi/180);
}