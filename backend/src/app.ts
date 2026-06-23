import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { vansRouter } from "./routes/vans";
import { telemetryRouter } from "./routes/telemetry";
import { stopsPlacesRouter } from "./routes/stopsPlaces";
import { tripsRouter } from "./routes/trips";
import { childEventsRouter } from "./routes/childEvents";
import { childrenRouter } from "./routes/children";
import { managementRouter } from "./routes/management";
import { smartRoutesRouter } from "./routes/smartRoutes";
import { camerasRouter } from "./routes/cameras";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/vans", vansRouter);
app.use("/api", telemetryRouter);
app.use("/api/stops-places", stopsPlacesRouter);
app.use("/api/trips", tripsRouter);
app.use("/api", childEventsRouter);
app.use("/api", childrenRouter);
app.use("/api", managementRouter);
app.use("/api", smartRoutesRouter);
app.use("/api", camerasRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ error: "The server could not complete this request. Please try again." });
});

// Basic 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
