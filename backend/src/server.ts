import http from "http";
import { env } from "./config/env";
import { app } from "./app";
import { initWs } from "./realtime/wsServer";

const server = http.createServer(app);
initWs(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Van tracker backend listening on http://localhost:${env.PORT}`);
});

process.on("SIGINT", () => server.close());
process.on("SIGTERM", () => server.close());

