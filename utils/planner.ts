export type SavingsPlanResult = {
  remainingCents: number;
  weeks: number;
  estimatedDate: string | null;
  reached: boolean;
};

export function calculateSavingsPlan(
  targetCents: number,
  currentCents: number,
  weeklySavingsCents: number
): SavingsPlanResult {
  const remainingCents = Math.max(0, targetCents - currentCents);

  if (remainingCents === 0) {
    return {
      remainingCents: 0,
      weeks: 0,
      estimatedDate: toLocalDateString(new Date()),
      reached: true,
    };
  }

  if (weeklySavingsCents <= 0) {
    return {
      remainingCents,
      weeks: 0,
      estimatedDate: null,
      reached: false,
    };
  }

  const weeks = Math.ceil(remainingCents / weeklySavingsCents);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + weeks * 7);

  return {
    remainingCents,
    weeks,
    estimatedDate: toLocalDateString(completionDate),
    reached: false,
  };
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatEstimatedDate(value: string | null): string {
  if (!value) {
    return 'Add weekly savings';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
