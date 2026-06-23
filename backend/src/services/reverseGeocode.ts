type ReverseGeocodeResult = {
  displayName: string;
  areaName: string;
};

function pickAreaName(address: Record<string, string | undefined>): string {
  return (
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.town ||
    address.village ||
    address.city ||
    "Unknown area"
  );
}

export async function reverseGeocodeArea(lat: number, lon: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        // Required by Nominatim usage policy.
        "User-Agent": "van-tracker-mvp/1.0",
      },
    });

    if (!response.ok) return null;
    const json = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };

    const displayName = json.display_name ?? "Unknown location";
    const areaName = pickAreaName(json.address ?? {});
    return { displayName, areaName };
  } catch {
    return null;
  }
}

