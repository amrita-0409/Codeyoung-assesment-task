import { getBrowserTimezone, getTimezoneAbbrev } from './utils';

export interface GeoTimezone {
  timezone: string;
  abbreviation: string;
  city: string;
  region: string;
  lat: number | null;
  lng: number | null;
  source: 'google' | 'gps' | 'browser';
}

export interface PreferredArea {
  id: string;
  label: string;
  timezone: string;
  lat: number;
  lng: number;
}

export const PREFERRED_AREAS: PreferredArea[] = [
  { id: 'nyc', label: 'New York, USA', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
  { id: 'la', label: 'Los Angeles, USA', timezone: 'America/Los_Angeles', lat: 34.0522, lng: -118.2437 },
  { id: 'chicago', label: 'Chicago, USA', timezone: 'America/Chicago', lat: 41.8781, lng: -87.6298 },
  { id: 'london', label: 'London, UK', timezone: 'Europe/London', lat: 51.5074, lng: -0.1278 },
  { id: 'dubai', label: 'Dubai, UAE', timezone: 'Asia/Dubai', lat: 25.2048, lng: 55.2708 },
  { id: 'mumbai', label: 'Mumbai, India', timezone: 'Asia/Kolkata', lat: 19.076, lng: 72.8777 },
  { id: 'bengaluru', label: 'Bengaluru, India', timezone: 'Asia/Kolkata', lat: 12.9716, lng: 77.5946 },
  { id: 'delhi', label: 'Delhi, India', timezone: 'Asia/Kolkata', lat: 28.6139, lng: 77.209 },
  { id: 'singapore', label: 'Singapore', timezone: 'Asia/Singapore', lat: 1.3521, lng: 103.8198 },
  { id: 'sydney', label: 'Sydney, Australia', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
];

declare global {
  interface Window {
    google?: {
      maps: {
        Geocoder: new () => {
          geocode: (
            req: { location: { lat: number; lng: number } },
            cb: (results: Array<{ formatted_address?: string; address_components?: Array<{ long_name: string; types: string[] }> }> | null, status: string) => void
          ) => void;
        };
      };
    };
  }
}

export function mapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';
}

export function mapsEmbedUrl(lat: number, lng: number): string {
  const key = mapsApiKey();
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat},${lng}&zoom=12`;
  }
  return `https://maps.google.com/maps?q=${lat},${lng}&z=12&output=embed`;
}

export function mapsExternalUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function formatNowInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(new Date());
  } catch {
    return '';
  }
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

export function nearestPreferredArea(lat: number, lng: number): PreferredArea {
  return PREFERRED_AREAS.reduce((best, area) => {
    const d = haversineKm(lat, lng, area.lat, area.lng);
    const bd = haversineKm(lat, lng, best.lat, best.lng);
    return d < bd ? area : best;
  });
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>('script[data-codeyoung-gmaps]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.dataset.codeyoungGmaps = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}

async function reverseGeocodeGoogle(lat: number, lng: number): Promise<{ city: string; region: string } | null> {
  const key = mapsApiKey();
  if (!key) return null;
  try {
    await loadGoogleMapsScript(key);
    if (!window.google?.maps) return null;
    const geocoder = new window.google.maps.Geocoder();
    return await new Promise((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== 'OK' || !results?.[0]) {
          resolve(null);
          return;
        }
        const comps = results[0].address_components || [];
        const pick = (...types: string[]) =>
          comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name;
        const city = pick('locality', 'sublocality', 'administrative_area_level_2') || 'Your location';
        const region = pick('administrative_area_level_1', 'country') || '';
        resolve({ city, region });
      });
    });
  } catch {
    return null;
  }
}

async function timezoneFromGoogle(lat: number, lng: number): Promise<string | null> {
  const key = mapsApiKey();
  if (!key) return null;
  try {
    const ts = Math.floor(Date.now() / 1000);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${ts}&key=${encodeURIComponent(key)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; timeZoneId?: string };
    if (data.status === 'OK' && data.timeZoneId) return data.timeZoneId;
  } catch {
    return null;
  }
  return null;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  });
}

export async function detectParentLocation(): Promise<GeoTimezone> {
  const browserTz = getBrowserTimezone();
  try {
    const pos = await getCurrentPosition();
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const googleTz = await timezoneFromGoogle(lat, lng);
    const geo = await reverseGeocodeGoogle(lat, lng);
    const nearest = nearestPreferredArea(lat, lng);
    const timezone = googleTz || browserTz;
    const city = geo?.city || nearest.label.split(',')[0];
    const region = geo?.region || nearest.label.split(',')[1]?.trim() || '';
    return {
      timezone,
      abbreviation: getTimezoneAbbrev(timezone),
      city,
      region,
      lat,
      lng,
      source: googleTz ? 'google' : 'gps',
    };
  } catch {
    const nearest = PREFERRED_AREAS.find((a) => a.timezone === browserTz);
    return {
      timezone: browserTz,
      abbreviation: getTimezoneAbbrev(browserTz),
      city: nearest?.label.split(',')[0] || 'Local',
      region: nearest?.label.split(',')[1]?.trim() || browserTz.replace(/_/g, ' '),
      lat: nearest?.lat ?? null,
      lng: nearest?.lng ?? null,
      source: 'browser',
    };
  }
}
