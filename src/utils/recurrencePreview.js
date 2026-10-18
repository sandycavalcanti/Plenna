/**
 * Local-only recurrence preview helpers for the RF022 frontend prototype.
 * These functions do not represent a persisted backend contract.
 */

export const RECURRENCE_FREQUENCIES = [
  { value: 'DIARIA', label: 'Diária' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'ANUAL', label: 'Anual' },
];

function cloneAtNoon(date) {
  const clone = new Date(date);
  clone.setHours(12, 0, 0, 0);
  return clone;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function dateWithClampedDay(year, month, anchorDay) {
  const day = Math.min(anchorDay, daysInMonth(year, month));
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function addRecurrenceOccurrence(date, frequency, anchorDay = date.getDate()) {
  const current = cloneAtNoon(date);

  switch (frequency) {
    case 'DIARIA':
      current.setDate(current.getDate() + 1);
      return current;
    case 'SEMANAL':
      current.setDate(current.getDate() + 7);
      return current;
    case 'ANUAL':
      return dateWithClampedDay(current.getFullYear() + 1, current.getMonth(), anchorDay);
    case 'MENSAL':
    default:
      return dateWithClampedDay(current.getFullYear(), current.getMonth() + 1, anchorDay);
  }
}

export function getRecurrencePreview(firstDate, frequency, count = 5, endDate = null) {
  const previewLimit = Math.floor(Number(count));
  const hasEndDate = endDate !== null && endDate !== undefined;

  if (
    !(firstDate instanceof Date) ||
    Number.isNaN(firstDate.getTime()) ||
    !Number.isFinite(previewLimit) ||
    previewLimit <= 0
  ) {
    return [];
  }

  const firstOccurrence = cloneAtNoon(firstDate);
  const endOccurrence = hasEndDate ? cloneAtNoon(endDate) : null;

  if (
    (hasEndDate && Number.isNaN(endOccurrence.getTime())) ||
    (endOccurrence && endOccurrence.getTime() < firstOccurrence.getTime())
  ) {
    return [];
  }

  const preview = [firstOccurrence];
  const anchorDay = firstOccurrence.getDate();

  while (preview.length < previewLimit) {
    const nextOccurrence = addRecurrenceOccurrence(
      preview[preview.length - 1],
      frequency,
      anchorDay,
    );

    if (endOccurrence && nextOccurrence.getTime() > endOccurrence.getTime()) {
      break;
    }

    preview.push(nextOccurrence);
  }

  return preview;
}
