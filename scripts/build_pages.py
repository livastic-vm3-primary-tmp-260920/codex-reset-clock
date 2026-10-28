#!/usr/bin/env python3
"""Deterministic, dependency-free bilingual Codex Limit Clock Pages build.

No OpenAI account access, API token, claims of scheduled global resets,
advertising, analytic beacons, or personal date data baked into output.
"""
from __future__ import annotations

from datetime import date
from hashlib import sha256
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET
import argparse

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
PUBLIC = "https://livastic-vm3-primary-tmp-260920.github.io/codex-reset-clock/"
RESET_DOCS = "https://help.openai.com/en/articles/20001498-how-resets-work-in-codex"
USAGE_DOCS = "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan"
HELP_USAGE = "https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex"
PAID_DOCS = "https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets"
OFFICIAL_STATUS = "https://status.openai.com/"
REVIEWED = "2026-10-28"
WINDOWS = ("five", "weekly", "banked")

COPY = {
 "en":{
  "lang":"en",
  "title":"Codex Reset Time Calculator — 5-Hour, Weekly & Banked | Codex Limit Clock",
  "description":"Free Codex usage reset countdown: convert the exact 5-hour, weekly or banked reset deadline shown in your account. Timezones, 15-minute calendar reminders, no login or tracking.",
  "navTool":"The calculator","navExplain":"Reset basics","navSources":"Official sources",
  "brandSub":"Independent usage-time companion",
  "eyebrow":"Your time. No unreliable reset predictions.",
  "heroOne":"Know when your","heroTwo":"Codex limits","heroThree":"refresh.",
  "heroLead":"Copy the reset times from your own Usage screen. See a live countdown, compare time zones and add calendar reminders—without connecting an account.",
  "start":"Start your countdown","how":"How resets work",
  "flagOne":"No account connection","flagTwo":"Free · ad-free","flagThree":"English + 한국어",
  "clockEyebrow":"Live time display · your device",
  "clockTitle":"The clock is accurate. Reset claims require a source.",
  "local":"Current device time","utc":"Current UTC time",
  "clockNote":"The time display updates on your device. It is not connected to OpenAI's account usage or any live reset announcement feed.",
  "banner":"Important distinction:",
  "bannerBody":" A regular allowance refresh is account-specific. A banked reset is a separate offer you may redeem, and an automatic/global reset only covers eligible accounts. No public site can know your personal remaining allowance. Always check your official Usage screen.",
  "stepKicker":"01 · THE PRIVATE COUNTDOWN",
  "sectionTitle":"Your limits, in your time zone.",
  "sectionLead":"Use the exact date and time shown in your account. Empty fields are intentional—we cannot see your private Codex usage.",
  "zoneLabel":"Show converted time in",
  "remember":"Remember these dates on this browser (optional, local-only)",
  "demo":"Try fictional demo","clear":"Clear everything",
  "wFive":"5-hour window","wFiveTop":"SHORT WINDOW",
  "wFiveHelp":"Use only if your plan and Usage screen actually show a 5-hour reset. Plans differ; the website cannot determine your entitlement.",
  "wWeekly":"Weekly reset","wWeeklyTop":"WEEKLY WINDOW",
  "wWeeklyHelp":"Enter the exact upcoming weekly reset timestamp displayed in your account. Promotional or paid resets may change this date.",
  "wBanked":"Banked reset expiry","wBankedTop":"OPTIONAL OFFER",
  "wBankedHelp":"If your account has a saved one-time reset, enter its redemption deadline—not an imaginary global reset date. This tool cannot redeem it.",
  "dateLabel":"Exact local date and time (from your Usage screen)",
  "calendar":"Download 15-minute-before reminder (.ics)",
  "estimateTitle":"Only know when your 5-hour session began?",
  "estimateLead":"For a plan with a 5-hour window, estimate five elapsed hours from a start time. This is an approximation, not an account-specific reset guarantee.",
  "estimateLabel":"Local start time","estimateBtn":"Estimate +5 hours",
  "estimateWarning":"If your dashboard shows a different reset time, follow the dashboard. Local clock changes, DST and account resets can change expectations.",
  "convertEyebrow":"02 · ANNOUNCEMENT TIME CONVERTER",
  "convertTitle":"Saw a UTC time in a post?",
  "convertLead":"Paste an ISO timestamp with a Z or explicit offset. We convert it, but do not verify the announcement, its scope, or whether a reset has happened.",
  "convertInput":"Announcement timestamp with timezone",
  "convertBtn":"Convert time",
  "explainEyebrow":"03 · KNOW WHAT IS REAL",
  "explainTitle":"Not every reset means the same thing.",
  "explainLead":"Official account information is more reliable than crowdsourced reset forecasts.",
  "sourceTitleOne":"Check your own Usage screen",
  "sourceTextOne":"Remaining allowance and applicable reset dates depend on your plan and workspace. In the Codex CLI, usage commands may also be available.",
  "sourceActionOne":"Official Codex plan & usage guide",
  "sourceTitleTwo":"Banked vs. automatic resets",
  "sourceTextTwo":"A banked reset is saved until redeemed or expired. An automatic/global reset is directly applied only to eligible accounts and is not guaranteed to recur.",
  "sourceActionTwo":"Official reset types & eligibility",
  "sourceTitleThree":"Service health is not a reset",
  "sourceTextThree":"Incident reports, maintenance and outages are not usage-limit refreshes. The official status page is a service-health source—not a personal usage feed.",
  "sourceActionThree":"Open official system status",
  "faqTitle":"Common questions",
  "q1":"When will Codex reset for me?",
  "a1":"Open Codex or ChatGPT Settings → Usage and enter the exact reset time displayed there. This independent calculator does not log into your account or read your usage. Five-hour and weekly windows depend on plan eligibility.",
  "q2":"Can this website force a Codex reset or show the next global reset?",
  "a2":"No. It cannot reset your allowance, retrieve hidden account limits or predict discretionary global resets. Official resets are only confirmed by OpenAI or your account's updated Usage screen.",
  "q3":"Do banked resets start a new weekly window?",
  "a3":"A banked reset may refresh your eligible usage limits and change the weekly reset date when redeemed. Eligibility, expiration and covered allowances depend on the actual offer; see OpenAI's official reset guidance.",
  "q4":"Why does the countdown disagree with my Usage screen?",
  "a4":"This website uses the date you manually entered and your device clock. A purchased reset, redeemed banked reset, workspace policy change, clock or time-zone mismatch may alter the official deadline. Your account's Usage screen wins.",
  "q5":"Do you collect my API key, account details or reset dates?",
  "a5":"No account or API connection exists. The countdown runs in your browser. Dates are not saved unless you opt into local browser storage; the Clear button deletes that local record. GitHub Pages still sees ordinary network metadata needed to serve website files.",
  "extraTitle":"Is a paid reset the same as a saved reset?",
  "extraText":"No. A purchased instant reset applies immediately after payment for eligible accounts, while an available banked reset can be redeemed later subject to its offer terms.",
  "extraLink":"Official paid-reset rules",
  "footer":"Independent free tool. Not affiliated with, sponsored by or endorsed by OpenAI. No ads, analytics, external scripts or sign-in. Documentation reviewed 28 October 2026; policies may change.",
  "sourceFooter":"Read the official documentation",
  "usageGuide":"Usage guidance"
 },
 "ko":{
  "lang":"ko",
  "title":"Codex 사용량 초기화 시간 계산기 | 5시간·주간 한도·초기화권",
  "description":"무료 Codex 초기화 시간 계산기. 내 계정의 5시간·주간 사용량 초기화 시각과 저장된 초기화권 만료일을 입력해 실시간 카운트다운, 한국 시간 변환, 캘린더 알림을 확인하세요. 로그인 없음.",
  "navTool":"시간 계산기","navExplain":"초기화 안내","navSources":"공식 문서",
  "brandSub":"독립적인 사용량 시간 계산 도구",
  "eyebrow":"추측 대신, 내 계정에 표시된 시간",
  "heroOne":"Codex 사용량,","heroTwo":"언제 다시","heroThree":"쓸 수 있을까?",
  "heroLead":"내 사용량 설정에 표시된 초기화 시각을 입력하세요. 실시간 남은 시간과 한국·해외 시간 변환, 캘린더 알림까지. 계정 연결은 필요 없습니다.",
  "start":"초기화 시간 계산하기","how":"초기화 방식 알아보기",
  "flagOne":"계정 연결 없음","flagTwo":"무료 · 광고 없음","flagThree":"한국어 + English",
  "clockEyebrow":"실시간 기기 시각 표시",
  "clockTitle":"시각 계산은 정확하게. 실제 초기화 여부는 공식 정보로.",
  "local":"현재 기기 시각","utc":"현재 UTC 시각",
  "clockNote":"현재 시간은 내 기기에서 갱신됩니다. OpenAI 사용량 계정이나 전역 초기화 발표를 실시간 조회하는 서비스는 아닙니다.",
  "banner":"먼저 구분하세요:",
  "bannerBody":" 계정별 정기 사용량 갱신과 보관된 1회 초기화권, OpenAI가 일부 대상에 적용하는 추가 초기화는 서로 다릅니다. 공개 사이트에서는 개인 계정의 남은 사용량을 알 수 없습니다. 공식 사용량 화면이 기준입니다.",
  "stepKicker":"01 · 내 계정 카운트다운",
  "sectionTitle":"내 초기화 시각을 정확하게.",
  "sectionLead":"내 사용량 화면에 있는 날짜·시간을 입력하세요. 초기값이 비어 있는 이유는 개인 계정의 정보를 이 사이트가 볼 수 없기 때문입니다.",
  "zoneLabel":"변환해서 보여줄 시간대",
  "remember":"이 브라우저에 날짜 저장하기(선택, 서버 전송 없음)",
  "demo":"가상 예제 보기","clear":"모두 지우기",
  "wFive":"5시간 한도","wFiveTop":"단기 한도",
  "wFiveHelp":"내 요금제 및 사용량 화면에 5시간 갱신이 있을 때만 입력하세요. 모든 계정에 같은 제한이 적용되지는 않습니다.",
  "wWeekly":"주간 초기화","wWeeklyTop":"주간 한도",
  "wWeeklyHelp":"계정의 사용량 화면에 표시된 다음 주간 초기화 시각을 입력하세요. 유료 또는 보관된 초기화권 사용 후 달라질 수 있습니다.",
  "wBanked":"보관된 초기화권 만료","wBankedTop":"선택적 혜택",
  "wBankedHelp":"계정에 초기화권이 있다면 사용 가능 만료 시각을 입력하세요. 전역 초기화 예상일이 아닙니다. 이 사이트에서는 초기화권을 사용할 수 없습니다.",
  "dateLabel":"사용량 화면에 표시된 현지 날짜와 시각",
  "calendar":"15분 전 캘린더 알림(.ics) 저장",
  "estimateTitle":"5시간 한도의 시작 시각만 알고 있나요?",
  "estimateLead":"5시간 창이 적용되는 계정이라면 시작 시각 + 5시간을 추정할 수 있습니다. 공식 초기화 시간과 일치한다는 보장은 없습니다.",
  "estimateLabel":"현지 시작 시각","estimateBtn":"5시간 후 추정",
  "estimateWarning":"실제 계정 화면에 다른 초기화 시각이 있으면 공식 화면을 따르세요. 일광절약시간이나 계정 초기화권 사용도 시간 계산에 영향을 줍니다.",
  "convertEyebrow":"02 · 공식 발표 시각 변환",
  "convertTitle":"공지에 UTC 시간이 있나요?",
  "convertLead":"Z 또는 시간대 오프셋이 포함된 시각을 입력하면 변환합니다. 해당 공지가 진짜인지 또는 모든 계정에 적용되는지 검증하는 것은 아닙니다.",
  "convertInput":"시간대가 포함된 공지 시각",
  "convertBtn":"시간 변환",
  "explainEyebrow":"03 · 초기화 방식 구분",
  "explainTitle":"모든 초기화가 같은 건 아닙니다.",
  "explainLead":"커뮤니티의 날짜 예측보다 내 계정의 공식 사용량 정보가 우선합니다.",
  "sourceTitleOne":"내 사용량 설정 확인",
  "sourceTextOne":"잔여 사용량과 초기화 시각은 요금제·워크스페이스에 따라 다릅니다. Codex CLI에서도 사용량 확인 명령을 이용할 수 있습니다.",
  "sourceActionOne":"공식 Codex 사용량 안내",
  "sourceTitleTwo":"보관된 초기화권과 자동 초기화",
  "sourceTextTwo":"보관된 초기화권은 사용하거나 만료될 때까지 남습니다. 자동/전역 초기화는 적용 대상 계정에만 직접 반영되며 반복 일정은 보장되지 않습니다.",
  "sourceActionTwo":"초기화 종류·대상 공식 안내",
  "sourceTitleThree":"서비스 장애는 초기화가 아닙니다",
  "sourceTextThree":"장애·점검과 사용량 초기화는 다른 사건입니다. 공식 상태 페이지는 서비스 운영 상태를 보여주며 개인 한도는 제공하지 않습니다.",
  "sourceActionThree":"OpenAI 공식 서비스 상태",
  "faqTitle":"자주 묻는 질문",
  "q1":"내 Codex 사용량은 언제 초기화되나요?",
  "a1":"Codex 또는 ChatGPT의 설정 → 사용량에서 정확한 초기화 시각을 확인하고 입력하세요. 이 독립적인 계산기는 계정에 로그인하거나 사용량을 가져오지 않습니다. 5시간·주간 한도 적용 여부도 요금제마다 다를 수 있습니다.",
  "q2":"이 사이트에서 Codex를 강제로 초기화하거나 전역 초기화를 예측하나요?",
  "a2":"아니요. 계정 사용량을 초기화하거나 숨겨진 잔여량을 읽거나 임의로 정해지는 전역 초기화를 예측하지 않습니다. OpenAI의 공식 발표 또는 실제 사용량 화면으로만 확인할 수 있습니다.",
  "q3":"저장된 초기화권을 사용하면 주간 초기화 시각도 바뀌나요?",
  "a3":"대상에 포함된 한도를 갱신하고 주간 초기화 기준이 바뀔 수 있습니다. 적용 조건·만료일·갱신되는 항목은 실제 계정 혜택과 공식 초기화 안내를 확인하세요.",
  "q4":"계산기와 계정에 표시된 시간이 다르면요?",
  "a4":"이 사이트는 직접 입력한 시각과 기기 시계로 계산합니다. 유료·보관 초기화권 사용, 워크스페이스 설정이나 시간대 변경에 따라 공식 시간이 달라질 수 있습니다. 계정의 사용량 화면이 우선합니다.",
  "q5":"API 키·계정·입력한 날짜를 수집하나요?",
  "a5":"계정이나 API 연결이 없습니다. 계산은 브라우저 안에서 처리됩니다. 선택적으로 로컬 저장을 켠 경우만 해당 브라우저에 날짜를 저장하고 '모두 지우기'로 삭제할 수 있습니다. 웹파일 제공을 위해 GitHub Pages 서버에서 일반적인 HTTP 연결 정보가 처리될 수 있습니다.",
  "extraTitle":"돈 내는 즉시 초기화와 저장된 초기화권은 같은가요?",
  "extraText":"다릅니다. 대상 계정의 유료 즉시 초기화는 결제가 승인되면 바로 적용되는 반면, 보관된 초기화권은 제공 조건에 따라 나중에 직접 사용할 수 있습니다.",
  "extraLink":"공식 유료 초기화 안내",
  "footer":"독립적인 무료 도구로 OpenAI가 운영·후원·보증하지 않습니다. 광고, 추적, 외부 스크립트, 회원가입이 없습니다. 공식 문서 확인일: 2026년 10월 28일. 정책은 변경될 수 있습니다.",
  "sourceFooter":"공식 안내 문서 보기",
  "usageGuide":"사용량 관련 문서"
 }
}

