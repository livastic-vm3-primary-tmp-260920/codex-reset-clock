/**
 * Codex Limit Clock: pure, privacy-preserving time utilities.
 * No OpenAI account, API, telemetry, advertising, storage, or network access.
 *
 * Only dates the visitor explicitly supplies are converted. Promotional
 * "global"/banked resets must NEVER be inferred from a countdown.
 */
export const INPUT_NAMES = Object.freeze(["five", "weekly", "banked"]);
export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
export const STORAGE_VERSION = 1;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function parseLocalMinute(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, sy, smo, sd, sh, sm] = match;
  const y = Number(sy), mo = Number(smo), day = Number(sd);
  const h = Number(sh), min = Number(sm);
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 ||
      day < 1 || day > 31 || h > 23 || min > 59) return null;
  const date = new Date(y, mo - 1, day, h, min, 0, 0);
  if (!Number.isFinite(date.getTime()) ||
      date.getFullYear() !== y || date.getMonth() !== mo - 1 ||
      date.getDate() !== day || date.getHours() !== h ||
      date.getMinutes() !== min) return null;
  // A nonexistent local time in a DST spring-forward gap fails round-trip.
  // A repeated time during autumn rollback still requires user verification.
  return date;
}

export function asLocalMinute(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    return "";
  }
  return String(date.getFullYear()) + "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) + "T" + pad(date.getHours()) +
    ":" + pad(date.getMinutes());
}

export function parseTimestampWithZone(text) {
  if (typeof text !== "string") return null;
  const raw = text.trim();
  if (raw.length > 70) return null;
  // Without Z or an explicit offset the conversion would be ambiguous.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/i.test(raw)) {
    return null;
  }
  const offset = /([+-])(\d{2}):(\d{2})$/.exec(raw);
  if (offset && Number(offset[2]) === 14 && Number(offset[3]) !== 0) {
    return null; // ISO UTC offsets cannot exceed +14:00 or -14:00.
  }
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  // Date.parse often silently normalizes invalid calendar days.
  const calendar = raw.slice(0, 10);
  const y = Number(raw.slice(0, 4));
  const mo = Number(raw.slice(5, 7));
  const day = Number(raw.slice(8, 10));
  const h = Number(raw.slice(11, 13));
  const min = Number(raw.slice(14, 16));
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || day < 1 ||
      day > 31 || h > 23 || min > 59) return null;
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (day > lastDay || calendar.length !== 10) return null;
  return parsed;
}

export function addHoursToLocal(value, hours = 5) {
  const start = parseLocalMinute(value);
  if (!start || typeof hours !== "number" ||
      !Number.isFinite(hours) || hours < 0 || hours > 168) return null;
  // Fixed elapsed hours; DST shift is accounted for via timestamp.
  return new Date(start.getTime() + hours * 3600000);
}

export function countdownParts(target, nowMs = Date.now()) {
  const targetMs = target instanceof Date ? target.getTime() : target;
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) {
    return {state:"unset", milliseconds:null, days:0, hours:0, minutes:0, seconds:0};
  }
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return {state:"elapsed", milliseconds:diff, days:0, hours:0, minutes:0, seconds:0};
  }
  const totalSeconds = Math.ceil(diff / 1000);
  return {
    state:"future",
    milliseconds:diff,
    days:Math.floor(totalSeconds / 86400),
    hours:Math.floor((totalSeconds % 86400) / 3600),
    minutes:Math.floor((totalSeconds % 3600) / 60),
    seconds:totalSeconds % 60
  };
}

export function countdownLabel(parts, language = "en") {
  if (!parts || parts.state !== "future") return "";
  const {days, hours, minutes, seconds} = parts;
  if (language === "ko") return String(days) + "일 " + pad(hours) +
    "시간 " + pad(minutes) + "분 " + pad(seconds) + "초";
  return String(days) + "d " + pad(hours) + "h " +
    pad(minutes) + "m " + pad(seconds) + "s";
}

export function resolveDeviceZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
  catch { return "UTC"; }
}

export function formatInZone(target, zone, language = "en") {
  const date = target instanceof Date ? target : new Date(target);
  if (!Number.isFinite(date.getTime())) return null;
  const locale = language === "ko" ? "ko-KR" : "en-US";
  const normalized = zone === "device" ? resolveDeviceZone() : zone;
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone:normalized,
      year:"numeric", month:"short", day:"numeric",
      weekday:"short", hour:"2-digit", minute:"2-digit",
      timeZoneName:"short", hour12:language === "en"
    }).format(date);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}

function icalTimestamp(ms) {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return null;
  return String(d.getUTCFullYear()) + pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) + "T" + pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
}

export function escapeIcalText(raw) {
  return String(raw).replace(/\\/g, "\\\\").replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function makeCalendarEvent({
  target, type = "five", language = "en", nowMs = Date.now()
} = {}) {
  const ms = target instanceof Date ? target.getTime() : target;
  if (!Number.isFinite(ms) || !Number.isFinite(nowMs) ||
      ms <= nowMs || !INPUT_NAMES.includes(type)) return null;
  const labels = {
    en:{five:"Check your Codex 5-hour reset",weekly:"Check your Codex weekly reset",
      banked:"Check your banked Codex reset expiration"},
    ko:{five:"Codex 5시간 초기화 확인",weekly:"Codex 주간 초기화 확인",
      banked:"Codex 저장된 초기화권 만료 확인"}
  };
  const title = labels[language === "ko" ? "ko" : "en"][type];
  const before = 15;
  const start = icalTimestamp(ms);
  const end = icalTimestamp(ms + 10 * 60000);
  const created = icalTimestamp(nowMs);
  if (!start || !end || !created) return null;
  const description = language === "ko"
    ? "입력된 사용자 시각 기반 캘린더 알림입니다. 공식 사용량 화면을 확인하세요. 자동 초기화 확인 기능이 아닙니다."
    : "Reminder for a time entered by you. Check official Usage settings; this is not a verified reset notification.";
  const lines = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LocalCSV Lab//Codex Limit Clock//EN",
    "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
    "UID:" + type + "-" + String(ms) + "@codex-limit-clock.local",
    "DTSTAMP:" + created,"DTSTART:" + start,"DTEND:" + end,
    "SUMMARY:" + escapeIcalText(title),
    "DESCRIPTION:" + escapeIcalText(description),
    "BEGIN:VALARM","TRIGGER:-PT" + String(before) + "M",
    "ACTION:DISPLAY","DESCRIPTION:" + escapeIcalText(title),
    "END:VALARM","END:VEVENT","END:VCALENDAR",""
  ];
  return lines.join("\r\n");
}

export function validateSavedPreferences(record) {
  if (!record || typeof record !== "object" || Array.isArray(record) ||
      record.version !== STORAGE_VERSION ||
      typeof record.zone !== "string" || record.zone.length > 60 ||
      typeof record.times !== "object" || record.times === null ||
      Array.isArray(record.times)) return null;
  const times = {};
  for (const name of INPUT_NAMES) {
    const value = record.times[name];
    if (typeof value !== "string" || value.length > 16 ||
        (value && !parseLocalMinute(value))) return null;
    times[name] = value;
  }
  try {
    Intl.DateTimeFormat("en-US",{
      timeZone:record.zone === "device" ? resolveDeviceZone() : record.zone
    });
  } catch { return null; }
  return {version:STORAGE_VERSION,zone:record.zone,times};
}
