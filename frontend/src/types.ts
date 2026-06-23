export type ServicePeriod = "MORNING" | "AFTERNOON" | "EVENING";

export type Assignment = { id?: string; period: ServicePeriod; vanId: string; van?: { name: string } };

export type Child = {
  id: string; firstName: string; lastName: string; className?: string | null;
  parentPhone?: string | null; residenceRoute?: string | null; photoData?: string | null;
  notes?: string | null; assignments: Assignment[];
};

export type VanChild = Pick<Child, "id" | "firstName" | "lastName" | "className" | "residenceRoute" | "photoData">;

export type Van = {
  id: string; name: string; plateNumber?: string | null; photoData?: string | null; driverName?: string | null;
  driverPhone?: string | null; capacity: number; routeName?: string | null;
  morningDeparture?: string | null; afternoonDeparture?: string | null; eveningDeparture?: string | null;
  assignments: Array<{ period: ServicePeriod; child: VanChild }>;
};

export type StopPlace = { id: string; name: string; lat: number; lon: number; createdAt: string };
export type TripEvent = {
  id: string;
  eventType: "PICKUP" | "DROP_OFF" | "ABSENT" | "PRESENT";
  occurredAt: string;
  notes?: string | null;
  child: VanChild;
};
export type Trip = {
  id: string; vanId: string; routeName?: string | null; startTime: string; endTime?: string | null;
  van?: { name: string; plateNumber?: string | null; routeName?: string | null };
  telemetryPoints?: TrackPoint[];
  childEvents?: TripEvent[];
  summary?: { distanceMeters: number; distanceKm: number; childEventsCount: number };
};
export type TrackPoint = { id: string; lat: number; lon: number; timestamp: string };
export type HistoryRecord = { childId: string; childName: string; firstName?: string | null; lastName?: string | null; className?: string | null; residenceRoute?: string | null; parentPhone?: string | null; photoData?: string | null; vanId: string; vanName: string; period: ServicePeriod; periods?: ServicePeriod[]; pickupTime?: string | null; dropoffTime?: string | null; presentTime?: string | null; absentTime?: string | null; status: "NOT_RECORDED" | "PRESENT" | "PICKED_UP" | "DROPPED_OFF" | "ABSENT"; notes?: string | null };
export type DriverAccount = { id: string; email: string; fullName?: string | null; phone?: string | null; assignedVanId?: string | null; assignedVan?: { name: string } | null; createdAt: string };
export type SchoolSettings = { id: string; name: string; phone?: string | null; address?: string | null; contactEmail?: string | null; schoolStartTime?: string | null; pickupGraceMinutes: number };
export type SmartStop = { assignmentId: string; order: number; id: string; firstName: string; lastName: string; className?: string | null; residenceRoute?: string | null; photoData?: string | null; stopLabel?: string | null; homeLat?: number | null; homeLon?: number | null; parentPhone?: string | null; completedAt?: string | null; attendanceStatus?: "PRESENT" | "ABSENT" | null };
export type SmartRoute = { period: ServicePeriod; eventType: "PICKUP" | "DROP_OFF"; livePosition?: { lat: number; lon: number; timestamp: string } | null; stops: SmartStop[]; currentIndex: number; completedCount: number };
export type VanCamera = { id: string; vanId: string; name: string; position: "INSIDE" | "OUTSIDE" | "FRONT" | "REAR"; streamType: "HLS" | "MJPEG" | "WEBPAGE"; streamUrl: string; enabled: boolean; createdAt: string };
export type AuthUser = { id: string; email: string; role: "ADMIN" | "STAFF" | "DRIVER"; fullName?: string | null; phone?: string | null; assignedVanId?: string | null; assignedVan?: { id: string; name: string; plateNumber?: string | null; routeName?: string | null } | null };
