// 성장 곡선 페이지 — 퀘스트 보상 로그 그래프 + 레벨 표(KO/EN 공용 · 2026-11-06)
// mountQuestReward({ chart, table, lang }) · 데이터 = window.QUEST_REWARD(assets/data/quest_reward.js)
(function () {
  var T = {
    ko: {
      need: "다음 레벨까지 필요 경험치", quest: "퀘스트 보상 합계(본편 + 서브)", twin: "자동 플레이 실측(재테스트7 · L1~28)",
      target: "설계 퀘스트 몫(필요 × 30% → 10%)", dip: "앞 레벨보다 줄어든 곳", axis: "세로축 = 로그 눈금", story: "본편 끝",
      level: "레벨", main: "본편", sub: "서브", total: "합계", share: "필요 대비", goal: "설계 몫", none: "없음", levels: "레벨", locale: "ko-KR",
      fill: "보강안(예정) · L28~36 서브 +12편", fillCol: "보강안 몫", now: "현재 데이터", plan: "보강안(예정) 겹쳐 보기",
    },
    en: {
      need: "EXP to next level", quest: "Quest reward total (main + side)", twin: "Autoplay measured (retest 7 · L1–28)",
      target: "Design quest share (need × 30% → 10%)", dip: "Lower than the level before", axis: "Vertical axis = log scale", story: "Story end",
      level: "Level", main: "Main", sub: "Side", total: "Total", share: "Share of need", goal: "Design share", none: "none", levels: "Levels", locale: "en-US",
      fill: "Planned fill · L28–36 +12 side quests", fillCol: "Planned share", now: "Current data", plan: "Overlay planned fill",
    },
  };
  var target = function (L) { return L < 16 ? null : L <= 40 ? 0.3 : 0.3 - (0.2 * (L - 40)) / 20; };

  window.mountQuestReward = function (opt) {
    var D = window.QUEST_REWARD;
    var t = T[opt.lang] || T.ko;
    if (!D || !opt.chart) return;
    var fmt = function (v) { return Math.round(v).toLocaleString(t.locale); };
    var pct = function (v) { return Math.round(v * 100) + "%"; };
    var rows = D.rows.map(function (a) { return { level: a[0], need: a[1], sn: a[2], m: a[3], bn: a[4], b: a[5], t: a[3] + a[5] }; });
    var prevT = 0;
    rows.forEach(function (r) {
      r.share = r.t / r.need;
      r.goal = target(r.level);
      r.dip = r.level >= 17 && (r.t === 0 || (prevT > 0 && r.t < prevT));
      if (r.t > 0) prevT = r.t;
      r.twin = r.level <= D.twin.length ? D.twin[r.level - 1] : null;
      var f = (D.fill || []).filter(function (x) { return x[0] === r.level; })[0];
      r.t2 = f ? f[1] : r.t; r.add = f ? f[2] : 0; r.share2 = r.t2 / r.need;
    });
    var showPlan = false;
    function draw() {

    // 로그 그래프 — 필요 EXP · 퀘스트 합계 · 실측 · 설계 몫(0 은 로그 눈금에 못 그려 선을 끊는다)
    var W = 760, H = 340, mL = 56, mR = 12, mT = 12, mB = 30, lo = 2, hi = 7;
    var X = function (lv) { return mL + ((lv - 1) / 58) * (W - mL - mR); };
    var Y = function (v) { return mT + (1 - (Math.log10(v) - lo) / (hi - lo)) * (H - mT - mB); };
    var line = function (pts) {
      var d = "", pen = false;
      pts.forEach(function (p) { if (!(p[1] > 0)) { pen = false; return; } d += (pen ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1) + " "; pen = true; });
      return d;
    };
    var short = function (v) { return v >= 1e6 ? v / 1e6 + "M" : v >= 1e3 ? v / 1e3 + "K" : String(v); };
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" style="min-width:420px;font-family:var(--font-body)">';
    for (var e = lo; e <= hi; e += 1) {
      var y = Y(Math.pow(10, e));
      svg += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y + '" y2="' + y + '" stroke="var(--border)" stroke-width="1"/>';
      svg += '<text x="' + (mL - 6) + '" y="' + y + '" dy="0.32em" text-anchor="end" font-size="11" fill="var(--text-dim)">' + short(Math.pow(10, e)) + "</text>";
    }
    [1, 10, 16, 20, 28, 31, 35, 40, 50, 59].forEach(function (lv) {
      svg += '<text x="' + X(lv) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--text-dim)">L' + lv + "</text>";
    });
    svg += '<line x1="' + X(D.storyEnd) + '" x2="' + X(D.storyEnd) + '" y1="' + mT + '" y2="' + (H - mB) + '" stroke="var(--border)" stroke-dasharray="2 4"/>';
    svg += '<text x="' + (X(D.storyEnd) + 4) + '" y="' + (mT + 12) + '" font-size="11" fill="var(--text-dim)">' + t.story + "</text>";
    svg += '<path d="' + line(rows.map(function (r) { return [r.level, r.need]; })) + '" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/>';
    svg += '<path d="' + line(rows.filter(function (r) { return r.goal != null; }).map(function (r) { return [r.level, r.need * r.goal]; })) + '" fill="none" stroke="var(--text-dim)" stroke-width="1.6" stroke-dasharray="5 4"/>';
    svg += '<path d="' + line(rows.map(function (r) { return [r.level, r.t]; })) + '" fill="none" stroke="var(--warm)" stroke-width="2.2" stroke-linejoin="round"/>';
    svg += '<path d="' + line(D.twin.map(function (v, i) { return [i + 1, v]; })) + '" fill="none" stroke="var(--text)" stroke-width="1.4" stroke-dasharray="1 3" stroke-linecap="round"/>';
    if (showPlan) {
      svg += '<path d="' + line(rows.filter(function (r) { return r.level >= 27 && r.level <= 37; }).map(function (r) { return [r.level, r.t2]; })) + '" fill="none" stroke="var(--warm)" stroke-width="2.6" stroke-dasharray="6 4" stroke-linejoin="round"/>';
      rows.forEach(function (r) {
        if (r.add) svg += '<circle cx="' + X(r.level).toFixed(1) + '" cy="' + Y(r.t2).toFixed(1) + '" r="3.5" fill="var(--bg)" stroke="var(--warm)" stroke-width="2"><title>L' + r.level + " +" + r.add + " · " + fmt(r.t2) + " · " + pct(r.share2) + "</title></circle>";
      });
    }
    rows.forEach(function (r) {
      if (r.t > 0 && r.dip) svg += '<circle cx="' + X(r.level).toFixed(1) + '" cy="' + Y(r.t).toFixed(1) + '" r="4" fill="var(--warm)" stroke="var(--bg)" stroke-width="2"><title>L' + r.level + " · " + fmt(r.t) + " · " + pct(r.share) + "</title></circle>";
    });
    svg += "</svg>";
    var key = function (style, label) { return '<span><span style="display:inline-block;width:16px;height:0;border-top:' + style + ';vertical-align:middle;margin-right:6px"></span>' + label + "</span>"; };
    var legend = '<div style="display:flex;gap:1.2em;flex-wrap:wrap;font-size:0.85em;color:var(--text-dim);margin:0.3em 0 0.8em">' +
      key("2px solid var(--accent)", t.need) + key("2px solid var(--warm)", t.quest) + (showPlan ? key("2px dashed var(--warm)", t.fill) : "") + key("2px dotted var(--text)", t.twin) + key("2px dashed var(--text-dim)", t.target) +
      '<span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--warm);vertical-align:middle;margin-right:6px"></span>' + t.dip + "</span>" +
      "<span>" + t.axis + "</span></div>";
    var btn = function (id, on, label) { return '<button type="button" data-qr="' + id + '" aria-pressed="' + on + '" style="font:inherit;font-size:0.85em;padding:5px 12px;border:0;cursor:pointer;background:' + (on ? "var(--text)" : "transparent") + ";color:" + (on ? "var(--bg)" : "var(--text-dim)") + '">' + label + "</button>"; };
    var toggle = D.fill ? '<div style="display:flex;margin:0.2em 0 0.6em;border:1px solid var(--border);border-radius:8px;overflow:hidden;width:max-content;max-width:100%">' + btn("now", !showPlan, t.now) + btn("plan", showPlan, t.plan) + "</div>" : "";
    opt.chart.innerHTML = toggle + svg + legend;
    Array.prototype.forEach.call(opt.chart.querySelectorAll ? opt.chart.querySelectorAll("button[data-qr]") : [], function (b) {
      b.onclick = function () { showPlan = b.getAttribute("data-qr") === "plan"; draw(); };
    });
    }
    draw();

    if (!opt.table || typeof mountWikiDataTable !== "function") return;
    var warm = function (on, s) { return on ? '<span style="color:var(--warm)">' + s + "</span>" : s; };
    mountWikiDataTable({
      mount: opt.table,
      data: rows,
      label: t.levels,
      pageSize: 60,
      searchKeys: ["level"],
      columns: [
        { key: "level", label: t.level, num: true, render: function (r) { return "L" + r.level; } },
        { key: "need", label: t.need, num: true, render: function (r) { return fmt(r.need); } },
        { key: "sn", label: t.main, num: true, render: function (r) { return r.sn ? r.sn + " · " + fmt(r.m) : "—"; } },
        { key: "bn", label: t.sub, num: true, render: function (r) { return r.bn ? r.bn + " · " + fmt(r.b) : "—"; } },
        { key: "t", label: t.total, num: true, render: function (r) { return warm(r.dip, r.t ? fmt(r.t) : t.none); } },
        { key: "share", label: t.share, num: true, render: function (r) { return warm(r.dip, pct(r.share)); } },
        { key: "share2", label: t.fillCol, num: true, render: function (r) { return r.add ? "<strong>" + pct(r.share2) + "</strong> (+" + r.add + ")" : "—"; } },
        { key: "goal", label: t.goal, num: true, render: function (r) { return r.goal == null ? "—" : pct(r.goal); } },
        { key: "twin", label: t.twin, num: true, render: function (r) { return r.twin == null ? "—" : r.twin ? fmt(r.twin) : t.none; } },
      ],
    });
  };
})();
