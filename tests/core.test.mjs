import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {
 INPUT_NAMES, FIVE_HOURS_MS, STORAGE_VERSION, parseLocalMinute,
 asLocalMinute, parseTimestampWithZone, addHoursToLocal,
 countdownParts, countdownLabel, formatInZone, resolveDeviceZone,
 escapeIcalText, makeCalendarEvent, validateSavedPreferences
} from "../src/core.mjs";

test("pure clock core has exact named windows and elapsed duration",()=>{
 assert.deepEqual(INPUT_NAMES,["five","weekly","banked"]);
 assert.equal(FIVE_HOURS_MS,18_000_000);
 const start=Date.UTC(2026,9,28,10,0,0);
 assert.equal(countdownParts(start+FIVE_HOURS_MS,start).days,0);
 assert.equal(countdownParts(start+FIVE_HOURS_MS,start).hours,5);
 assert.equal(countdownParts(start+60_999,start).minutes,1);
 assert.equal(countdownParts(start+60_999,start).seconds,1);
 assert.equal(countdownParts(start,start).state,"elapsed");
 assert.equal(countdownParts(start-1,start).state,"elapsed");
 assert.equal(countdownParts(NaN,start).state,"unset");
 assert.match(countdownLabel(countdownParts(start+FIVE_HOURS_MS,start),"en"),/5h/);
 assert.match(countdownLabel(countdownParts(start+FIVE_HOURS_MS,start),"ko"),/5시간/);
});

test("blank and malformed browser-local date input never manufactures a reset",()=>{
 for(const invalid of ["","2026-02-30T12:00","2026-13-01T01:00",
   "2026-12-01T24:00","2026-12-01T02:99",
   "tomorrow","Oct 28","2026-10-28T10:00Z","2026-10-28",
   "2026-10-28T13:14:22",null,undefined,23,"1999-10-28T11:00"]){
   assert.equal(parseLocalMinute(invalid),null,String(invalid));
 }
 const exact=parseLocalMinute("2026-10-28T13:45");
 assert.ok(exact instanceof Date);
 assert.equal(asLocalMinute(exact),"2026-10-28T13:45");
 assert.equal(asLocalMinute(new Date(NaN)),"");
 const added=addHoursToLocal("2026-10-28T13:45");
 assert.ok(added instanceof Date);
 assert.equal(added.getTime()-exact.getTime(),FIVE_HOURS_MS);
 assert.equal(addHoursToLocal("2026-10-28T13:45",-1),null);
 assert.equal(addHoursToLocal("2026-10-28T13:45",169),null);
 assert.equal(addHoursToLocal("",5),null);
});

test("ISO announcement converter MUST have explicit UTC or offset and valid calendar date",()=>{
 const utc=parseTimestampWithZone("2026-10-28T17:00Z");
 const kst=parseTimestampWithZone("2026-10-29T02:00+09:00");
 assert.equal(utc.getTime(),kst.getTime());
 assert.equal(parseTimestampWithZone(" 2026-10-28T17:00Z ").getTime(),utc.getTime());
 assert.equal(formatInZone(utc,"UTC","en").includes("Oct"),true);
 assert.match(formatInZone(utc,"Asia/Seoul","ko"),/02:00/);
 for(const invalid of [
   "2026-10-28T17:00","2026-10-28 17:00","2026-02-30T17:00Z",
   "2026-10-32T17:00Z","2026-10-28T25:00Z",
   "2026-10-28T17:99Z","2026-10-28T17:00+25:00",
   "2026-10-28T17:00+9:00","2026-10-28T17:00+14:30",
   "javascript:alert(1)","",123,null,"<script>"
 ])assert.equal(parseTimestampWithZone(invalid),null,String(invalid));
});

