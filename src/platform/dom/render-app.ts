export function renderReadyStatus(
  document: Document,
  mount: HTMLElement,
  message: string,
): void {
  const status = document.createElement("p");
  status.className = "app-status";
  status.dataset.bootstrapStatus = "ready";
  status.setAttribute("role", "status");
  status.textContent = message;
  mount.replaceChildren(status);
}

interface BootstrapErrorCopy {
  readonly title: string;
  readonly body: string;
}

export function renderBootstrapError(
  document: Document,
  copy: BootstrapErrorCopy,
): void {
  const alert = document.createElement("section");
  const title = document.createElement("h2");
  const body = document.createElement("p");

  alert.className = "bootstrap-error";
  alert.id = "bootstrap-error";
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-labelledby", "bootstrap-error-title");
  alert.tabIndex = -1;

  title.id = "bootstrap-error-title";
  title.textContent = copy.title;
  body.textContent = copy.body;
  alert.append(title, body);

  const host = document.querySelector("main") ?? document.body;
  host.append(alert);
  alert.focus();
}
