// utils/dateFormat.ts
export type DateFormatType =
  | "date" // 11 Sep 2025
  | "datetime" // 11 Sep 2025, 12:10 PM
  | "time" // 12:10 PM
  | "iso" // 2025-09-11
  | "long" // September 11, 2025
  | "relative"; // e.g. "2 days ago"

export function dateFormat(
  dateInput: string | Date | null | undefined,
  format: DateFormatType = "date"
): string {
  if (!dateInput) return ""; // return empty if null/undefined

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ""; // invalid date → safe empty string
  }

  switch (format) {
    case "date":
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);

    case "datetime":
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);

    case "time":
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);

    case "iso":
      return date.toISOString().split("T")[0]; // YYYY-MM-DD

    case "long":
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);

    case "relative": {
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / 1000; // seconds

      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
      if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    }

    default:
      return "";
  }
}
