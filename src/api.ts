import { config } from "./config";

export let stopped = false;

export function setStopped(value: boolean): void {
  stopped = value;
}

export async function callApi(
  path: string,
  body: unknown,
): Promise<unknown | null> {
  const url = config.base + path;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(body),
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      stopped = true;
      throw new Error(
        "Connection expired, revoked or unsupported; check account and entry",
      );
    }

    if (response.status === 429 || response.status === 503) {
      const rawRetry = response.headers.get("Retry-After") || "2";
      let seconds = 2;
      const parsedNum = parseFloat(rawRetry);
      if (!isNaN(parsedNum)) {
        seconds = Math.max(2, parsedNum);
      } else {
        const parsedDate = Date.parse(rawRetry);
        if (!isNaN(parsedDate)) {
          seconds = Math.max(2, (parsedDate - Date.now()) / 1000);
        }
      }
      await Bun.sleep(seconds * 1000);
      if (stopped) return null;
      return null;
    }

    if (
      response.status !== 200 &&
      response.status !== 201 &&
      response.status !== 204 &&
      response.status !== 409
    ) {
      throw new Error(`Engine request returned HTTP ${response.status}`);
    }

    if (response.status === 409) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error: unknown) {
    if (stopped) return null;
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error instanceof TypeError)
    ) {
      return null;
    }
    throw error;
  }
}
