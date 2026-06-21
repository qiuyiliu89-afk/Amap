import { createMockContentPackage as createScenarioContentPackage } from "../../data/mockContentPackage";
import type { CampaignBrief, ContentPackage } from "../../types/campaign";

export function createMockContentPackage(brief: CampaignBrief): ContentPackage {
  return createScenarioContentPackage(
    [
      brief.rawBrief,
      brief.feature,
      brief.campaignTheme,
      brief.contentGoal,
      brief.audience,
      brief.market,
      brief.tone,
    ].join("\n"),
    brief.platforms,
  );
}

