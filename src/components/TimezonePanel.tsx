import { useEffect, useRef, useState } from 'react';
import { Globe, MapPin, LocateFixed, Clock, ExternalLink } from 'lucide-react';
import {
  PREFERRED_AREAS,
  detectParentLocation,
  formatNowInTimezone,
  mapsEmbedUrl,
  mapsExternalUrl,
  type GeoTimezone,
  type PreferredArea,
} from '@/lib/location';
import { getTimezoneAbbrev } from '@/lib/utils';

interface TimezonePanelProps {
  viewingTz: string;
  onTimezoneChange: (tz: string) => void;
}

export default function TimezonePanel({ viewingTz, onTimezoneChange }: TimezonePanelProps) {
  const [location, setLocation] = useState<GeoTimezone | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(0);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const pickedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    detectParentLocation().then((loc) => {
      if (cancelled) return;
      setLocation(loc);
      setLoading(false);
      if (!pickedRef.current) onTimezoneChange(loc.timezone);
    });
    return () => {
      cancelled = true;
    };
    // Detect once on mount; parent callback is stable enough for this panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickArea(area: PreferredArea) {
    pickedRef.current = true;
    setSelectedArea(area.id);
    onTimezoneChange(area.timezone);
  }

  function pickCurrent() {
    if (!location) return;
    pickedRef.current = true;
    setSelectedArea(null);
    onTimezoneChange(location.timezone);
  }

  const currentActive = !selectedArea && location?.timezone === viewingTz;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <LocateFixed className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Your current location</h3>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">Google Maps</span>
          </div>

          {loading || !location ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-8 w-56 rounded bg-slate-100" />
            </div>
          ) : (
            <button
              type="button"
              onClick={pickCurrent}
              className={`w-full rounded-xl border p-4 text-left transition ${
                currentActive
                  ? 'border-teal-400 bg-teal-50/70 ring-2 ring-teal-400/30'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-200'
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-teal-600" />
                {location.city}{location.region ? `, ${location.region}` : ''}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {location.timezone} · {location.abbreviation}
              </p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-lg font-bold text-slate-900">
                <Clock className="h-4 w-4 text-slate-400" />
                <span key={nowTick}>{formatNowInTimezone(location.timezone)}</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {location.source === 'google'
                  ? 'Timezone resolved with Google Maps Time Zone API'
                  : location.source === 'gps'
                  ? 'Location from GPS · timezone matched to your area'
                  : 'Using your browser timezone (enable location for a live map pin)'}
              </p>
            </button>
          )}

          {location?.lat != null && location.lng != null && (
            <a
              href={mapsExternalUrl(location.lat, location.lng)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
            >
              Open in Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {location?.lat != null && location.lng != null ? (
          <div className="min-h-[180px] border-t border-slate-100 lg:border-l lg:border-t-0">
            <iframe
              title="Parent current location on Google Maps"
              src={mapsEmbedUrl(location.lat, location.lng)}
              className="h-full min-h-[180px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center border-t border-slate-100 bg-slate-50 text-xs text-slate-400 lg:border-l lg:border-t-0">
            Allow location access to pin your area on Google Maps
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-900">Preferred area timezones</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Compare your local time with Codeyoung’s most-booked regions. Click one to view class slots in that timezone.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {PREFERRED_AREAS.map((area) => {
            const active = selectedArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => pickArea(area)}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400/20'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                }`}
              >
                <p className="truncate text-xs font-semibold text-slate-800">{area.label}</p>
                <p className="truncate text-[10px] text-slate-400">{area.timezone} · {getTimezoneAbbrev(area.timezone)}</p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">{formatNowInTimezone(area.timezone)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
