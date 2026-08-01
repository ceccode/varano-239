export type AnalyticsEvent =
  { readonly name: "page_view" } | { readonly name: "game_start" };

export interface AnalyticsPort {
  track(event: AnalyticsEvent): void;
}
