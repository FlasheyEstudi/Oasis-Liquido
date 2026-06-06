/**
 * Smart ETA calculator with traffic heuristical adjustments for Managua/Nicaragua traffic patterns.
 */
export function computeEta(
  baseDurationSec: number,
  distanceMeters: number,
  hourOfDay: number,    // 0-23
  dayOfWeek: number,    // 0-6
  isRainy: boolean = false
): number {
  let factor = 1.0;

  // Managua Rush Hours: 7am-9am and 4pm-7pm (16:00-19:00)
  if ((hourOfDay >= 7 && hourOfDay <= 9) || (hourOfDay >= 16 && hourOfDay <= 19)) {
    factor = 1.35; // 35% delay during peak traffic
  }

  // Weekends: Saturday afternoon (after 12pm) and Sunday have less gridlock
  if (dayOfWeek === 0 || (dayOfWeek === 6 && hourOfDay >= 12)) {
    factor *= 0.85; // 15% faster
  }

  // Weather: Rain significantly slows down traffic in urban areas (potholes, flooded crossings)
  if (isRainy) {
    factor *= 1.25; // 25% delay
  }

  // Distance buffer adjustments (more uncertainty/stops on longer routes)
  if (distanceMeters > 5000) factor += 0.05;
  if (distanceMeters > 15000) factor += 0.10;

  return Math.round(baseDurationSec * factor);
}
