import http from "http";
import { WebSocketServer } from "ws";
import { verifyStaffJwt, JwtStaffPayload } from "../lib/jwt";

let wss: WebSocketServer | null = null;

type VanPositionMessage = {
  type: "van_position";
  vanId: string;
  lat: number;
  lon: number;
  timestamp: string; // ISO
};

function getTokenFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.searchParams.get("token");
  } catch {
    return null;
  }
}

export function initWs(httpServer: http.Server) {
  if (wss) return;

  wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws, req) => {
    const token = getTokenFromUrl(req.url);
    if (!token) {
      ws.close(1008, "Missing token");
      return;
    }

    try {
      const payload: JwtStaffPayload = verifyStaffJwt(token);
      // Attach orgId to ws for potential filtering later.
      (ws as any)._organizationId = payload.organizationId;
    } catch {
      ws.close(1008, "Invalid token");
      return;
    }

    ws.on("message", () => {
      // MVP: ignore messages from client.
    });
  });
}

export function broadcastVanPosition(message: VanPositionMessage) {
  if (!wss) return;
  const serialized = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(serialized);
  }
}

