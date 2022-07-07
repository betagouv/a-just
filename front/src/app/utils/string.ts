export function ucFirst (string: string): string {
  if (string && typeof string === 'string') {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  return string;
}