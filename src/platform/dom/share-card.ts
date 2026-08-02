/**
 * Shares the score card, degrading gracefully:
 * Web Share with the image → image download → text in the clipboard → nothing.
 */

export type ShareOutcome =
  "shared" | "downloaded" | "copied" | "cancelled" | "unavailable";

export interface ShareCardRequest {
  readonly canvas: HTMLCanvasElement;
  readonly text: string;
  readonly fileName: string;
}

/** Web Share is optional at runtime even where the DOM types declare it. */
type ShareCapableNavigator = Omit<Navigator, "canShare" | "share"> & {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

type ShareView = Window & typeof globalThis;

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(undefined);
      return;
    }
    try {
      canvas.toBlob((blob) => {
        resolve(blob ?? undefined);
      }, "image/png");
    } catch {
      resolve(undefined);
    }
  });
}

function wasCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function shareFile(
  navigator: ShareCapableNavigator,
  file: File,
  text: string,
): Promise<ShareOutcome | undefined> {
  const payload: ShareData = { files: [file], text };
  if (navigator.share === undefined || navigator.canShare?.(payload) !== true) {
    return undefined;
  }
  try {
    await navigator.share(payload);
    return "shared";
  } catch (error) {
    return wasCancelled(error) ? "cancelled" : undefined;
  }
}

function downloadBlob(
  view: ShareView,
  blob: Blob,
  fileName: string,
): ShareOutcome | undefined {
  let url: string;
  try {
    url = view.URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
  const link = view.document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  view.document.body.append(link);
  link.click();
  link.remove();
  view.setTimeout(() => {
    view.URL.revokeObjectURL(url);
  }, 0);
  return "downloaded";
}

async function copyText(
  navigator: ShareCapableNavigator,
  text: string,
): Promise<ShareOutcome | undefined> {
  // The clipboard is absent in insecure contexts even though the types require it.
  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (typeof clipboard?.writeText !== "function") {
    return undefined;
  }
  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return undefined;
  }
}

export async function shareScoreCard(
  view: ShareView,
  request: ShareCardRequest,
): Promise<ShareOutcome> {
  const navigator = view.navigator as ShareCapableNavigator;
  const blob = await toPngBlob(request.canvas);

  if (blob !== undefined && typeof view.File === "function") {
    const file = new view.File([blob], request.fileName, {
      type: "image/png",
    });
    const shared = await shareFile(navigator, file, request.text);
    if (shared !== undefined) {
      return shared;
    }
  }

  if (blob !== undefined) {
    const downloaded = downloadBlob(view, blob, request.fileName);
    if (downloaded !== undefined) {
      return downloaded;
    }
  }

  return (await copyText(navigator, request.text)) ?? "unavailable";
}
