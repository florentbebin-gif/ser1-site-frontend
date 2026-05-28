const USER_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

export function formatUserDate(value: string): string {
  return USER_DATE_FORMATTER.format(new Date(value));
}
