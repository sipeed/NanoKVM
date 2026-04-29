export function normalizeLiteralEmptyText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.toLowerCase();
  if (normalized === 'null' || normalized === 'undefined') {
    return '';
  }

  return trimmed;
}
