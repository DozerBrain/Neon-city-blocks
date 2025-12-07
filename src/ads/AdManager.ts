// src/ads/AdManager.ts
// Placeholder for future AdMob / rewarded ads integration

export type RewardType = "revive" | "unlock_theme";

export async function showRewardedAd(kind: RewardType): Promise<boolean> {
  // In the future: show real ad here and resolve(true) if user watched full video.
  console.log("[AdManager] showRewardedAd:", kind);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true; // pretend ad was watched
}
