import {
  INPUT_NAMES, parseLocalMinute, parseTimestampWithZone, asLocalMinute,
  addHoursToLocal, countdownParts, countdownLabel, formatInZone,
  resolveDeviceZone, makeCalendarEvent, validateSavedPreferences,
  STORAGE_VERSION
} from "./core.mjs";

const language = document.documentElement.lang === "ko" ? "ko" : "en";
const STORE = "codex-limit-clock-consented-local-v1";
const root = document.documentElement;
const COPY = {
  en:{
    unset:"No reset time entered",
    elapsed:"Entered time has passed — verify the official dashboard",
    invalid:"Invalid or nonexistent local time. Check your device timezone.",
    bankedElapsed:"Expiry time passed — check if this reset is still available",
    bankedFuture:"Until your entered redemption deadline",
    fiveFuture:"Until your entered 5-hour window time",
    weeklyFuture:"Until your entered weekly reset time",
    device:"Your device",
    now:"Right now",
    at:"Entered date",
    demo:"DEMO ONLY — dates are fictional examples, not an OpenAI announcement.",
    fromStart:"Estimate only: five elapsed hours after the start you entered. Your actual usage dashboard is authoritative.",
    missingStart:"Enter a local start time to calculate a rough +5-hour estimate.",
    convertMissing:"Paste a timestamp with an explicit timezone, such as 2026-10-28T17:00Z.",
    convertInvalid:"Use ISO 8601 with Z or +09:00; ambiguous local timestamps are rejected.",
    convertResult:"Announcement time converted; this does NOT verify that a reset was announced.",
    reminderMissing:"Enter a future time to download a calendar reminder.",
    reminderDone:"Calendar reminder generated locally. Import the .ics into your calendar.",
    saved:"Saved to this browser only. No account or server receives these dates.",
    saveFailed:"Local storage is blocked. Settings remain in this tab only.",
    forget:"Cleared dates and local settings. No data was sent.",
    bankedNote:"Deadline only — this tool does not redeem a reset.",
    plain:"Using a time you supplied, not a verified provider reset.",
    today:"Today",
    srcDate:"Your local time",
    srcZone:"Selected zone"
  },
  ko:{
    unset:"초기화 시각을 입력하지 않았습니다",
    elapsed:"입력한 시각이 지났습니다. 공식 사용량 화면에서 확인하세요",
    invalid:"존재하지 않거나 잘못된 현지 시각입니다. 기기 시간대를 확인하세요.",
    bankedElapsed:"만료 시각이 지났습니다. 초기화권이 남았는지 확인하세요",
    bankedFuture:"입력한 초기화권 사용 기한까지",
    fiveFuture:"입력한 5시간 한도 갱신 시각까지",
    weeklyFuture:"입력한 주간 한도 갱신 시각까지",
    device:"현재 기기",
    now:"현재 시각",
    at:"입력 시각",
    demo:"데모입니다. 예시 날짜는 가상이며 OpenAI 공식 발표가 아닙니다.",
    fromStart:"추정치: 입력한 시작 시각 + 5시간입니다. 실제 초기화 시각은 공식 사용량 화면이 우선합니다.",
    missingStart:"현지 시작 시각을 입력하면 5시간 후를 추정합니다.",
    convertMissing:"예: 2026-10-28T17:00Z처럼 시간대가 포함된 시각을 붙여 넣으세요.",
    convertInvalid:"ISO 8601 형식에서 Z 또는 +09:00 시간대가 필요합니다.",
    convertResult:"입력한 공지 시각을 변환했습니다. 실제 초기화 발표 여부를 검증한 것은 아닙니다.",
    reminderMissing:"미래 시각을 입력하면 캘린더 알림을 받을 수 있습니다.",
    reminderDone:"이 기기에서 .ics 알림 파일을 만들었습니다. 캘린더에 추가하세요.",
    saved:"이 브라우저에만 저장됐습니다. 서버로 날짜를 전송하지 않습니다.",
    saveFailed:"브라우저 저장 기능이 차단됐습니다. 현재 탭에서만 유지됩니다.",
    forget:"입력 및 브라우저 저장 내용을 삭제했습니다.",
    bankedNote:"만료 기한만 추적합니다. 초기화권은 대신 사용하지 않습니다.",
    plain:"사용자가 입력한 시각 기준이며 공식 갱신을 검증한 것은 아닙니다.",
    today:"오늘",
    srcDate:"내 기기 시간",
    srcZone:"선택한 시간대"
  }
};
const t = COPY[language];
const get = (id) => document.getElementById(id);
const saveChoice = get("remember");
const timeInputs = Object.fromEntries(INPUT_NAMES.map(name => [name,get("time-" + name)]));
let demoMode = false;
let estimatedFive = false;

