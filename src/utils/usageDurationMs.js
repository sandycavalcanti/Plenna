/** Preserve positive subsecond observations instead of displaying a fabricated zero. */
export function usageDurationMs(value) {
  if (value === null || !Number.isFinite(value) || value < 0) return 'Duração desconhecida';
  if (value === 0) return '0 s';
  if (value < 1000) return '< 1 s';
  const total = Math.floor(value / 1000);
  const hours = Math.floor(total / 3600),
    minutes = Math.floor(total % 3600 / 60),
    seconds = total % 60;
  return [hours ? `${hours} h` : '', minutes ? `${minutes} min` : '', seconds ? `${seconds} s` : ''].filter(Boolean).join(' ');
}
