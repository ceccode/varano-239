import { startApplication } from "./app/bootstrap";
import { NoopAnalytics } from "./platform/analytics/noop-analytics";

startApplication({
  document,
  analytics: new NoopAnalytics(),
});
