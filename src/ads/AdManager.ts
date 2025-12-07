export type AdPosition = "top" | "bottom";

export function showBannerAd(_position: AdPosition = "bottom") {
  // Placeholder – integrate AdMob or another SDK later.
  // Keeping this file so imports won’t break when we add ads.
  console.log("showBannerAd called");
}

export function hideBannerAd() {
  console.log("hideBannerAd called");
}
