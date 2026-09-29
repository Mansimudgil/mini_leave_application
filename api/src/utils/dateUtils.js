/**
 * Date and Working Days Calculation Utilities
 * 
 * Weekend Handling Policy:
 * - Saturday (day 6) and Sunday (day 0) are standard non-working weekend days.
 * - When an employee applies for leave across a weekend (e.g. Friday to Monday),
 *   only the business/working days (Friday and Monday = 2 days) are counted towards
 *   leave balance deduction.
 * - If the date range spans ONLY weekend days, workingDays is 0, which is flagged
 *   as an invalid leave application since employees do not need to take leave on off-days.
 */

/**
 * Calculates total calendar days, working days, and weekend days between two dates.
 * @param {string|Date} startDateInput - Format: YYYY-MM-DD
 * @param {string|Date} endDateInput - Format: YYYY-MM-DD
 * @returns {{ totalDays: number, workingDays: number, weekendDays: number, dayBreakdown: Array }}
 */
function calculateLeaveDays(startDateInput, endDateInput) {
  // Parse YYYY-MM-DD strings in local timezone or UTC explicitly to prevent timezone shifts
  const start = new Date(startDateInput + 'T00:00:00');
  const end = new Date(endDateInput + 'T00:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  if (start > end) {
    throw new Error('Start date cannot be after end date.');
  }

  let totalDays = 0;
  let workingDays = 0;
  let weekendDays = 0;
  const dayBreakdown = [];

  const current = new Date(start);
  while (current <= end) {
    totalDays++;
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    // Avoid toISOString() which shifts date backwards in timezones ahead of UTC (e.g. UTC+5:30)
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (isWeekend) {
      weekendDays++;
      dayBreakdown.push({
        date: dateStr,
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        isWorkingDay: false,
        reason: dayOfWeek === 0 ? 'Sunday' : 'Saturday'
      });
    } else {
      workingDays++;
      dayBreakdown.push({
        date: dateStr,
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        isWorkingDay: true,
        reason: 'Working Day'
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalDays,
    workingDays,
    weekendDays,
    dayBreakdown
  };
}

/**
 * Check if two date ranges overlap.
 * Range 1: [start1, end1]
 * Range 2: [start2, end2]
 * Overlap formula: start1 <= end2 AND end1 >= start2
 */
function checkDateOverlap(start1Str, end1Str, start2Str, end2Str) {
  const s1 = new Date(start1Str + 'T00:00:00');
  const e1 = new Date(end1Str + 'T00:00:00');
  const s2 = new Date(start2Str + 'T00:00:00');
  const e2 = new Date(end2Str + 'T00:00:00');

  return (s1 <= e2 && e1 >= s2);
}

module.exports = {
  calculateLeaveDays,
  checkDateOverlap
};
