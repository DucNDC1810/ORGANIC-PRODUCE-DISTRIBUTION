/**
 * Utilities for computing the first delivery date in a recurring subscription.
 *
 * JS weekday convention: 0 = Sunday, 1 = Monday, …, 6 = Saturday
 */

const DAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Returns the first date >= startDate that falls on `deliveryDayName`.
 *
 * @param startDate       - Chosen start date (any time-of-day, normalised to midnight).
 * @param deliveryDayName - e.g. "monday", "tuesday", etc.
 * @param skipToNextWeek  - When true *and* startDate already falls on deliveryDayName,
 *                          skip forward 7 days (used for the "next week" edge case).
 *
 * Examples
 *   startDate = Thursday 05/03/2026, deliveryDayName = "monday"
 *   → Monday 09/03/2026
 *
 *   startDate = Monday 02/03/2026, deliveryDayName = "monday", skipToNextWeek = false
 *   → Monday 02/03/2026  (same day)
 *
 *   startDate = Monday 02/03/2026, deliveryDayName = "monday", skipToNextWeek = true
 *   → Monday 09/03/2026  (next week)
 */
export function getFirstDeliveryDate(
  startDate: Date,
  deliveryDayName: string,
  skipToNextWeek = false
): Date {
  const targetDay = DAY_NAME_TO_NUM[deliveryDayName] ?? 1; // fallback: Monday
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const startDow = start.getDay();
  let daysAhead = (targetDay - startDow + 7) % 7; // 0 = startDate is already the delivery day

  if (daysAhead === 0 && skipToNextWeek) {
    daysAhead = 7;
  }

  const result = new Date(start);
  result.setDate(result.getDate() + daysAhead);
  return result;
}

/**
 * Returns the first date >= startDate where the day-of-month equals `dayOfMonth`.
 * Capped at day 28 to avoid issues with February.
 *
 * @param startDate  - Chosen start date.
 * @param dayOfMonth - 1–28.
 */
export function getFirstMonthlyDeliveryDate(
  startDate: Date,
  dayOfMonth: number
): Date {
  const d = Math.min(Math.max(dayOfMonth, 1), 28);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const year = start.getFullYear();
  const month = start.getMonth();

  if (start.getDate() <= d) {
    return new Date(year, month, d);
  }
  return new Date(year, month + 1, d);
}

/**
 * Returns true when `startDate` already falls on `deliveryDayName` (same weekday).
 * Used to detect the "order placed on the same day as delivery day" edge case.
 */
export function isSameDeliveryDay(
  startDate: Date,
  deliveryDayName: string
): boolean {
  const targetDay = DAY_NAME_TO_NUM[deliveryDayName] ?? 1;
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  return d.getDay() === targetDay;
}

/** Format a Date to DD/MM/YYYY (Vietnamese locale). */
export function formatDateVN(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
