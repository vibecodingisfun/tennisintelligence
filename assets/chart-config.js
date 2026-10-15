export const PLOT = { left: 18, top: 10, size: 88 };
export const VB = 118;
export const FH_ALWAYS = [
  "Novak Djokovic", "Rafael Nadal", "Roger Federer", "Andy Murray",
  "Juan Martin Del Potro", "Stan Wawrinka", "Dominic Thiem", "Grigor Dimitrov",
  "Tomas Berdych", "Milos Raonic",
];
export const WTA_ALWAYS = [
  "Serena Williams", "Venus Williams", "Maria Sharapova", "Kim Clijsters",
  "Angelique Kerber", "Ashleigh Barty", "Naomi Osaka", "Iga Swiatek",
  "Aryna Sabalenka", "Elena Rybakina",
  "Coco Gauff", "Jessica Pegula", "Mirra Andreeva", "Madison Keys",
  "Na Li", "Anna Kalinskaya",
];
export const MEN = FH_ALWAYS.concat(["Andre Agassi", "Pete Sampras"]);

export function n(value, digits) { return Number(value).toFixed(digits); }
export function esc(value) {
  return String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}
export function lastName(name) {
  const parts = String(name || "").split(" ");
  return parts[parts.length - 1] || name;
}

export const ORDER = ["drop", "fh", "fhpts", "bh", "serve", "first", "wtaFh", "wtaBh", "wtaSv", "wtaFs"];

