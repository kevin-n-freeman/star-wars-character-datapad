/** Episode numbers are shown as Roman numerals ("Episode IV"). */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value <= 0) return String(value)
  const numerals: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let remaining = value
  let out = ''
  for (const [n, numeral] of numerals) {
    while (remaining >= n) {
      out += numeral
      remaining -= n
    }
  }
  return out
}