ZONE_OPTIONS = (
 ("device","Auto / device"),
 ("Asia/Seoul","Seoul · KST"),
 ("UTC","UTC"),
 ("America/Los_Angeles","Los Angeles · PT"),
 ("America/New_York","New York · ET"),
 ("Europe/London","London · UK"),
 ("Europe/Berlin","Berlin · CET/CEST"),
 ("Asia/Tokyo","Tokyo · JST"),
 ("Asia/Singapore","Singapore · SGT"),
 ("Australia/Sydney","Sydney · AEST/AEDT"),
)
def html_window(name:str,d:dict)->str:
    label=d["w"+name.capitalize()]
    top=d["w"+name.capitalize()+"Top"]
    helptext=d["w"+name.capitalize()+"Help"]
    return f"""<article class="window-card" data-window="{name}" data-state="unset" id="window-{name}">
  <div class="card-eyebrow"><span>{escape(top)}</span><span class="card-number">{WINDOWS.index(name)+1:02d} / 03</span></div>
  <h3>{escape(label)}</h3>
  <p class="help">{escape(helptext)}</p>
  <label class="field-label" for="time-{name}">{escape(d["dateLabel"])}</label>
  <input type="datetime-local" id="time-{name}" autocomplete="off" step="60"
         aria-describedby="window-{name}-hint" aria-label="{escape(label)}">
  <div class="display-block">
    <p class="label-upper" aria-hidden="true">{escape(d["w"+name.capitalize()])}</p>
    <div class="count" data-count aria-live="off"></div>
    <div class="date-shown" data-converted></div>
    <p class="hint" id="window-{name}-hint" data-hint></p>
    <button class="btn-calendar" type="button" data-calendar="{name}" disabled>{escape(d["calendar"])}</button>
  </div>
</article>"""

