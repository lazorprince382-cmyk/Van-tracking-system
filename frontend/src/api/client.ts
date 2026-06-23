const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export function setToken(token: string) {
  localStorage.setItem("vt_token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("vt_token");
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error("The Ocean Ride server is offline. Please start Van Tracker and try again.");
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/api/auth/login") {
    localStorage.removeItem("vt_token");
    window.dispatchEvent(new CustomEvent("van-tracker-session-expired"));
  }
  if (!response.ok) throw new Error(body.error ?? `Request failed: ${response.status}`);
  return body as T;
}

export const api = {
  login(email: string, password: string) {
    return req<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return req<{ user: import("../types").AuthUser }>("/api/auth/me");
  },
  updateProfile(data: { fullName: string; email: string; phone: string }) {
    return req<{ user: import("../types").AuthUser }>("/api/auth/me", { method: "PATCH", body: JSON.stringify(data) });
  },
  changePassword(currentPassword: string, newPassword: string) {
    return req<{ ok: boolean }>("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  },
  vans() {
    return req<{ vans: import("../types").Van[] }>("/api/vans");
  },
  createVan(data: Record<string, unknown>) {
    return req("/api/vans", { method: "POST", body: JSON.stringify(data) });
  },
  updateVan(vanId: string, data: Record<string, unknown>) {
    return req(`/api/vans/${vanId}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteVan(vanId: string) {
    return req(`/api/vans/${vanId}`, { method: "DELETE" });
  },
  vanTrack(vanId: string, from?: string) {
    const query = from ? `?from=${encodeURIComponent(from)}` : "";
    return req<{ points: Array<{ id: string; lat: number; lon: number; timestamp: string }> }>(
      `/api/vans/${vanId}/track${query}`
    );
  },
  sendManualLocation(vanId: string, lat: number, lon: number) {
    return req<{ ok: boolean; pointId: string; areaName: string | null; displayName: string | null }>(
      `/api/vans/${vanId}/manual-location`,
      {
        method: "POST",
        body: JSON.stringify({ lat, lon }),
      }
    );
  },
  stops() {
    return req<{ stops: Array<{ id: string; name: string; lat: number; lon: number; createdAt: string }> }>(
      "/api/stops-places"
    );
  },
  createStop(name: string, lat: number, lon: number) {
    return req("/api/stops-places", {
      method: "POST",
      body: JSON.stringify({ name, lat, lon }),
    });
  },
  trips() {
    return req<{ trips: Array<{ id: string; vanId: string; routeName?: string | null; startTime: string }> }>(
      "/api/trips"
    );
  },
  createTrip(vanId: string, routeName?: string) {
    return req<{ trip: { id: string } }>("/api/trips", {
      method: "POST",
      body: JSON.stringify({ vanId, routeName }),
    });
  },
  children() {
    return req<{ children: import("../types").Child[] }>("/api/children");
  },
  createChild(data: Record<string, unknown>) {
    return req("/api/children", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateChild(childId: string, data: Record<string, unknown>) {
    return req(`/api/children/${childId}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteChild(childId: string) {
    return req(`/api/children/${childId}`, { method: "DELETE" });
  },
  registerChildEvent(tripId: string, childId: string, eventType: "PICKUP" | "DROP_OFF") {
    return req(`/api/trips/${tripId}/child-events`, {
      method: "POST",
      body: JSON.stringify({ childId, eventType }),
    });
  },
  tripSummary(tripId: string) {
    return req<{ summary: { distanceMeters: number; distanceKm: number; childEventsCount: number } }>(
      `/api/trips/${tripId}/summary`
    );
  },
  history(date: string, vanId?: string) {
    const query = new URLSearchParams({ date });
    if (vanId) query.set("vanId", vanId);
    return req<{ date: string; records: import("../types").HistoryRecord[] }>(`/api/history?${query}`);
  },
  recordAttendance(childId: string, vanId: string, eventType: "PICKUP" | "DROP_OFF" | "ABSENT" | "PRESENT", period?: import("../types").ServicePeriod) {
    return req("/api/history/events", { method: "POST", body: JSON.stringify({ childId, vanId, eventType, period }) });
  },
  settings() {
    return req<{ organization: import("../types").SchoolSettings; drivers: import("../types").DriverAccount[] }>("/api/settings");
  },
  updateSettings(data: Record<string, unknown>) {
    return req("/api/settings/organization", { method: "PATCH", body: JSON.stringify(data) });
  },
  createDriver(data: Record<string, unknown>) {
    return req("/api/settings/drivers", { method: "POST", body: JSON.stringify(data) });
  },
  deleteDriver(driverId: string) {
    return req(`/api/settings/drivers/${driverId}`, { method: "DELETE" });
  },
  smartRoute(vanId: string, period: import("../types").ServicePeriod) {
    return req<import("../types").SmartRoute>(`/api/smart-routes/${vanId}?period=${period}`);
  },
  saveChildStop(vanId: string, childId: string, stopLabel?: string) {
    return req(`/api/smart-routes/${vanId}/children/${childId}/location`, { method: "POST", body: JSON.stringify({ stopLabel }) });
  },
  completeSmartStop(vanId: string, childId: string, period: import("../types").ServicePeriod, attendanceStatus: "PRESENT" | "ABSENT" = "PRESENT") {
    return req(`/api/smart-routes/${vanId}/complete`, { method: "POST", body: JSON.stringify({ childId, period, attendanceStatus }) });
  },
  reorderSmartStops(vanId: string, period: import("../types").ServicePeriod, childIds: string[]) {
    return req(`/api/smart-routes/${vanId}/order`, { method: "PUT", body: JSON.stringify({ period, childIds }) });
  },
  cameras(vanId: string) {
    return req<{ cameras: import("../types").VanCamera[] }>(`/api/cameras?vanId=${encodeURIComponent(vanId)}`);
  },
  createCamera(data: Record<string, unknown>) {
    return req("/api/cameras", { method: "POST", body: JSON.stringify(data) });
  },
  deleteCamera(cameraId: string) {
    return req(`/api/cameras/${cameraId}`, { method: "DELETE" });
  },
};

export { API_BASE };
