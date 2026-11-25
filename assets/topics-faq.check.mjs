import { FAQ_BY_CHART, collectFaqItems, faqPageJsonLd } from "./topics-faq.js";

const EXPECTED = [
  "era_winrate_by_age", "era_elo_by_age", "era_vs_top10", "retire_wo_by_season",
  "top20_load", "top10_churn", "top10_points_gap", "first_top10_age",
  "zverev_gs_path", "slam_champion_diversity", "seed_upset_rate",
  "pace_heatmap_ace", "pace_heatmap_hold",
];

for (const id of EXPECTED) {
  if (!FAQ_BY_CHART[id]?.length) throw new Error(`missing FAQ for ${id}`);
  for (const item of FAQ_BY_CHART[id]) {
    if (!item.id || !item.question || !item.answer) throw new Error(`incomplete FAQ on ${id}`);
    const words = item.answer.trim().split(/\s+/).length;
    if (words < 30 || words > 180) throw new Error(`${id} answer word count ${words}`);
  }
}
const items = collectFaqItems(EXPECTED);
const ld = faqPageJsonLd(items);
if (ld["@type"] !== "FAQPage") throw new Error("bad @type");
if (ld.mainEntity.length !== items.length) throw new Error("LD length mismatch");
for (let i = 0; i < items.length; i++) {
  if (ld.mainEntity[i].name !== items[i].question) throw new Error("Q mismatch");
  if (ld.mainEntity[i].acceptedAnswer.text !== items[i].answer) throw new Error("A mismatch");
}
console.log(`ok ${items.length} FAQ items`);