export const COPY = {
  drop: {
    group: "atp", title: "Drop shots", caption: "Dropshot Quality", file: "dropshot-quality.png",
    blurb: "How often a player ends points with a drop shot, and how often it works.",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Each point is a player. Tap one.",
    x: "freq", y: "win", size: "won_per_100", yDigits: 0,
    xLabel: "Drop shots per 100 points →", yLabel: "Drop-shot points won",
    defLede: "A drop shot here is the Match Charting Project shot type Dr. The count is points that ended on that shot, not every drop hit during a rally.",
    defs: [
      ["Horizontal axis", "Drop-shot points / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
      ["Vertical axis", "Of those drop-shot points, the share that the player won. Won means a drop-shot winner or a forced error induced by the drop. Unforced errors on the drop count against this rate."],
      ["Point size", "Drop-shot points won / all charted points, then × 100. Carlos Alcaraz is the largest point in this group."],
    ],
    always: ["Novak Djokovic", "Rafael Nadal", "Roger Federer"], exact: true,
    meta: (p) => `${p.charts} charted matches · ${p.drop_n} drop-shot points · ${n(p.freq, 2)} per 100 points · ${n(p.win, 1)}% won · ${n(p.won_per_100, 2)} won per 100 points`,
  },
  fh: {
    group: "atp", title: "Forehands", caption: "Forehand Quality", file: "forehand-quality.png",
    blurb: "Published forehand speed against the points the forehand wins.",
    lede: "Drive forehands from men's charting, 40+ matches. Speed is a published average, not Match Charting. Current players use TennisViz 52-week ATP (slams out). Famous names without that series use GIG Australian Open Hawk-Eye. Tap a player.",
    x: "speed", y: "point_win", size: "winner_pct",
    xLabel: "Forehand speed, mph →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. Speed is joined from published tracking. Only players with both a speed and 40 charted matches appear.",
    defs: [
      ["Horizontal axis", "Average forehand speed in mph. Current: TennisViz 52-week means at ATP events, Grand Slams excluded, as published. Historical: GIG Hawk-Eye from Australian Open 2012–16, one source so Federer, Nadal, Djokovic, and Murray sit on the same scale. Faster is farther right."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / drive-forehand shots, then × 100. The largest point is the highest winner rate in this group."],
    ],
    always: FH_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · ${n(p.speed, 1)} mph · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${p.speed_source === "current" ? "TennisViz 52-week" : "GIG AO Hawk-Eye"}`,
  },
  fhpts: {
    group: "atp", title: "Forehand points", caption: "Forehand Points", file: "forehand-points.png",
    blurb: "Forehand winner rate against the share of forehand points won.",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. No speed here — only drive-forehand results. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Forehand winner % →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. This chart uses only the charts, not published tracking speeds.",
    defs: [
      ["Horizontal axis", "Drive-forehand winners / drive-forehand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: FH_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  bh: {
    group: "atp", title: "Backhand quality", caption: "Backhand Quality", file: "backhand-quality.png",
    blurb: "The same two questions asked of the drive backhand.",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Drive backhands only — no slice, no published speed. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Backhand winner % →", yLabel: "Points won on the drive backhand",
    defLede: "A drive backhand here is Match Charting Project shot type B, not slice. Same three numbers as the forehand-points chart. Ivo Karlovic is left off this chart.",
    defs: [
      ["Horizontal axis", "Drive-backhand winners / drive-backhand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-backhand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-backhand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive backhands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  serve: {
    group: "atp", title: "Serve quality", caption: "Serve Quality", file: "serve-quality.png",
    blurb: "Free points off the serve against second-serve points won.",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Each point is a player. Tap one.",
    x: "free_pct", y: "second_won", size: "serve_won",
    xLabel: "Aces + unreturned % →", yLabel: "Second-serve points won",
    defLede: "Free points come from Match Charting Project ServeBasics: aces plus unreturned serves. Second-serve points won uses the match overview: serve points minus first serves in.",
    defs: [
      ["Horizontal axis", "(Aces + unreturned serves) / serve points, then × 100. An unreturned serve is one the returner never put in play, not counting aces. Together these are free points."],
      ["Vertical axis", "Points won on the second serve / second-serve attempts, then × 100. Attempts are serve points minus first serves in. Double faults count against this rate."],
      ["Point size", "Serve points won / serve points, then × 100. This is holding the serve point, not first-serve in."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · aces+unreturned ${n(p.free_pct, 1)}% · second serve ${n(p.second_won, 1)}% · points won ${n(p.serve_won, 1)}%`,
  },
  first: {
    group: "atp", title: "First serve", caption: "First Serve", file: "first-serve.png",
    blurb: "Landing the first serve against winning behind it.",
    lede: "Men's charting, all recorded matches. A player needs at least 40 charted matches. Dots are the same size. Tap one.",
    x: "first_won_pct", y: "first_in_pct",
    xLabel: "1st-serve points won →", yLabel: "1st serves in",
    defLede: "Both numbers are from the Match Charting Project match overview.",
    defs: [
      ["Horizontal axis", "Points won on the first serve / first serves in, then × 100. The first serve has to land in before this counts. This is not how often the first serve lands in."],
      ["Vertical axis", "First serves in / serve points, then × 100. A double fault is a serve point that never became a first serve in."],
    ],
    always: MEN,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · won ${n(p.first_won_pct, 1)}% when the first serve landed · first serve in ${n(p.first_in_pct, 1)}%`,
  },
  wtaFh: {
    group: "wta", title: "WTA forehand points", caption: "WTA Forehand Points", file: "wta-forehand-points.png",
    blurb: "Forehand winner rate against forehand points won, for the women's tour.",
    lede: "Drive forehands only — no slice, no published speed. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Forehand winner % →", yLabel: "Points won on the drive forehand",
    defLede: "A drive forehand here is Match Charting Project shot type F, not slice. Same three numbers as the men's forehand-points chart.",
    defs: [
      ["Horizontal axis", "Drive-forehand winners / drive-forehand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-forehand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-forehand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive forehands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  wtaBh: {
    group: "wta", title: "WTA backhand quality", caption: "WTA Backhand Quality", file: "wta-backhand-quality.png",
    blurb: "The drive backhand on the women's tour.",
    lede: "Drive backhands only, no slice. Each point is a player. Tap one.",
    x: "winner_pct", y: "point_win", size: "winners_per_100",
    xLabel: "Backhand winner % →", yLabel: "Points won on the drive backhand",
    defLede: "A drive backhand here is Match Charting Project shot type B, not slice. Same three numbers as the men's backhand chart.",
    defs: [
      ["Horizontal axis", "Drive-backhand winners / drive-backhand shots, then × 100. A winner is a ball the opponent never got a racket on."],
      ["Vertical axis", "Of those drive-backhand shots, the share that sat in a point the player won. This is not winner rate; a rally you eventually win still counts."],
      ["Point size", "Drive-backhand winners / all charted points, then × 100. Charted points are serve points plus return points from the match overview."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.shots} drive backhands · winner ${n(p.winner_pct, 1)}% · won the point ${n(p.point_win, 1)}% · ${n(p.winners_per_100, 2)} winners per 100 points`,
  },
  wtaSv: {
    group: "wta", title: "WTA serve quality", caption: "WTA Serve Quality", file: "wta-serve-quality.png",
    blurb: "Free points off the serve against second-serve points won.",
    lede: "Aces plus unreturned serves, against second-serve points won. Each point is a player. Tap one.",
    x: "free_pct", y: "second_won", size: "serve_won",
    xLabel: "Aces + unreturned % →", yLabel: "Second-serve points won",
    defLede: "Free points come from Match Charting Project ServeBasics: aces plus unreturned serves. Second-serve points won uses the match overview: serve points minus first serves in.",
    defs: [
      ["Horizontal axis", "(Aces + unreturned serves) / serve points, then × 100. An unreturned serve is one the returner never put in play, not counting aces. Together these are free points."],
      ["Vertical axis", "Points won on the second serve / second-serve attempts, then × 100. Attempts are serve points minus first serves in. Double faults count against this rate."],
      ["Point size", "Serve points won / serve points, then × 100. This is holding the serve point, not first-serve in."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · aces+unreturned ${n(p.free_pct, 1)}% · second serve ${n(p.second_won, 1)}% · points won ${n(p.serve_won, 1)}%`,
  },
  wtaFs: {
    group: "wta", title: "WTA first serve", caption: "WTA First Serve", file: "wta-first-serve.png",
    blurb: "Landing the first serve against winning behind it.",
    lede: "Same two numbers as the men's first-serve chart. Dots are the same size. Tap one.",
    x: "first_won_pct", y: "first_in_pct",
    xLabel: "1st-serve points won →", yLabel: "1st serves in",
    defLede: "Both numbers are from the Match Charting Project match overview.",
    defs: [
      ["Horizontal axis", "Points won on the first serve / first serves in, then × 100. The first serve has to land in before this counts. This is not how often the first serve lands in."],
      ["Vertical axis", "First serves in / serve points, then × 100. A double fault is a serve point that never became a first serve in."],
    ],
    always: WTA_ALWAYS,
    meta: (p) => `${p.charts} charted matches · ${p.serve_pts} serve points · won ${n(p.first_won_pct, 1)}% when the first serve landed · first serve in ${n(p.first_in_pct, 1)}%`,
  },
};

export const WTA_LEDE = "Active: current rank 50 or better, a match since 2025, and at least 20 charted matches. Plus anyone with 3 or more Grand Slam singles titles who has a charted match since October 2016. Na Li is included. The numbers use all of their charted matches.";

export function pickIndex(id, players) {
  if (id === "fh") {
    const al = players.findIndex((p) => /alcaraz/i.test(p.name));
    const fed = players.findIndex((p) => /federer/i.test(p.name));
    return al >= 0 ? al : (fed >= 0 ? fed : 0);
  }
  const pattern = id.startsWith("wta") ? /swiatek/i : /alcaraz/i;
  const found = players.findIndex((p) => pattern.test(p.name));
  return found >= 0 ? found : 0;
}
