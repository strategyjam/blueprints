import { setStopped, stopped } from "./api";
import { cleanup, handleMessage, setupHeartbeat } from "./client";
import { config } from "./config";

async function main(): Promise<void> {
  let backoff = 1;
  const wsUrl = config.base.replace(/^https:/, "wss:") + "/api/engine/ws";

  process.on("SIGINT", () => {
    setStopped(true);
    process.exit(0);
  });

  while (!stopped) {
    const connectedAt = Date.now();
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(wsUrl, { headers: config.headers });

      ws.onopen = () => {
        console.log(
          "Engine connected. Waiting for pushed challenges/positions.",
        );
        setupHeartbeat(ws);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data === "string") {
          void handleMessage(ws, event.data);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        cleanup();
        if ([4001, 4003, 4004].includes(event.code)) {
          setStopped(true);
        }
        resolve();
      };

      ws.onerror = () => {
        if (stopped) {
          ws.close();
          return;
        }
        console.log("Engine stream interrupted; reconnecting with backoff.");
      };
    });

    if (stopped) break;

    if (Date.now() - connectedAt > 60000) {
      backoff = 1;
    }

    const jitter = Math.random() * (backoff / 2);
    const sleepTime = (backoff / 2 + jitter) * 1000;
    await Bun.sleep(sleepTime);
    backoff = Math.min(30, backoff * 2);
  }

  setStopped(true);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
