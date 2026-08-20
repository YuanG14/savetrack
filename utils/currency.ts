const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

let privacyMaskEnabled = false;

export function setCurrencyPrivacyMask(enabled: boolean) {
  privacyMaskEnabled = enabled;
}

export function isCurrencyPrivacyMaskEnabled() {
  return privacyMaskEnabled;
}

export function formatCurrency(amount: number): string {
  if (privacyMaskEnabled) {
    return '₱••••';
  }

  return phpFormatter.format(amount);
}

export function formatCurrencyFromCents(amountCents: number): string {
  if (privacyMaskEnabled) {
    return '₱••••';
  }

  return phpFormatter.format(amountCents / 100);
}
