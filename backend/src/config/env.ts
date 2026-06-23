import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "8h",
  PROXIMITY_RADIUS_METERS: Number(process.env.PROXIMITY_RADIUS_METERS ?? "200"),
  TELEMETRY_TTL_SECONDS: Number(process.env.TELEMETRY_TTL_SECONDS ?? "120"),
  PORT: Number(process.env.PORT ?? "4000"),
};

