import { API_BASE_URL } from "./api";

export type FestivalRecord = {
  id?: number | string | null;
  name?: string | null;
  city?: string | null;
  country?: string | null;
  image_url?: string | null;
  website?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  month_text?: string | null;
  art_form?: string | null;
  art_form_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
};

export const MONTH_ORDER = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function normaliseString(value: unknown) {
  return String(value ?? "").trim();
}

export function safeWebUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function formatFestivalTime(
  startDate?: string | null,
  endDate?: string | null,
  monthText?: string | null
) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const startDay = start.getUTCDate();
      const endDay = end.getUTCDate();

      const sameMonth =
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCFullYear() === end.getUTCFullYear();

      if (sameMonth) {
        const month = start.toLocaleString("en-GB", {
          month: "short",
          timeZone: "UTC",
        });
        return `${startDay}-${endDay} ${month}`;
      }

      const startMonth = start.toLocaleString("en-GB", {
        month: "short",
        timeZone: "UTC",
      });

      const endMonth = end.toLocaleString("en-GB", {
        month: "short",
        timeZone: "UTC",
      });

      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
  }

  if (monthText && String(monthText).trim()) {
    return String(monthText).trim();
  }

  return "";
}

export function formatFestivalFullDateRange(
  startDate?: string | null,
  endDate?: string | null,
  monthText?: string | null
) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const startText = start.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });

      const endText = end.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });

      return `${startText} - ${endText}`;
    }
  }

  return normaliseString(monthText) || "Date TBC";
}

export function normaliseMonthText(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const lower = text.toLowerCase();

  const monthMap: Record<string, string> = {
    january: "January",
    jan: "January",
    february: "February",
    feb: "February",
    march: "March",
    mar: "March",
    april: "April",
    apr: "April",
    may: "May",
    june: "June",
    jun: "June",
    july: "July",
    jul: "July",
    august: "August",
    aug: "August",
    september: "September",
    sep: "September",
    sept: "September",
    october: "October",
    oct: "October",
    november: "November",
    nov: "November",
    december: "December",
    dec: "December",
  };

  return monthMap[lower] ?? "";
}

export function getMonthFromDate(dateValue: unknown) {
  const text = String(dateValue ?? "").trim();
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
}

export function normaliseMonth(monthText: unknown, startDate: unknown) {
  const cleanedMonth = normaliseMonthText(monthText);
  if (cleanedMonth) return cleanedMonth;

  return getMonthFromDate(startDate);
}

export function buildFestivalLocation(festival: FestivalRecord) {
  return [festival.city, festival.country]
    .map(normaliseString)
    .filter(Boolean)
    .join(", ");
}

export function toNumericId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function fetchFestivals() {
  return fetch(`${API_BASE_URL}/festivals`);
}

export function fetchFestivalById(id: number) {
  return fetch(`${API_BASE_URL}/festivals/${id}`);
}

