import { useState, useEffect, useCallback } from 'react';
import {
  Code, LogOut, Sparkles, Shield, Users, Calendar, BarChart3,
  TrendingUp, Globe, Zap, RotateCcw, AlertTriangle, Star,
  ChevronLeft, ChevronRight, Copy, Check, Activity, User,
  BookOpen
} from 'lucide-react';
import type { AuthSession, Booking, Mentor } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import {
  dateToISODate, getMentorLoadForDate, getGlobalLoadForDate,
  MENTOR_DAILY_CAPACITY, GLOBAL_DAILY_CAPACITY, getSubjectIcon,
  getSubjectColor, copyToClipboard
} from '@/lib/utils';

interface AdminDashboardProps {
  session: AuthSession;
  onLogout: () => void;
  onOpenAI: () => void;
}

export default function AdminDashboard({ session, onLogout, onOpenAI }: AdminDashboardProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toast, setToast] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [page, setPage] = useState(0);
  const bookingsPerPage = 8;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mRes, bRes] = await Promise.all([
      supabase.from('mentors').select('*'),
      supabase.from('bookings').select('*'),
    ]);
    setMentors((mRes.data as Mentor[]) || []);
    setBookings((bRes.data as Booking[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  }

  const dateStr = dateToISODate(selectedDate);
  const todayStr = dateToISODate(new Date());
  const globalLoad = getGlobalLoadForDate(bookings, dateStr);
  const globalPct = (globalLoad / GLOBAL_DAILY_CAPACITY) * 100;

  // Subject distribution chart data
  const subjectCounts: Record<string, number> = {};
  bookings.filter((b) => b.slot_date === dateStr && b.status === 'confirmed').forEach((b) => {
    subjectCounts[b.subject] = (subjectCounts[b.subject] || 0) + 1;
  });
  const subjectEntries = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
  const maxSubjectCount = Math.max(...subjectEntries.map((e) => e[1]), 1);

  // Timezone distribution
  const tzCounts: Record<string, number> = {};
  bookings.filter((b) => b.slot_date === dateStr && b.status === 'confirmed').forEach((b) => {
    const tz = b.parent_timezone || 'UTC';
    // Group by region
    let region = tz.replace(/_/g, ' ');
    if (tz.includes('America/New_York') || tz.includes('US/Eastern')) region = 'US East Coast';
    else if (tz.includes('America/Los_Angeles') || tz.includes('US/Pacific')) region = 'US West Coast';
    else if (tz.includes('America/Chicago') || tz.includes('US/Central')) region = 'US Central';
    else if (tz.includes('Europe/London') || tz.includes('Europe/')) region = 'UK/Europe';
    else if (tz.includes('Asia/Kolkata') || tz.includes('Asia/Calcutta')) region = 'India (IST)';
    else if (tz.includes('Asia/')) region = 'Asia';
    tzCounts[region] = (tzCounts[region] || 0) + 1;
  });
  const tzEntries = Object.entries(tzCounts).sort((a, b) => b[1] - a[1]);
  const totalTz = tzEntries.reduce((s, e) => s + e[1], 0);

  // Bookings table pagination
  const allDayBookings = bookings
    .filter((b) => b.slot_date === dateStr && b.status === 'confirmed')
    .sort((a, b) => new Date(a.slot_utc).getTime() - new Date(b.slot_utc).getTime());
  const totalPages = Math.ceil(allDayBookings.length / bookingsPerPage) || 1;
  const pagedBookings = allDayBookings.slice(page * bookingsPerPage, (page + 1) * bookingsPerPage);

  async function handleReset() {
    setResetting(true);
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await loadData();
    setResetting(false);
    setShowResetConfirm(false);
    showToast('All bookings reset. All slots are now open.');
  }

  async function handleSeed() {
    setSeeding(true);
    const today = dateToISODate(new Date());
    const slots: string[] = [];
    for (let h = 10; h <= 19; h++) {
      const d = new Date();
      d.setUTCHours(h - 5, 30, 0, 0);
      slots.push(d.toISOString());
    }
    const childNames = ['Rahul', 'Diya', 'Aarav', 'Ishaan', 'Sara', 'Vivaan', 'Ananya', 'Kabir', 'Myra', 'Arjun', 'Saanvi', 'Vihaan', 'Aadya', 'Reyansh', 'Ira', 'Aditya', 'Navya', 'Dhruv'];
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const tzones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'America/Chicago', 'Asia/Kolkata'];

    const inserts: Record<string, unknown>[] = [];
    for (let i = 0; i < 18; i++) {
      const mentor = mentors[i % mentors.length];
      if (!mentor) continue;
      const slot = slots[i % slots.length];
      const slotDate = new Date(slot);
      inserts.push({
        mentor_id: mentor.id,
        parent_email: `parent${i}@demo.com`,
        parent_name: `Parent ${i + 1}`,
        child_name: childNames[i % childNames.length],
        child_age: 6 + (i % 12),
        experience_level: levels[i % levels.length],
        subject: mentor.subjects[0],
        slot_utc: slot,
        slot_date: today,
        parent_timezone: tzones[i % tzones.length],
        status: 'confirmed',
        meeting_link: `https://codeyoung.dummy/${Math.random().toString(36).slice(2, 10)}`,
      });
    }
    if (inserts.length > 0) {
      await supabase.from('bookings').insert(inserts);
    }
    await loadData();
    setSeeding(false);
    showToast(`Seeded ${inserts.length} test bookings for today.`);
  }

  async function handleOverflow() {
    setOverflowing(true);
    const today = dateToISODate(new Date());
    const slots: string[] = [];
    for (let h = 10; h <= 19; h++) {
      const d = new Date();
      d.setUTCHours(h - 5, 30, 0, 0);
      slots.push(d.toISOString());
    }
    const inserts: Record<string, unknown>[] = [];
    for (let i = 0; i < 20; i++) {
      const mentor = mentors[i % mentors.length];
      if (!mentor) continue;
      const slot = slots[i % slots.length];
      inserts.push({
        mentor_id: mentor.id,
        parent_email: `overflow${i}@demo.com`,
        parent_name: `Overflow Parent ${i + 1}`,
        child_name: `Student${i + 1}`,
        child_age: 8 + (i % 10),
        experience_level: 'Beginner',
        subject: mentor.subjects[0],
        slot_utc: slot,
        slot_date: today,
        parent_timezone: 'America/New_York',
        status: 'confirmed',
        meeting_link: `https://codeyoung.dummy/overflow${i}`,
      });
    }
    if (inserts.length > 0) {
      await supabase.from('bookings').insert(inserts);
    }
    await loadData();
    setOverflowing(false);
    showToast('Force-overflow: 20 placeholder bookings injected for today.');
  }

  async function toggleMentorActive(mentor: Mentor) {
    await supabase.from('mentors').update({ is_active: !mentor.is_active }).eq('id', mentor.id);
    await loadData();
    showToast(`${mentor.name} is now ${!mentor.is_active ? 'active' : 'inactive'}.`);
  }

  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(selectedDate);
  const isToday = dateStr === todayStr;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">Codeyoung</span>
              <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">Admin Control Room</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenAI} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
              <Sparkles className="h-4 w-4" /> AI Assistant
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{session.user.name}</span>
            </div>
            <button onClick={onLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Date selector */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Operations Overview</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="rounded-lg bg-white p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white min-w-[180px] text-center">
              {isToday ? 'Today' : dateLabel}
            </span>
            <button onClick={() => shiftDate(1)} className="rounded-lg bg-white p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Metrics Matrix */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Total Capacity Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-500" />
                <h3 className="font-semibold text-slate-900">Global Daily Capacity</h3>
              </div>
              <span className="text-2xl font-bold text-slate-900">{globalLoad}<span className="text-base font-normal text-slate-400"> / {GLOBAL_DAILY_CAPACITY}</span></span>
            </div>
            <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${globalPct >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' : globalPct >= 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-blue-500'}`}
                style={{ width: `${Math.min(globalPct, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="text-xs font-medium text-white mix-blend-difference">{globalLoad} booked</span>
                <span className="text-xs font-medium text-white mix-blend-difference">{GLOBAL_DAILY_CAPACITY - globalLoad} remaining</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 py-2">
                <p className="text-lg font-bold text-slate-900">{mentors.length}</p>
                <p className="text-xs text-slate-500">Mentors</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2">
                <p className="text-lg font-bold text-slate-900">{bookings.filter((b) => b.status === 'confirmed').length}</p>
                <p className="text-xs text-slate-500">Total Bookings</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2">
                <p className="text-lg font-bold text-slate-900">{mentors.filter((m) => getMentorLoadForDate(bookings, m.id, dateStr) >= MENTOR_DAILY_CAPACITY).length}</p>
                <p className="text-xs text-slate-500">Maxed Out</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2">
                <p className="text-lg font-bold text-slate-900">{mentors.filter((m) => getMentorLoadForDate(bookings, m.id, dateStr) === 0).length}</p>
                <p className="text-xs text-slate-500">Free Today</p>
              </div>
            </div>
          </div>

          {/* Timezone Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">Timezone Distribution</h3>
            </div>
            {tzEntries.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-400">No bookings for this date</div>
            ) : (
              <div className="space-y-3">
                {tzEntries.map(([region, count]) => {
                  const pct = totalTz > 0 ? (count / totalTz) * 100 : 0;
                  return (
                    <div key={region}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{region}</span>
                        <span className="text-slate-500">{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-teal-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Subject Distribution Chart */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold text-slate-900">Bookings by Subject</h3>
          </div>
          {subjectEntries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">No bookings for this date</div>
          ) : (
            <div className="space-y-3">
              {subjectEntries.map(([subject, count]) => (
                <div key={subject} className="flex items-center gap-3">
                  <div className="flex w-32 items-center gap-1.5 text-sm text-slate-700">
                    <span>{getSubjectIcon(subject)}</span>
                    <span className="truncate">{subject}</span>
                  </div>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-50">
                    <div
                      className={`h-full rounded-lg bg-gradient-to-r ${getSubjectColor(subject)} transition-all duration-700`}
                      style={{ width: `${(count / maxSubjectCount) * 100}%` }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white mix-blend-difference">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Roster Monitoring Grid */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-500" />
            <h3 className="text-lg font-bold text-slate-900">Mentor Roster Grid</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {mentors.map((mentor) => {
              const load = getMentorLoadForDate(bookings, mentor.id, dateStr);
              const isMaxed = load >= MENTOR_DAILY_CAPACITY;
              return (
                <div key={mentor.id} className={`rounded-xl border p-4 transition hover:shadow-md ${isMaxed ? 'border-red-200 bg-red-50/30' : load > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 bg-white'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 text-sm font-bold text-teal-700">
                      {mentor.name.charAt(0)}
                    </div>
                    <button
                      onClick={() => toggleMentorActive(mentor)}
                      className={`relative h-5 w-9 rounded-full transition ${mentor.is_active ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${mentor.is_active ? 'left-4.5' : 'left-0.5'}`} style={{ left: mentor.is_active ? '18px' : '2px' }} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{mentor.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-slate-500">{mentor.rating}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mentor.subjects.map((s) => (
                      <span key={s} className="text-xs">{getSubjectIcon(s)}</span>
                    ))}
                  </div>
                  <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 ${isMaxed ? 'bg-red-100' : load > 0 ? 'bg-amber-100' : 'bg-teal-100'}`}>
                    <span className="text-xs font-medium text-slate-600">Load</span>
                    <span className={`text-sm font-bold ${isMaxed ? 'text-red-600' : load > 0 ? 'text-amber-600' : 'text-teal-600'}`}>
                      {load}/{MENTOR_DAILY_CAPACITY}
                    </span>
                  </div>
                  {isMaxed && <p className="mt-1.5 text-center text-xs font-medium text-red-500">Maxed Out</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-500" />
              <h3 className="font-semibold text-slate-900">Bookings for {isToday ? 'Today' : dateLabel}</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{allDayBookings.length} total</span>
          </div>
          {allDayBookings.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">No bookings for this date</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-4 font-medium">Student</th>
                      <th className="pb-2 pr-4 font-medium">Mentor</th>
                      <th className="pb-2 pr-4 font-medium">Subject</th>
                      <th className="pb-2 pr-4 font-medium">Time (IST)</th>
                      <th className="pb-2 pr-4 font-medium">Timezone</th>
                      <th className="pb-2 pr-4 font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBookings.map((b) => {
                      const mentor = mentors.find((m) => m.id === b.mentor_id);
                      const istTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(b.slot_utc));
                      return (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 pr-4"><span className="font-medium text-slate-900">{b.child_name}</span><span className="text-xs text-slate-400 ml-1">({b.child_age})</span></td>
                          <td className="py-3 pr-4 text-slate-600">{mentor?.name || '—'}</td>
                          <td className="py-3 pr-4"><span className="inline-flex items-center gap-1 text-slate-600">{getSubjectIcon(b.subject)} {b.subject}</span></td>
                          <td className="py-3 pr-4 text-slate-600">{istTime}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{b.parent_timezone || 'UTC'}</td>
                          <td className="py-3 pr-4">
                            <button onClick={() => { copyToClipboard(b.meeting_link); showToast('Link copied!'); }} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`h-2 rounded-full transition-all ${i === page ? 'w-6 bg-teal-500' : 'w-2 bg-slate-200'}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Evaluator Sandbox Tools */}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900">Evaluator Sandbox Tools</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Testing Only</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={handleSeed}
              disabled={seeding || loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Seed Test Data</span>
              <span className="text-xs text-slate-500">Creates 18 mock bookings for today</span>
            </button>
            <button
              onClick={handleOverflow}
              disabled={overflowing || loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Force Capacity Overflow</span>
              <span className="text-xs text-slate-500">Injects 20 bookings to test error states</span>
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting || loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                <RotateCcw className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Reset All Bookings</span>
              <span className="text-xs text-slate-500">Purges all booking records</span>
            </button>
          </div>
        </div>
      </main>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Reset All Bookings?</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">This will permanently delete all booking records. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">Cancel</button>
              <button onClick={handleReset} disabled={resetting} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {resetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