def source_card(kind:str,heading:str,body:str,anchor:str,url:str)->str:
    return f"""<article class="source-card">
 <div class="card-kicker">{escape(kind)}</div>
 <h3>{escape(heading)}</h3><p>{escape(body)}</p>
 <a href="{escape(url,quote=True)}" target="_blank" rel="noopener noreferrer">{escape(anchor)} ↗</a>
</article>"""

def faq(q:str,a:str,idx:int)->str:
    return f'<details><summary>{idx}. {escape(q)}</summary><p>{escape(a)}</p></details>'

def render(lang:str)->str:
    d=COPY[lang]
    ko=lang=="ko"
    url=PUBLIC+("ko/" if ko else "")
    stylesheet="../assets/style.css" if ko else "assets/style.css"
    script="../assets/app.mjs" if ko else "assets/app.mjs"
    nav_en='aria-current="page"' if not ko else ""
    nav_ko='aria-current="page"' if ko else ""
    zones="\n".join('<option value="'+escape(value,quote=True)+'">'+escape(text)+'</option>'
                    for value,text in ZONE_OPTIONS)
    windows="\n".join(html_window(name,d) for name in WINDOWS)
    qna="\n".join(faq(d["q"+str(n)],d["a"+str(n)],n) for n in range(1,6))
    cards="\n".join([
      source_card("OFFICIAL USAGE",d["sourceTitleOne"],d["sourceTextOne"],
                  d["sourceActionOne"],USAGE_DOCS),
      source_card("RESET RULES",d["sourceTitleTwo"],d["sourceTextTwo"],
                  d["sourceActionTwo"],RESET_DOCS),
      source_card("SYSTEM STATUS",d["sourceTitleThree"],d["sourceTextThree"],
                  d["sourceActionThree"],OFFICIAL_STATUS)
    ])
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow,max-snippet:-1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'self' data:; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'">
<title>{escape(d["title"])}</title>
<meta name="description" content="{escape(d["description"],quote=True)}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="en" href="{PUBLIC}">
<link rel="alternate" hreflang="ko" href="{PUBLIC}ko/">
<link rel="alternate" hreflang="x-default" href="{PUBLIC}">
<meta property="og:type" content="website">
<meta property="og:title" content="{escape(d["title"],quote=True)}">
<meta property="og:description" content="{escape(d["description"],quote=True)}">
<meta property="og:url" content="{url}">
<meta name="theme-color" content="#08151b">
<link rel="icon" href="data:,">
<link rel="stylesheet" href="{stylesheet}">
<script type="module" src="{script}"></script>
</head>
<body>
<a class="skip" href="#main">{"본문 바로가기" if ko else "Skip to content"}</a>
<header class="site-header"><div class="shell header-row">
 <a class="identity" href="{PUBLIC}" aria-label="Codex Limit Clock home"><span class="mark" aria-hidden="true">◴</span><span>Codex Limit Clock<span class="brand-sub">{escape(d["brandSub"])}</span></span></a>
 <nav class="site-nav" aria-label="{"주요 메뉴" if ko else "Primary navigation"}">
   <a href="#calculator">{escape(d["navTool"])}</a>
   <a href="#explain">{escape(d["navExplain"])}</a>
   <a href="#sources">{escape(d["navSources"])}</a>
   <div class="lang-links" aria-label="Language">
      <a href="{PUBLIC}" hreflang="en" {nav_en}>EN</a>
      <a href="{PUBLIC}ko/" hreflang="ko" {nav_ko}>한국어</a>
   </div>
 </nav>
