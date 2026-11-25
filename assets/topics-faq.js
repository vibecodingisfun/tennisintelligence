/** Chart-anchored FAQ copy for /topics/ (visible HTML + FAQPage JSON-LD). */

export const FAQ_BY_CHART = {
  era_winrate_by_age: [{
    id: "faq-era_winrate_by_age-1",
    question: "Why do Big 3 peak years look missing on the win-rate-by-age chart?",
    answer: "This Topics chart only uses main-draw matches from 1 October 2016 onward. Peak Federer, Nadal, and Djokovic seasons before that date sit outside the warehouse window, so the age curves here are not full-career win rates. Walkovers and defaults are dropped; retirements still count as wins or losses. Use the chart for in-window age patterns, not for GOAT arguments that need 2000s data.",
  }],
  era_elo_by_age: [{
    id: "faq-era_elo_by_age-1",
    question: "Is the Elo-by-age chart a career rating or only the site window?",
    answer: "It is the mean pre-match Elo from this site’s match warehouse for the same five ATP players, only on main-draw matches from 1 October 2016. An age bin needs at least five matches before it is plotted. The series is not a Tennis Abstract career Elo curve and is not warmed up as a lifetime rating; treat it as an in-window strength-by-age view.",
  }],
  era_vs_top10: [{
    id: "faq-era_vs_top10-1",
    question: "Who counts as a top-10 opponent on the vs-top-10 chart?",
    answer: "An opponent counts when their pre-match rank is 1 through 10 at that match. The rate is each player’s in-window career win percentage in those matches on the ATP main draw. Walkovers and defaults are excluded so the percentage reflects matches that were played. Ranks outside 1–10 never enter the denominator.",
  }],
  retire_wo_by_season: [{
    id: "faq-retire_wo_by_season-1",
    question: "Are retirements the same as walkovers in the season counts?",
    answer: "No. The chart splits retired, walkover, and defaulted main-draw matches into separate bars for ATP and WTA by calendar season. Those are counts, not rates. Partial seasons such as the late 2016 window open, COVID 2020, and incomplete recent years are flagged so a short calendar is not read as a full-year spike.",
  }],
  top20_load: [{
    id: "faq-top20_load-1",
    question: "Whose matches are summed in the year-end top-20 load chart?",
    answer: "For each tour and season, the chart takes a late-season ranking snapshot: each player’s last main-draw match on or after 1 October, then the positional top 20 by pre-match rank. It then sums those players’ main-draw matches and minutes in that calendar year. ATP and WTA are separate series. Seasons without a usable late-season snapshot are omitted. This is a warehouse proxy, not an official published year-end list.",
  }],
  top10_churn: [{
    id: "faq-top10_churn-1",
    question: "What does “first time in window” mean on the top-10 churn chart?",
    answer: "Distinct top-10 counts every player who held rank 10 or better in a main-draw match during that season. “First time in window” counts the first time that player appears at rank ≤10 on or after 1 October 2016. It is not a claim about career debut into the top 10 before the warehouse window.",
  }],
  top10_points_gap: [{
    id: "faq-top10_points_gap-1",
    question: "Is the #1 vs #10 points gap the official year-end ranking?",
    answer: "No. The gap uses each player’s last main-draw rank and rank points on or after 1 October, then prefers the holders of rank 1 and rank 10. Players who skip November events can still appear if they played in October. That fixes empty November fields, but it is still a match-warehouse proxy, not the ATP or WTA published year-end list. Seasons missing a rank-1 holder or ten late-season qualifiers are skipped.",
  }],
  first_top10_age: [{
    id: "faq-first_top10_age-1",
    question: "Why are some first top-10 ages not career debuts?",
    answer: "The chart records age at the first in-window main-draw match with rank ≤10 on or after 1 October 2016. Players who were already inside the top 10 at that first window match are flagged as left-censored. Their ages are not career debuts into the top 10; the window simply opened while they were already there.",
  }],
  zverev_gs_path: [{
    id: "faq-zverev_gs_path-1",
    question: "Why do early rounds dominate mean opponent rank for Slam champions?",
    answer: "For each men’s Grand Slam champion since 2017, the chart averages the opponent ranks of on-court matches won on the way to the title (final winners only). Early rounds are most of those matches, so they pull the mean. Null opponent ranks are dropped. Alexander Zverev’s titles are highlighted for comparison, still using the same on-court path rule.",
  }],
  slam_champion_diversity: [{
    id: "faq-slam_champion_diversity-1",
    question: "How does the chart count distinct Grand Slam champions in a year?",
    answer: "A champion is the singles winner of a final (`round = F`) in that calendar year. The series counts distinct names for ATP and WTA separately, so four Slams can yield at most four champions per tour. It is a diversity count of title-winners, not a ranking of who was best across the year.",
  }],
  seed_upset_rate: [{
    id: "faq-seed_upset_rate-1",
    question: "What counts as an upset in the seeded-vs-seeded chart?",
    answer: "Both players must have seeds, the match must be completed, and the loser must have been the better seed (lower seed number). Retirements, walkovers, and defaults are out of both numerator and denominator. The rate is upsets divided by seeded-vs-seeded completed matches, shown by tour and round.",
  }],
  pace_heatmap_ace: [{
    id: "faq-pace_heatmap_ace-1",
    question: "Does a high ace-rate cell mean the court was fast?",
    answer: "No. The heatmap shows ace rate at Grand Slams and Masters 1000 by event and season for completed matches with complete serve stats. Ace rate is one pace-related signal, not a full court-speed index. Blank or missing cells are not plotted when the match filter or coverage is insufficient.",
  }],
  pace_heatmap_hold: [{
    id: "faq-pace_heatmap_hold-1",
    question: "Why are some hold-rate heatmap cells blank?",
    answer: "Hold rate uses a stricter match filter (completed stats, service games and break-point fields that pass the site’s hold checks). A cell needs at least 20 matching matches before it is shown. Below that minimum the cell stays blank so a tiny sample is not read as a season pace reading.",
  }],
};

export function collectFaqItems(chartIds) {
  const items = [];
  for (const id of chartIds || []) {
    const rows = FAQ_BY_CHART[id];
    if (!rows) continue;
    for (const row of rows) items.push(row);
  }
  return items;
}

export function faqPageJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (items || []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
