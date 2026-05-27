import type { TableData } from './types';

export function toTableRows(data: string[][]): TableData {
  return data.map((row) => row.map((cell) => ({ text: cell })));
}