</div></header>
<main id="main">
 <div class="shell">
 <section class="hero" aria-labelledby="hero-title">
  <div>
    <div class="eyebrow"><span class="dot"></span>{escape(d["eyebrow"])}</div>
    <h1 id="hero-title">{escape(d["heroOne"])} <em>{escape(d["heroTwo"])}</em> {escape(d["heroThree"])}</h1>
    <p class="hero-lede">{escape(d["heroLead"])}</p>
    <div class="hero-actions"><a class="btn-primary" href="#calculator">{escape(d["start"])} ↗</a>
      <a class="btn-outline" href="#explain">{escape(d["how"])} ↓</a></div>
    <div class="hero-flags"><span>{escape(d["flagOne"])}</span><span>{escape(d["flagTwo"])}</span><span>{escape(d["flagThree"])}</span></div>
  </div>
  <aside class="clock-panel" aria-label="{"실시간 기기 시계" if ko else "Live device clock"}">
    <div class="panel-kicker">{escape(d["clockEyebrow"])}</div>
    <p class="clock-title">{escape(d["clockTitle"])}</p>
    <div class="label-upper">{escape(d["local"])} · <span id="device-zone">—</span></div>
    <div class="big-time" id="device-now">—</div>
    <div class="divider"></div>
    <div class="label-upper">{escape(d["utc"])}</div>
    <div class="utc-time" id="utc-now">—</div>
    <p class="panel-foot">{escape(d["clockNote"])}</p>
  </aside>
 </section>
 <div class="inline-note"><strong>{escape(d["banner"])}</strong>{escape(d["bannerBody"])}</div>
 <section id="calculator" aria-labelledby="calculator-title">
   <div class="section-head"><div><div class="small-kicker">{escape(d["stepKicker"])}</div>
     <h2 id="calculator-title">{escape(d["sectionTitle"])}</h2></div>
     <p>{escape(d["sectionLead"])}</p></div>
   <div class="config-strip">
    <label for="zone">{escape(d["zoneLabel"])}
      <select id="zone" aria-label="{escape(d["zoneLabel"])}">{zones}</select>
    </label>
    <div class="config-buttons">
      <button type="button" id="demo" class="btn-small">{escape(d["demo"])}</button>
      <button type="button" id="clear" class="btn-small">{escape(d["clear"])}</button>
    </div>
    <label class="privacy-label" for="remember"><input type="checkbox" id="remember">
      {escape(d["remember"])}</label>
   </div>
   <div class="windows">{windows}</div>
   <div class="estimated">
      <h3>{escape(d["estimateTitle"])}</h3>
      <p>{escape(d["estimateLead"])}</p>
      <div class="estimate-controls">
        <label class="sr-only" for="start-five">{escape(d["estimateLabel"])}</label>
        <input type="datetime-local" id="start-five" autocomplete="off" step="60" aria-label="{escape(d["estimateLabel"])}">
        <button class="btn-small" type="button" id="estimate">{escape(d["estimateBtn"])}</button>
      </div>
      <p class="estimate-explain">{escape(d["estimateWarning"])}</p>
   </div>
   <div class="feedback" id="feedback" role="status" aria-live="polite"></div>
 </section>
 <section id="converter" aria-labelledby="converter-title">
  <div class="section-head"><div><div class="small-kicker">{escape(d["convertEyebrow"])}</div>
   <h2 id="converter-title">{escape(d["convertTitle"])}</h2></div>
   <p>{escape(d["convertLead"])}</p></div>
  <div class="converter">
   <div><h3>{escape(d["convertInput"])}</h3><p>{escape(d["convertLead"])}</p></div>
   <div><div class="converter-form">
     <label class="sr-only" for="utc-converter">{escape(d["convertInput"])}</label>
     <input type="text" id="utc-converter" autocomplete="off" autocapitalize="off" spellcheck="false"
       placeholder="2026-10-28T17:00Z" aria-label="{escape(d["convertInput"])}">
     <button id="convert" class="btn-primary" type="button">{escape(d["convertBtn"])}</button>
    </div><div id="convert-result" class="converter-result" role="status" aria-live="polite"></div></div>
  </div>
 </section>
 <section id="explain" class="sources" aria-labelledby="sources-title">
  <div class="section-head"><div><div class="small-kicker">{escape(d["explainEyebrow"])}</div>
     <h2 id="sources-title">{escape(d["explainTitle"])}</h2></div>
     <p>{escape(d["explainLead"])}</p>
  </div>
  <div id="sources" class="source-cards">{cards}</div>
 </section>
 <section class="faq" aria-labelledby="faq-title">
  <div class="section-head"><div><div class="small-kicker">FAQ</div>
   <h2 id="faq-title">{escape(d["faqTitle"])}</h2></div></div>
  {qna}
  <details><summary>6. {escape(d["extraTitle"])}</summary>
   <p>{escape(d["extraText"])} <a target="_blank" rel="noopener noreferrer" href="{PAID_DOCS}">{escape(d["extraLink"])} ↗</a></p>
  </details>
 </section>
 </div>
