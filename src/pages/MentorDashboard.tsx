import { useState, useEffect, useCallback } from 'react';
import {
  Code, Clock, Copy, Check, User, LogOut, Sparkles, Calendar,
  GraduationCap, Star, Activity, X, ChevronLeft, ChevronRight,
  Users, Zap
} from 'lucide-react';
import type { AuthSession, Booking } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  dateToISODate, getMentorLoadForDate, MENTOR_DAILY_CAPACITY,
  getSubjectIcon, copyToClipboard, getTimezoneAbbrev
} from '@/lib/utils';

interface MentorDashboardProps {
  session: AuthSession;
  onLogout: () => void;
  onOpenAI: () => void;
}

export default function MentorDashboard({ session, onLogout, onOpenAI }: MentorDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [istTime, setIstTime] = useState(new Date());
  const [toast, setToast] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mentor = session.mentor;

  useEffect(() => {
    const timer = setInterval(() => setIstTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    if (!mentor) return;
    setLoading(true);
    const { data } = await supabase.from('bookings').select('*').eq('mentor_id', mentor.id);
    setBookings((data as Booking[]) || []);
    setLoading(false);
  }, [mentor]);

  useEffect(() => { loadData(); }, [loadData]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleCopy(link: string, id: string) {
    copyToClipboard(link);
    setCopiedId(id);
    showToast('Meeting link ready to paste!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  }

  if (!mentor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">No mentor profile found for this account.</p>
      </div>
    );
  }

  const selectedDateStr = dateToISODate(selectedDate);
  const todayStr = dateToISODate(new Date());
  const isToday = selectedDateStr === todayStr;
  const todayCount = getMentorLoadForDate(bookings, mentor.id, todayStr);
  const selectedDayCount = getMentorLoadForDate(bookings, mentor.id, selectedDateStr);
  const capacityPct = (todayCount / MENTOR_DAILY_CAPACITY) * 100;
  const isMaxed = todayCount >= MENTOR_DAILY_CAPACITY;

  const dayBookings = bookings
    .filter((b) => b.slot_date === selectedDateStr && b.status === 'confirmed')
    .sort((a, b) => new Date(a.slot_utc).getTime() - new Date(b.slot_utc).getTime());

  const capacityColor = isMaxed ? '#ef4444' : todayCount === 1 ? '#f59e0b' : '#14b8a6';
  const capacityLabel = isMaxed ? 'Maxed Out' : todayCount === 1 ? '1 Slot Left' : 'Available';
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (capacityPct / 100) * circumference;

  const istTimeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kolkata', timeZoneName: 'short',
  }).format(istTime);
  const istDateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata',
  }).format(istTime);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-500">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">Codeyoung</span>
              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Mentor Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenAI} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
              <Sparkles className="h-4 w-4" /> AI Assistant
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-xs font-bold text-white">{mentor.name.charAt(0)}</div>
              <span className="text-sm font-medium text-slate-700">{mentor.name}</span>
            </div>
            <button onClick={onLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Overview Panel */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* IST Clock & Capacity Ring */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">IST Live Clock</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{istTimeStr}</p>
                <p className="text-xs text-slate-500">{istDateStr}</p>
              </div>
              <Clock className="h-8 w-8 text-teal-500" />
            </div>

            {/* Capacity Ring */}
            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke={capacityColor} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{todayCount}</span>
                  <span className="text-xs text-slate-500">/ {MENTOR_DAILY_CAPACITY} Today</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isMaxed ? 'bg-red-500' : todayCount === 1 ? 'bg-amber-500' : 'bg-teal-500'} ${!isMaxed ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium" style={{ color: capacityColor }}>{capacityLabel}</span>
              </div>
              {isMaxed && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 text-center">
                  Daily capacity reached. No further slots can be injected.
                </p>
              )}
            </div>
          </div>

          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">My Profile</h3>
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-blue-100 text-xl font-bold text-teal-700">
                {mentor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{mentor.name}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-slate-600">{mentor.rating}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{mentor.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{mentor.bio}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {mentor.subjects.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {getSubjectIcon(s)} {s}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5" /> Ages {mentor.age_groups.join(', ')}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Today's Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <span className="text-sm text-slate-600">Classes Today</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{todayCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-600">Total Students</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{bookings.filter((b) => b.status === 'confirmed').length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-slate-600">Remaining Slots</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{MENTOR_DAILY_CAPACITY - todayCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-500" />
                  <span className="text-sm text-slate-600">Status</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${mentor.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {mentor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chronological Agenda Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-500" />
              <h3 className="text-lg font-bold text-slate-900">Schedule</h3>
            </div>
            {/* Date navigation */}
            <div className="flex items-center gap-2">
              <button onClick={() => shiftDate(-1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 min-w-[140px] text-center">
                {isToday ? 'Today' : new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(selectedDate)}
              </span>
              <button onClick={() => shiftDate(1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 rounded-xl border border-slate-100 p-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2"><div className="h-4 w-32 bg-slate-200 rounded" /><div className="h-3 w-48 bg-slate-100 rounded" /></div>
                </div>
              ))}
            </div>
          ) : dayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-slate-400">No classes scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayBookings.map((booking, idx) => {
                const istTime = new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata', timeZoneName: 'short',
                }).format(new Date(booking.slot_utc));
                const isPast = new Date(booking.slot_utc).getTime() < Date.now();
                return (
                  <div key={booking.id} className={`flex flex-col gap-3 rounded-xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${isPast ? 'border-slate-100 bg-slate-50/50' : 'border-teal-100 bg-teal-50/30 hover:shadow-md'}`}>
                    <div className="flex items-center gap-4">
                      {/* Class number badge */}
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-gradient-to-br from-teal-500 to-blue-500 text-white'}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{booking.child_name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Age {booking.child_age}</span>
                          {isPast && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">Completed</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {getSubjectIcon(booking.subject)} {booking.subject} • {booking.experience_level} • {getTimezoneAbbrev(booking.parent_timezone)} Zone
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{istTime} (IST)</span>
                          <span className="text-slate-400">• Parent: {booking.parent_name}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(booking.meeting_link, booking.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        copiedId === booking.id
                          ? 'bg-green-500 text-white'
                          : isPast
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:shadow-md'
                      }`}
                    >
                      {copiedId === booking.id ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Meeting Link</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day summary */}
        {!isToday && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span>Viewing schedule for: <strong>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' }).format(selectedDate)}</strong></span>
            <span className="font-medium">{selectedDayCount} class{selectedDayCount !== 1 ? 'es' : ''} scheduled</span>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
