export const number = (value: number) => new Intl.NumberFormat('ko-KR').format(value);
export const dateTime = (value: string) =>
  new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
export function localDay(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '작업을 완료하지 못했어요.';
}