</main>
<footer class="site-footer"><div class="shell footer-row">
 <p>{escape(d["footer"])}</p>
 <a href="{RESET_DOCS}" target="_blank" rel="noopener noreferrer">{escape(d["sourceFooter"])} ↗</a>
</div></footer>
</body></html>
"""

def build() -> dict[Path,bytes]:
    en=render("en").encode("utf-8")
    ko=render("ko").encode("utf-8")
    links=[PUBLIC, PUBLIC+"ko/"]
    sitemap='<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap+='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in links:
        sitemap+='  <url><loc>'+escape(url)+'</loc><lastmod>'+REVIEWED+'</lastmod></url>\n'
    sitemap+='</urlset>\n'
    return {
        DOCS/"index.html":en,
        DOCS/"ko"/"index.html":ko,
        DOCS/"sitemap.xml":sitemap.encode("utf-8"),
        DOCS/".nojekyll":b"",
        DOCS/"assets"/"core.mjs":(ROOT/"src"/"core.mjs").read_bytes()
    }

def validate(output:dict[Path,bytes]) -> None:
    for locale,path in (("en",DOCS/"index.html"),("ko",DOCS/"ko"/"index.html")):
        html=output[path].decode("utf-8")
        assert '<html lang="'+locale+'">' in html
        assert html.count('<h1 ')==1
        assert html.count("rel=\"canonical\"")==1
        assert html.count("type=\"datetime-local\"")==4
        assert html.count("data-calendar=")==3
        assert html.count("data-window=")==3
        assert "connect-src 'none'" in html
        assert "script-src 'self'" in html
        assert "banked" in html
        assert html.count('href="'+RESET_DOCS+'"')>=2
        assert "OpenAI" in html
        for forbidden in ("google-analytics","googletagmanager","adsterra",
                          "bauval.org","abscloud.org","araplhn.org",
                          "adsbygoogle","<iframe","fetch(","XMLHttpRequest",
                          "authentication token","password="):
            assert forbidden.lower() not in html.lower(),forbidden
        expected=PUBLIC+("ko/" if locale=="ko" else "")
        assert '<link rel="canonical" href="'+expected+'">' in html
        assert "noindex" not in html
        assert len(html)>11000
    assert ET.fromstring(output[DOCS/"sitemap.xml"]).tag.endswith("urlset")
    assert output[DOCS/"assets"/"core.mjs"]==(ROOT/"src"/"core.mjs").read_bytes()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    output=build()
    validate(output)
    for path,payload in output.items():
        if args.check:
            if not path.exists() or path.read_bytes()!=payload:
                raise SystemExit("Build output not reproducible: "+str(path))
        else:
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(payload)
        print(("VERIFIED" if args.check else "BUILT"),path.relative_to(ROOT),
              len(payload),sha256(payload).hexdigest())
    print("EN_AND_KO_CANONICAL_PAGES_PRIVACY_SAFE")

if __name__=="__main__":
    main()
