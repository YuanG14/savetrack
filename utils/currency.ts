const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return phpFormatter.format(amount);
}

export function formatCurrencyFromCents(amountCents: number): string {
  return phpFormatter.format(amountCents / 100);
}
