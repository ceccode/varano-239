import type { AnalyticsEvent, AnalyticsPort } from "../../core/ports";

export class NoopAnalytics implements AnalyticsPort {
  track(event: AnalyticsEvent): void {
    void event;
  }
}
