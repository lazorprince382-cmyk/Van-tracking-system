import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Popup, useMap } from "react-leaflet";
import { LatLngBoundsExpression, LatLngExpression, Icon, divIcon } from "leaflet";
import { SmartStop, TrackPoint } from "../types";

const markerIcon = new Icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

function MapUpdater({ points, stops, vanOnly }: { points: TrackPoint[]; stops: SmartStop[]; vanOnly: boolean }) {
  const map = useMap();
  useEffect(() => {
    const latest = points[points.length - 1];
    if (vanOnly && latest) { map.setView([latest.lat, latest.lon], 19, { animate: true }); return; }
    const positions = [...points.map((p) => [p.lat, p.lon] as [number, number]), ...stops.filter((s) => s.homeLat != null && s.homeLon != null).map((s) => [s.homeLat!, s.homeLon!] as [number, number])];
    if (positions.length === 1) map.setView(positions[0], 19);
    else if (positions.length > 1) map.fitBounds(positions as LatLngBoundsExpression, { padding: [35, 35], maxZoom: 18 });
  }, [map, points.length, stops, vanOnly]);
  return null;
}

export function LiveMap({ points, stops = [], activeStopId, vanOnly = false }: { points: TrackPoint[]; stops?: SmartStop[]; activeStopId?: string; vanOnly?: boolean }) {
  const [detailedVanView, setDetailedVanView] = useState(vanOnly);
  const latest = points[points.length - 1];
  const gpsFresh = latest ? Date.now() - new Date(latest.timestamp).getTime() < 10 * 60 * 1000 : false;
  const firstSavedStop = stops.find((stop) => stop.homeLat != null && stop.homeLon != null);
  const center: LatLngExpression = latest ? [latest.lat, latest.lon] : firstSavedStop ? [firstSavedStop.homeLat!, firstSavedStop.homeLon!] : [0.3476, 32.5825];
  const polyline = points.map((point) => [point.lat, point.lon] as LatLngExpression);
  return <div className="live-map-composite"><MapContainer center={center} zoom={detailedVanView ? 19 : 16} maxZoom={20} style={{ height: 380, width: "100%" }}>
    <TileLayer maxZoom={20} maxNativeZoom={19} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <MapUpdater points={points} stops={detailedVanView ? [] : stops} vanOnly={detailedVanView} />
    {!detailedVanView && polyline.length > 1 && <Polyline positions={polyline} pathOptions={{ color: "#145c4c", weight: 5 }} />}
    {!detailedVanView && stops.filter((stop) => stop.homeLat != null && stop.homeLon != null).map((stop) => <Marker key={stop.id} position={[stop.homeLat!, stop.homeLon!]} icon={divIcon({ className: "", html: `<div class="route-map-stop ${stop.completedAt ? "done" : stop.id === activeStopId ? "active" : ""}">${stop.completedAt ? "✓" : stop.order}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })}><Popup><b>{stop.firstName} {stop.lastName}</b><br />{stop.stopLabel || stop.residenceRoute || "Saved child stop"}</Popup></Marker>)}
    {latest && <Marker icon={markerIcon} position={[latest.lat, latest.lon]}><Popup>Live van position<br />{new Date(latest.timestamp).toLocaleTimeString()}</Popup></Marker>}
  </MapContainer><div className="map-location-strip"><div className={`map-live-dot ${latest && !gpsFresh ? "stale" : ""}`}></div><div><small>{gpsFresh ? "VAN LOCATION NOW" : latest ? "LAST REPORTED LOCATION — GPS STALE" : "VAN LOCATION"}</small>{latest ? <><strong>{latest.lat.toFixed(6)}, {latest.lon.toFixed(6)}</strong><span>Last GPS update: {new Date(latest.timestamp).toLocaleString()}</span></> : <><strong>No GPS received today</strong><span>Press “Update live GPS” to show the van’s correct location.</span></>}</div><div className="map-view-switch"><button className={detailedVanView ? "active" : ""} disabled={!latest} onClick={() => setDetailedVanView(true)}>⌖ Detailed van view</button><button className={!detailedVanView ? "active" : ""} onClick={() => setDetailedVanView(false)}>▦ Full route view</button></div></div></div>;
}
