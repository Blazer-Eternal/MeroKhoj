/**
 * Coerce a DECIMAL/NUMERIC column value to a JS number.
 *
 * Postgres numeric columns come back from Sequelize as strings; API
 * responses must serialize money as JSON numbers (price, amounts, totals).
 */
export const toMoney = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
