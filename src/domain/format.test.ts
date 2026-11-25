import { formatNumber, formatPair, formatText } from './format'

describe('formatText', () => {
  it('returns real values unchanged', () => {
    expect(formatText('blue')).toBe('blue')
  })

  it('turns SWAPI placeholders into readable labels', () => {
    expect(formatText('unknown')).toBe('Unknown')
    expect(formatText('n/a')).toBe('N/A')
    expect(formatText('none')).toBe('None')
    expect(formatText('')).toBe('Unknown')
    expect(formatText(undefined)).toBe('Unknown')
  })
})

describe('formatNumber', () => {
  it('adds thousands separators and units', () => {
    expect(formatNumber('200000')).toBe('200,000')
    expect(formatNumber('172', 'cm')).toBe('172 cm')
    expect(formatNumber('1', '%')).toBe('1%')
  })

  it('handles values SWAPI already formats with commas', () => {
    expect(formatNumber('1,358', 'kg')).toBe('1,358 kg')
  })

  it('shows placeholders and non-numeric values as text', () => {
    expect(formatNumber('unknown', 'cm')).toBe('Unknown')
    expect(formatNumber('indefinite', 'yr')).toBe('indefinite')
  })
})

describe('formatPair', () => {
  it('formats crew / passengers', () => {
    expect(formatPair('1', '0')).toBe('1 / 0')
    expect(formatPair('30-165', 'unknown')).toBe('30-165 / Unknown')
  })
})