function flash(message, isWarning = false) {
  const el = get("feedback");
  el.textContent = message;
  el.dataset.tone = isWarning ? "warning" : "success";
}
function selectedZone() {
  return get("zone").value;
}
function selectedZoneText() {
  const select = get("zone");
  if (select.value === "device") return t.device + " (" + resolveDeviceZone() + ")";
  return select.options[select.selectedIndex]?.textContent || select.value;
}
function rememberSettings() {
  if (!saveChoice.checked || demoMode) return;
  const times = Object.fromEntries(INPUT_NAMES.map(name=>[name,timeInputs[name].value]));
  const payload = {version:STORAGE_VERSION,zone:selectedZone(),times};
  if (!validateSavedPreferences(payload)) return;
  try {localStorage.setItem(STORE,JSON.stringify(payload));}
  catch {flash(t.saveFailed,true);}
}
function forgetStorage() {
  try {localStorage.removeItem(STORE);} catch { /* blocked storage */ }
}
function restore() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return;
    const parsed = validateSavedPreferences(JSON.parse(raw));
    if (!parsed) {forgetStorage();return;}
    saveChoice.checked = true;
    for (const name of INPUT_NAMES) timeInputs[name].value = parsed.times[name];
    const option = Array.from(get("zone").options).find(x=>x.value===parsed.zone);
    if (option) get("zone").value = parsed.zone;
  } catch { /* Unavailable browser storage never blocks core functionality. */ }
}
function renderNow() {
  const now = Date.now();
  const nowDate = new Date(now);
  get("device-zone").textContent = resolveDeviceZone();
  get("device-now").textContent = formatInZone(nowDate,"device",language) || "—";
  get("utc-now").textContent = formatInZone(nowDate,"UTC",language) || "—";
}
function setStatus(block, state) {
  block.dataset.state = state;
}
function renderOne(name, nowMs) {
  const block = get("window-" + name);
  const input = timeInputs[name];
  const count = block.querySelector("[data-count]");
  const shown = block.querySelector("[data-converted]");
  const hint = block.querySelector("[data-hint]");
  const calendar = block.querySelector("[data-calendar]");
  if (!block || !input) return;
  const time = input.value ? parseLocalMinute(input.value) : null;
  if (!time) {
    count.textContent = input.value ? t.invalid : t.unset;
    shown.textContent = "—";
    hint.textContent = t.plain;
    calendar.disabled = true;
    setStatus(block,input.value ? "invalid" : "unset");
    return;
  }
  const parts = countdownParts(time,nowMs);
  const targetLocal = formatInZone(time,"device",language);
  const targetZone = formatInZone(time,selectedZone(),language);
  shown.textContent = t.srcDate + ": " + (targetLocal || "—") +
    "\n" + t.srcZone + " (" + selectedZoneText() + "): " + (targetZone || "—");
  if (parts.state !== "future") {
    count.textContent = name === "banked" ? t.bankedElapsed : t.elapsed;
    hint.textContent = name === "banked" ? t.bankedNote : t.plain;
    calendar.disabled = true;
    setStatus(block,"elapsed");
    return;
  }
  count.textContent = countdownLabel(parts,language);
  hint.textContent = (name === "five" ? t.fiveFuture :
      name === "weekly" ? t.weeklyFuture : t.bankedFuture) +
      " · " + (demoMode ? t.demo :
        (estimatedFive && name === "five" ? t.fromStart : t.plain));
  calendar.disabled = false;
  setStatus(block,demoMode ? "demo" : "future");
}
function render() {
  renderNow();
  const now = Date.now();
  for (const name of INPUT_NAMES) renderOne(name,now);
}
function onManualEdit(event) {
  if (event?.target?.id === "time-five") estimatedFive = false;
  demoMode = false;
  rememberSettings();
  render();
}
for (const name of INPUT_NAMES) {
  timeInputs[name].addEventListener("input",onManualEdit);
  timeInputs[name].addEventListener("change",onManualEdit);
}
get("zone").addEventListener("change",()=>{
  rememberSettings();
  render();
});
saveChoice.addEventListener("change",()=>{
  if (!saveChoice.checked) {
    forgetStorage();
    flash(language === "ko" ? "이 브라우저에 기록을 남기지 않습니다." :
      "No dates are kept in browser storage.");
  } else if (demoMode) {
    saveChoice.checked = false;
    flash(t.demo,true);
  } else {
    rememberSettings();
    flash(t.saved);
  }
});
get("clear").addEventListener("click",()=>{
  demoMode=false;estimatedFive=false;saveChoice.checked=false;
  for (const input of Object.values(timeInputs)) input.value="";
  get("start-five").value="";
  get("utc-converter").value="";
  get("convert-result").textContent="";
  get("zone").value="device";
  forgetStorage();
  flash(t.forget);
  render();
});
get("demo").addEventListener("click",()=>{
  demoMode=true;
  estimatedFive=false;
  saveChoice.checked=false;
  forgetStorage();
  const now = Date.now();
  const durations = {five:2*3600000, weekly:4*86400000, banked:12*86400000};
  for (const name of INPUT_NAMES) {
    const d = new Date(now+durations[name]);
    d.setSeconds(0,0);
    timeInputs[name].value=asLocalMinute(d);
  }
  flash(t.demo,true);
  render();
});
get("estimate").addEventListener("click",()=>{
  const result = addHoursToLocal(get("start-five").value);
  if (!result) {flash(t.missingStart,true);return;}
  demoMode=false;
  estimatedFive=true;
  timeInputs.five.value=asLocalMinute(result);
  rememberSettings();
  flash(t.fromStart,true);
  render();
});
document.querySelectorAll("[data-calendar]").forEach(button=>{
  button.addEventListener("click",()=>{
    const name=button.dataset.calendar;
    const target=parseLocalMinute(timeInputs[name].value);
    const calendar=target && makeCalendarEvent({target,type:name,language});
    if (!calendar || demoMode) {
      flash(demoMode ? t.demo : t.reminderMissing,true);
      return;
    }
    const object=URL.createObjectURL(new Blob([calendar],{type:"text/calendar;charset=utf-8"}));
    const link=document.createElement("a");
    link.href=object;
    link.download="codex-" + name + "-reminder.ics";
    link.style.display="none";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(object),2500);
    flash(t.reminderDone);
  });
});
get("convert").addEventListener("click",()=>{
  const target = parseTimestampWithZone(get("utc-converter").value);
  const box = get("convert-result");
  if (!target) {
    box.textContent = get("utc-converter").value ? t.convertInvalid : t.convertMissing;
    box.dataset.state="invalid";
    return;
  }
  box.textContent = t.convertResult + "\n" +
    t.device + ": " + formatInZone(target,"device",language) + "\n" +
    selectedZoneText() + ": " + formatInZone(target,selectedZone(),language) +
    "\nUTC: " + formatInZone(target,"UTC",language);
  box.dataset.state="success";
});
get("utc-converter").addEventListener("keydown",(event)=>{
  if (event.key==="Enter") {
    event.preventDefault();
    get("convert").click();
  }
});
const defaultZone = resolveDeviceZone();
const select = get("zone");
const firstOption = select.querySelector('[value="device"]');
if (firstOption) firstOption.textContent=t.device+" — "+defaultZone;
restore();
render();
setInterval(render,1000);
document.addEventListener("visibilitychange",()=>{if (!document.hidden) render();});
window.addEventListener("focus",render);
window.addEventListener("pageshow",render);
// Never register service workers, request credentials, read URL parameters
// for private reset dates, initiate network connections, or load ad tags.
