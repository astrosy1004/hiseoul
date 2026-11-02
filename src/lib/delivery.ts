// Delivery dates and time slots, in Korea time. The database checks the same
// rules again when the order is created (create_order in schema.sql).
import type { DeliverySlot } from "./types";

export const SLOTS: DeliverySlot[] = ["12-15", "15-18", "18-21", "21-23"];
export interface Settings { serviceFeeKrw: number; deliveryFeeKrw: number; cutoffHour: number; minLeadHours: number; testPayments: boolean }

/** Today's date (YYYY-MM-DD) and whole hour in Seoul. */
export function seoulNow(now = new Date()) {
  const k = new Date(now.getTime() + 9 * 3600_000);
  return { date: k.toISOString().slice(0, 10), hour: k.getUTCHours() };
}
const addDays = (date: string, n: number) => new Date(Date.parse(date + "T00:00:00Z") + n * 86400_000).toISOString().slice(0, 10);

export interface DayOption { date: string; offset: 0 | 1 | 2; slots: { slot: DeliverySlot; open: boolean }[] }

/** Today (if any slot is still open) plus the next two days. */
export function deliveryDays(s: Pick<Settings, "cutoffHour" | "minLeadHours">, now = new Date()): DayOption[] {
  const { date, hour } = seoulNow(now);
  const days: DayOption[] = [];
  if (hour < s.cutoffHour) {
    const slots = SLOTS.map((slot) => ({ slot, open: Number(slot.split("-")[0]) >= hour + s.minLeadHours }));
    if (slots.some((x) => x.open)) days.push({ date, offset: 0, slots });
  }
  for (const offset of [1, 2] as const) days.push({ date: addDays(date, offset), offset, slots: SLOTS.map((slot) => ({ slot, open: true })) });
  return days;
}
