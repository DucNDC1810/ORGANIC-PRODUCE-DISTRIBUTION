/**
 * Format a number as Vietnamese Dong (VND).
 * Example: 150000 → "150.000 ₫"
 */
export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫';
}