test("IANA timezone formatting handles DST, country time and device selection",()=>{
 const d=new Date("2026-11-01T09:30:00Z");
 const la=formatInZone(d,"America/Los_Angeles","en");
 const ny=formatInZone(d,"America/New_York","en");
 const kst=formatInZone(d,"Asia/Seoul","ko");
 assert.match(la,/1:30/);
 assert.match(ny,/4:30/);
 assert.match(kst,/18:30|오후 6:30/);
 assert.ok(formatInZone(d,"UTC","en"));
 assert.ok(formatInZone(d,"device","en"));
 assert.equal(formatInZone(d,"Invalid/Zone","en"),null);
 assert.equal(resolveDeviceZone().length>0,true);
});

test("DST gap is rejected and an actual elapsed 5h interval crosses spring-forward",()=>{
 const script=[
  "import {parseLocalMinute,addHoursToLocal,asLocalMinute} from './src/core.mjs';",
  "const invalid=parseLocalMinute('2026-03-08T02:30');",
  "const start=parseLocalMinute('2026-03-08T01:30');",
  "const end=addHoursToLocal('2026-03-08T01:30');",
  "console.log(JSON.stringify({invalid:invalid===null,hours:(end-start)/3600000,end:asLocalMinute(end)}));"
 ].join("\n");
 const proc=spawnSync(process.execPath,["--input-type=module","-e",script],{
   cwd:process.cwd(),encoding:"utf8",timeout:5000,
   env:{...process.env,TZ:"America/Los_Angeles"}
 });
 assert.equal(proc.status,0,proc.stderr);
 assert.deepEqual(JSON.parse(proc.stdout),{
   invalid:true,hours:5,end:"2026-03-08T07:30"
 });
});

test("real .ics calendar has UTC times and a 15-minute reminder, no guessed recurrence",()=>{
 const now=Date.UTC(2026,9,28,5,0,0);
 const target=now+70*60000;
 const ics=makeCalendarEvent({target,type:"weekly",language:"en",nowMs:now});
 assert.ok(ics?.startsWith("BEGIN:VCALENDAR\r\n"));
 assert.match(ics,/DTSTART:20261028T061000Z/);
 assert.match(ics,/DTSTAMP:20261028T050000Z/);
 assert.match(ics,/TRIGGER:-PT15M/);
 assert.match(ics,/END:VCALENDAR\r\n$/);
 assert.match(ics,/Check your Codex weekly reset/);
 assert.doesNotMatch(ics,/RRULE:|X-WR-CALNAME:|BEGIN:VTODO/);
 assert.ok(ics.includes("this is not a verified reset notification."));
 const ko=makeCalendarEvent({target,type:"banked",language:"ko",nowMs:now});
 assert.ok(ko.includes("만료"));
 assert.equal(makeCalendarEvent({target:now,type:"five",nowMs:now}),null);
 assert.equal(makeCalendarEvent({target:now+100,type:"global",nowMs:now}),null);
 assert.equal(makeCalendarEvent({target:NaN,type:"weekly",nowMs:now}),null);
 assert.equal(escapeIcalText("line1\nline2; price, a\\b"),
   "line1\\nline2\\; price\\, a\\\\b");
});

test("optional local browser storage record is strict and rejects tampering",()=>{
 const sample={
  version:STORAGE_VERSION, zone:"Asia/Seoul",
  times:{five:"2026-10-28T13:45",weekly:"",banked:""}
 };
 assert.deepEqual(validateSavedPreferences(sample),sample);
 assert.deepEqual(validateSavedPreferences({...sample,zone:"device"}),
   {...sample,zone:"device"});
 for(const broken of [
   null, {}, {...sample,version:2},
   {...sample,zone:"Not/AZone"},
   {...sample,times:{five:"2033-13-40T91:99",weekly:"",banked:""}},
   {...sample,times:{five:"2026-10-28T13:45",weekly:null,banked:""}},
   {...sample,times:[]},
   {...sample,times:null},
   {...sample,zone:"evil\nx"},
 ]){
   assert.equal(validateSavedPreferences(broken),null);
 }
});
