import type { Booking, Mentor } from './types';

export function formatInTimezone(isoUtc: string, timezone: string, format: 'time' | 'datetime' | 'date' = 'datetime'): string {
  try {
    const date = new Date(isoUtc);
    const opts: Intl.DateTimeFormatOptions = {};
    if (format === 'time') {
      opts.hour = 'numeric';
      opts.minute = '2-digit';
      opts.timeZone = timezone;
      opts.timeZoneName = 'short';
    } else if (format === 'date') {
      opts.weekday = 'short';
      opts.month = 'short';
      opts.day = 'numeric';
      opts.timeZone = timezone;
    } else {
      opts.weekday = 'short';
      opts.month = 'short';
      opts.day = 'numeric';
      opts.hour = 'numeric';
      opts.minute = '2-digit';
      opts.timeZone = timezone;
      opts.timeZoneName = 'short';
    }
    return new Intl.DateTimeFormat('en-US', opts).format(date);
  } catch {
    return isoUtc;
  }
}

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getTimezoneAbbrev(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

export function generateTimeSlots(date: Date): string[] {
  // Generate 10 AM - 6 PM IST in UTC (IST = UTC+5:30)
  // So 10 AM IST = 4:30 AM UTC, each slot 1 hour apart
  const slots: string[] = [];
  const istHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  for (const hour of istHours) {
    const slotDate = new Date(date);
    slotDate.setUTCHours(hour - 5, 30, 0, 0); // Convert IST hour to UTC
    if (hour < 5) slotDate.setUTCDate(slotDate.getUTCDate() - 1);
    slots.push(slotDate.toISOString());
  }
  return slots;
}

export function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dateToISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return dateToISODate(d1) === dateToISODate(d2);
}

export function getDayName(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getDayNumber(d: Date): number {
  return d.getDate();
}

export function getMonthName(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export function isSlotTaken(bookings: Booking[], slotUtc: string, mentorId: string): boolean {
  return bookings.some(
    (b) => b.mentor_id === mentorId && b.slot_utc === slotUtc && b.status === 'confirmed'
  );
}

export function getMentorLoadForDate(bookings: Booking[], mentorId: string, dateStr: string): number {
  return bookings.filter(
    (b) => b.mentor_id === mentorId && b.slot_date === dateStr && b.status === 'confirmed'
  ).length;
}

export function getGlobalLoadForDate(bookings: Booking[], dateStr: string): number {
  return bookings.filter((b) => b.slot_date === dateStr && b.status === 'confirmed').length;
}

export function getMentorById(mentors: Mentor[], id: string): Mentor | undefined {
  return mentors.find((m) => m.id === id);
}

export function getSubjectIcon(subject: string): string {
  const map: Record<string, string> = {
    Scratch: '🐱',
    Python: '🐍',
    'AI/ML': '🤖',
    'Web Development': '🌐',
    Robotics: '🤖',
    'Game Development': '🎮',
    'Data Science': '📊',
    'App Development': '📱',
    JavaScript: '⚡',
    'Block Coding': '🧱',
    Arduino: '🔌',
    React: '⚛️',
    Flutter: '🦋',
  };
  return map[subject] || '💻';
}

export function getSubjectColor(subject: string): string {
  const map: Record<string, string> = {
    Scratch: 'from-orange-400 to-amber-500',
    Python: 'from-blue-400 to-cyan-500',
    'AI/ML': 'from-teal-400 to-emerald-500',
    'Web Development': 'from-sky-400 to-blue-500',
    Robotics: 'from-red-400 to-orange-500',
    'Game Development': 'from-purple-400 to-pink-500',
    'Data Science': 'from-green-400 to-teal-500',
    'App Development': 'from-indigo-400 to-purple-500',
    JavaScript: 'from-yellow-400 to-orange-500',
    'Block Coding': 'from-amber-400 to-yellow-500',
    Arduino: 'from-emerald-400 to-green-500',
    React: 'from-cyan-400 to-sky-500',
    Flutter: 'from-blue-400 to-indigo-500',
  };
  return map[subject] || 'from-slate-400 to-slate-500';
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return '★'.repeat(full) + (hasHalf ? '☆' : '') + '★'.repeat(5 - full - (hasHalf ? 1 : 0));
}

export const GLOBAL_DAILY_CAPACITY = 20;
export const MENTOR_DAILY_CAPACITY = 2;

export const SUBJECTS = [
  'Scratch',
  'Python',
  'AI/ML',
  'Web Development',
  'Robotics',
  'Game Development',
  'Data Science',
  'App Development',
  'JavaScript',
  'React',
  'Arduino',
  'Flutter',
];

export const AGE_GROUPS = ['6-8', '8-10', '10-12', '12-14', '14-16', '16-18'];

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
