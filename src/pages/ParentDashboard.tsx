import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Star, Clock, Users, ChevronRight, ChevronLeft, Check, X,
  Calendar, Globe, Info, GraduationCap, Zap, Code, BookOpen, Rocket,
  Trophy, ArrowRight, Bell, User, LogOut, Sparkles, CheckCircle2,
  AlertCircle, Copy, Mail, Heart, Lightbulb
} from 'lucide-react';
import type { AuthSession, Booking, Mentor } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import TimezonePanel from '@/components/TimezonePanel';
import {
  getBrowserTimezone, getTimezoneAbbrev, generateTimeSlots, getNext7Days,
  dateToISODate, isSameDay, getDayName, getDayNumber, getMonthName,
  isSlotTaken, getMentorLoadForDate, getGlobalLoadForDate, getSubjectIcon,
  getSubjectColor, copyToClipboard, GLOBAL_DAILY_CAPACITY,
  MENTOR_DAILY_CAPACITY, EXPERIENCE_LEVELS
} from '@/lib/utils';

interface ParentDashboardProps {
  session: AuthSession;
  onLogout: () => void;
  onOpenAI: () => void;
}

const courses = [
  { name: 'Scratch Programming', desc: 'Block-based coding for ages 6-10', icon: '🐱', color: 'from-orange-500 to-amber-500' },
  { name: 'Python for AI', desc: 'Build AI models from scratch', icon: '🐍', color: 'from-blue-500 to-cyan-500' },
  { name: 'Web Development', desc: 'Full-stack React & JavaScript', icon: '🌐', color: 'from-sky-500 to-indigo-500' },
  { name: 'Game Development', desc: 'Create games with JavaScript', icon: '🎮', color: 'from-purple-500 to-pink-500' },
  { name: 'Robotics & Arduino', desc: 'Hands-on hardware coding', icon: '🤖', color: 'from-red-500 to-orange-500' },
  { name: 'App Development', desc: 'Build mobile apps with Flutter', icon: '📱', color: 'from-indigo-500 to-blue-500' },
];

const successStories = [
  { name: 'Diya', age: 12, project: 'Built a space-shooter game using JavaScript', icon: '🚀' },
  { name: 'Aarav', age: 10, project: 'Created an AI chatbot for her school', icon: '🤖' },
  { name: 'Ishaan', age: 14, project: 'Deployed a full-stack weather app', icon: '🌤️' },
  { name: 'Sara', age: 8, project: 'Made an animated story in Scratch', icon: '📖' },
];

const milestones = [
  { level: 1, name: 'Logic Blocks', desc: 'Master block coding basics', icon: '🧱' },
  { level: 2, name: 'Syntax Mastery', desc: 'Python & JavaScript fluency', icon: '⌨️' },
  { level: 3, name: 'Full Stack Deploy', desc: 'Build & ship real apps', icon: '🚀' },
];

type WizardStep = 'browse' | 'datetime' | 'info' | 'confirm' | 'success';

export default function ParentDashboard({ session, onLogout, onOpenAI }: ParentDashboardProps) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'book' | 'myBookings'>('book');
  const [wizardStep, setWizardStep] = useState<WizardStep>('browse');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [toast, setToast] = useState('');
  const [globalBlockout, setGlobalBlockout] = useState(false);
  const [viewingTz, setViewingTz] = useState(getBrowserTimezone);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tzAbbrev = getTimezoneAbbrev(viewingTz);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mentorsRes, bookingsRes, myBookingsRes] = await Promise.all([
      supabase.from('mentors').select('*').eq('is_active', true),
      supabase.from('bookings').select('*').eq('status', 'confirmed'),
      supabase.from('bookings').select('*').eq('parent_email', session.user.email),
    ]);
    if (mentorsRes.data) setMentors(mentorsRes.data as Mentor[]);
    if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
    if (myBookingsRes.data) setMyBookingsRes(myBookingsRes.data as Booking[]);
    setLoading(false);
  }, [session.user.email]);

  // renamed to avoid unused-var lint
  function setMyBookingsRes(data: Booking[]) {
    setMyBookings(data);
  }

  useEffect(() => { loadData(); }, [loadData]);

  // Course carousel auto-scroll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % courses.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }

  const todayStr = dateToISODate(new Date());

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = !subjectFilter || m.subjects.includes(subjectFilter);
    return matchesSearch && matchesSubject;
  });

  function startBooking(mentor: Mentor) {
    setSelectedMentor(mentor);
    setWizardStep('datetime');
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingError('');
  }

  function selectDate(date: Date) {
    const dateStr = dateToISODate(date);
    const globalLoad = getGlobalLoadForDate(bookings, dateStr);
    if (globalLoad >= GLOBAL_DAILY_CAPACITY) {
      setGlobalBlockout(true);
      setBookingError(`Global limit reached for this date. Codeyoung ensures small group attention; please pick another date.`);
      return;
    }
    setGlobalBlockout(false);
    setBookingError('');
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function selectSlot(slotUtc: string) {
    if (!selectedMentor || !selectedDate) return;
    const dateStr = dateToISODate(selectedDate);
    if (isSlotTaken(bookings, slotUtc, selectedMentor.id)) return;
    const mentorLoad = getMentorLoadForDate(bookings, selectedMentor.id, dateStr);
    if (mentorLoad >= MENTOR_DAILY_CAPACITY) {
      setBookingError(`All mentors specializing in this slot are at maximum capacity. Please pick a nearby hour.`);
      return;
    }
    setBookingError('');
    setSelectedSlot(slotUtc);
  }

  function goToInfo() {
    if (!selectedSlot) return;
    setWizardStep('info');
  }

  async function confirmBooking() {
    if (!selectedMentor || !selectedDate || !selectedSlot) return;
    setBookingError('');

    const dateStr = dateToISODate(selectedDate);
    const globalLoad = getGlobalLoadForDate(bookings, dateStr);
    if (globalLoad >= GLOBAL_DAILY_CAPACITY) {
      setBookingError('Global daily capacity of 20 classes reached. Please choose another date.');
      return;
    }
    const mentorLoad = getMentorLoadForDate(bookings, selectedMentor.id, dateStr);
    if (mentorLoad >= MENTOR_DAILY_CAPACITY) {
      setBookingError(`${selectedMentor.name} has reached the daily limit of 2 classes. Please choose another mentor or date.`);
      return;
    }

    const meetingLink = `https://codeyoung.dummy/${Math.random().toString(36).slice(2, 10)}`;
    const bookingData = {
      mentor_id: selectedMentor.id,
      parent_email: session.user.email,
      parent_name: session.user.name,
      child_name: childName,
      child_age: parseInt(childAge, 10),
      experience_level: experienceLevel,
      subject: selectedMentor.subjects[0],
      slot_utc: selectedSlot,
      slot_date: dateStr,
      parent_timezone: viewingTz,
      status: 'confirmed',
      meeting_link: meetingLink,
    };

    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) {
      setBookingError('Failed to create booking. Please try again.');
      return;
    }
    setBookingSuccess(data as Booking);
    setWizardStep('success');
    setShowEmailPreview(true);
    await loadData();
  }

  async function cancelBooking(id: string) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    await loadData();
    showToast('Booking cancelled successfully');
  }

  function resetWizard() {
    setWizardStep('browse');
    setSelectedMentor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setChildName('');
    setChildAge('');
    setExperienceLevel('Beginner');
    setBookingError('');
    setBookingSuccess(null);
    setShowEmailPreview(false);
  }

  const allSubjects = Array.from(new Set(mentors.flatMap((m) => m.subjects))).sort();
  const upcomingMyBookings = myBookings.filter((b) => b.status === 'confirmed').sort((a, b) => new Date(a.slot_utc).getTime() - new Date(b.slot_utc).getTime());

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
              <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">Parent Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenAI} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
              <Sparkles className="h-4 w-4" /> AI Assistant
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{session.user.name}</span>
              <span className="hidden text-xs text-slate-400 sm:inline">· {viewingTz}</span>
            </div>
            <button onClick={onLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Course Carousel */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-3 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCarouselIndex((p) => (p - 1 + courses.length) % courses.length)} className="shrink-0 rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 overflow-hidden">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {courses.map((course, i) => (
                  <div key={i} className="flex min-w-full items-center gap-3 px-2">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${course.color} text-lg`}>
                      {course.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{course.name}</p>
                      <p className="text-xs text-slate-400 truncate">{course.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setCarouselIndex((p) => (p + 1) % courses.length)} className="shrink-0 rounded-full bg-white/10 p-1.5 text-white transition hover:bg-white/20">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="hidden sm:flex shrink-0 gap-1.5">
              {courses.map((_, i) => (
                <button key={i} onClick={() => setCarouselIndex(i)} className={`h-1.5 rounded-full transition-all ${i === carouselIndex ? 'w-6 bg-teal-400' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      {wizardStep === 'browse' && activeTab === 'book' && (
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-blue-600 to-indigo-700">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="h-4 w-4 text-teal-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-200">Book a Free Demo Class</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-2xl">
              Give your child the superpower of coding
            </h1>
            <p className="mt-3 text-base text-teal-50/80 max-w-xl">
              Learn from expert mentors in 1-on-1 live classes. Scratch, Python, AI/ML, Web Dev & more — designed for ages 6-18.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Users className="h-4 w-4 text-teal-200" />
                <span className="text-sm text-white font-medium">10 Expert Mentors</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <BookOpen className="h-4 w-4 text-teal-200" />
                <span className="text-sm text-white font-medium">12+ Subjects</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Star className="h-4 w-4 text-teal-200" />
                <span className="text-sm text-white font-medium">4.8 Avg Rating</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Tab switcher */}
        {wizardStep === 'browse' && activeTab === 'book' && (
          <TimezonePanel viewingTz={viewingTz} onTimezoneChange={setViewingTz} />
        )}

        {wizardStep === 'browse' && (
          <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
            <button onClick={() => setActiveTab('book')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'book' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Book a Class
            </button>
            <button onClick={() => setActiveTab('myBookings')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === 'myBookings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              My Bookings {upcomingMyBookings.length > 0 && <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-xs text-teal-700">{upcomingMyBookings.length}</span>}
            </button>
          </div>
        )}

        {/* My Bookings tab */}
        {activeTab === 'myBookings' && wizardStep === 'browse' && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">My Bookings</h2>
            {upcomingMyBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16">
                <Calendar className="mb-3 h-12 w-12 text-slate-300" />
                <p className="text-slate-500">No bookings yet. Book your first demo class!</p>
                <button onClick={() => setActiveTab('book')} className="mt-4 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 px-4 py-2 text-sm font-medium text-white">
                  Browse Mentors
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingMyBookings.map((booking) => {
                  const mentor = mentors.find((m) => m.id === booking.mentor_id);
                  return (
                    <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 text-lg">
                            {getSubjectIcon(booking.subject)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{booking.subject}</p>
                            <p className="text-xs text-slate-500">{mentor?.name || 'Mentor'}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Confirmed</span>
                      </div>
                      <div className="space-y-1.5 text-sm text-slate-600">
                        <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" /> {booking.child_name} (Age {booking.child_age})</p>
                        <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /> {formatSlotLocal(booking.slot_utc, booking.parent_timezone)}</p>
                        <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-slate-400" /> {booking.parent_timezone}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => { copyToClipboard(booking.meeting_link); showToast('Meeting link copied!'); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200">
                          <Copy className="h-3.5 w-3.5" /> Copy Link
                        </button>
                        <button onClick={() => cancelBooking(booking.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Browse mentors */}
        {activeTab === 'book' && wizardStep === 'browse' && (
          <div>
            {/* Search & Filter */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentors or subjects..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSubjectFilter(null)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${!subjectFilter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                  All
                </button>
                {allSubjects.map((s) => (
                  <button key={s} onClick={() => setSubjectFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${subjectFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                    {getSubjectIcon(s)} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentor Grid */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-2"><div className="h-4 w-24 bg-slate-200 rounded" /><div className="h-3 w-32 bg-slate-100 rounded" /></div>
                    </div>
                    <div className="mt-4 h-3 w-full bg-slate-100 rounded" />
                    <div className="mt-2 h-3 w-2/3 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMentors.map((mentor) => {
                  const load = getMentorLoadForDate(bookings, mentor.id, todayStr);
                  const isFull = load >= MENTOR_DAILY_CAPACITY;
                  return (
                    <div key={mentor.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-teal-200">
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-bold text-slate-600">
                          {mentor.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate">{mentor.name}</h3>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-slate-600">{mentor.rating}</span>
                            <span className="text-xs text-slate-400">• {mentor.timezone}</span>
                          </div>
                        </div>
                        {isFull && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Full Today</span>}
                      </div>
                      <p className="mb-3 line-clamp-2 text-xs text-slate-500">{mentor.bio}</p>
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {mentor.subjects.map((s) => (
                          <span key={s} className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${getSubjectColor(s)} px-2 py-0.5 text-xs font-medium text-white`}>
                            {getSubjectIcon(s)} {s}
                          </span>
                        ))}
                      </div>
                      <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {mentor.age_groups.join(', ')}</span>
                      </div>
                      <button onClick={() => startBooking(mentor)} disabled={isFull} className="w-full rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
                        {isFull ? 'Fully Booked Today' : 'Book Demo Class'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Booking Wizard: Date & Time */}
        {wizardStep === 'datetime' && selectedMentor && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={resetWizard} className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pick a Date & Time</h2>
                  <p className="text-sm text-slate-500">with {selectedMentor.name} • {selectedMentor.subjects.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 font-medium text-teal-700">
                  <Globe className="h-3.5 w-3.5" /> Viewing in {viewingTz} ({tzAbbrev})
                </span>
              </div>
            </div>

            {/* DST safeguard */}
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Times automatically adjust for daylight savings transitions in your timezone.</span>
            </div>

            {/* Global blockout */}
            {globalBlockout && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Global limit reached for this date. Codeyoung ensures small group attention; please pick another date.</span>
              </div>
            )}

            {/* Date picker */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-7 gap-2">
                {getNext7Days().map((date) => {
                  const dateStr = dateToISODate(date);
                  const globalLoad = getGlobalLoadForDate(bookings, dateStr);
                  const isBlocked = globalLoad >= GLOBAL_DAILY_CAPACITY;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  return (
                    <button
                      key={dateStr}
                      onClick={() => selectDate(date)}
                      disabled={isBlocked}
                      className={`flex flex-col items-center rounded-lg py-3 transition ${
                        isSelected
                          ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-md'
                          : isBlocked
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      <span className="text-xs font-medium">{getDayName(date)}</span>
                      <span className="text-lg font-bold">{getDayNumber(date)}</span>
                      <span className="text-xs">{getMonthName(date)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Available Time Slots</h3>
                  <span className="text-xs text-slate-500">All times shown in {tzAbbrev}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                  {generateTimeSlots(selectedDate).map((slot) => {
                    const taken = isSlotTaken(bookings, slot, selectedMentor.id);
                    const dateStr = dateToISODate(selectedDate);
                    const mentorLoad = getMentorLoadForDate(bookings, selectedMentor.id, dateStr);
                    const mentorFull = mentorLoad >= MENTOR_DAILY_CAPACITY && !taken;
                    const isSelected = selectedSlot === slot;
                    const disabled = taken || mentorFull;
                    return (
                      <button
                        key={slot}
                        onClick={() => selectSlot(slot)}
                        disabled={disabled}
                        className={`rounded-lg py-2.5 text-sm font-medium transition ${
                          isSelected
                            ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
                            : taken
                            ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                            : mentorFull
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700 ring-1 ring-slate-200'
                        }`}
                      >
                        {formatSlotTimeLocal(slot, viewingTz)}
                      </button>
                    );
                  })}
                </div>
                {bookingError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <button onClick={goToInfo} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Booking Wizard: Student Info */}
        {wizardStep === 'info' && selectedMentor && selectedDate && selectedSlot && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => setWizardStep('datetime')} className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900">Student Information</h2>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Child's Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g., Rahul"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Child's Age</label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="e.g., 10"
                  min="5"
                  max="18"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Coding Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setExperienceLevel(level)}
                      className={`rounded-lg py-2.5 text-sm font-medium transition ${
                        experienceLevel === level
                          ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Booking Summary</h4>
                <div className="space-y-1 text-sm text-slate-700">
                  <p><span className="text-slate-500">Mentor:</span> {selectedMentor.name}</p>
                  <p><span className="text-slate-500">Subject:</span> {selectedMentor.subjects.join(', ')}</p>
                  <p><span className="text-slate-500">Date:</span> {getDayName(selectedDate)}, {getMonthName(selectedDate)} {getDayNumber(selectedDate)}</p>
                  <p><span className="text-slate-500">Time:</span> {formatSlotTimeLocal(selectedSlot, viewingTz)} ({tzAbbrev})</p>
                  <p><span className="text-slate-500">Timezone:</span> {viewingTz}</p>
                </div>
              </div>
            </div>

            <button
              onClick={confirmBooking}
              disabled={!childName || !childAge}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
            >
              Confirm Booking <Check className="h-4 w-4" />
            </button>
            {bookingError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}
          </div>
        )}

        {/* Booking Wizard: Success */}
        {wizardStep === 'success' && bookingSuccess && (
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="bg-gradient-to-br from-teal-500 to-blue-500 p-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <CheckCircle2 className="h-9 w-9 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
                <p className="mt-1 text-sm text-teal-50">A confirmation email has been sent to {session.user.email}</p>
              </div>

              <div className="p-6">
                <div className="mb-4 rounded-lg bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-500">Child</p><p className="font-medium text-slate-900">{bookingSuccess.child_name} (Age {bookingSuccess.child_age})</p></div>
                    <div><p className="text-xs text-slate-500">Level</p><p className="font-medium text-slate-900">{bookingSuccess.experience_level}</p></div>
                    <div><p className="text-xs text-slate-500">Subject</p><p className="font-medium text-slate-900">{bookingSuccess.subject}</p></div>
                    <div><p className="text-xs text-slate-500">Time</p><p className="font-medium text-slate-900">{formatSlotLocal(bookingSuccess.slot_utc, bookingSuccess.parent_timezone)}</p></div>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-lg border-2 border-dashed border-teal-300 bg-teal-50 p-3">
                  <Link className="h-4 w-4 text-teal-600" />
                  <input readOnly value={bookingSuccess.meeting_link} className="flex-1 bg-transparent text-sm text-teal-800 outline-none" />
                  <button onClick={() => { copyToClipboard(bookingSuccess.meeting_link); showToast('Meeting link copied!'); }} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-700">
                    <Copy className="inline h-3 w-3" /> Copy
                  </button>
                </div>

                {/* Email preview mockup */}
                <button onClick={() => setShowEmailPreview((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
                  <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Preview confirmation email</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showEmailPreview ? 'rotate-90' : ''}`} />
                </button>
                {showEmailPreview && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded bg-slate-100 px-2 py-0.5">From: noreply@codeyoung.com</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5">To: {session.user.email}</span>
                      </div>
                      <h3 className="mt-2 font-semibold text-slate-900">Your Codeyoung Demo Class is Confirmed! 🎉</h3>
                    </div>
                    <div className="space-y-2 pt-3 text-sm text-slate-600">
                      <p>Hi {session.user.name},</p>
                      <p>Your demo class with <strong>{selectedMentor?.name}</strong> has been confirmed. We're excited to meet {bookingSuccess.child_name}!</p>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p><strong>📅 Date:</strong> {formatSlotLocal(bookingSuccess.slot_utc, bookingSuccess.parent_timezone)}</p>
                        <p><strong>🔗 Meeting Link:</strong> {bookingSuccess.meeting_link}</p>
                        <p><strong>📚 Subject:</strong> {bookingSuccess.subject}</p>
                      </div>
                      <p>Please join the meeting 5 minutes before the scheduled time. See you there!</p>
                      <p className="text-xs text-slate-400 mt-2">— The Codeyoung Team</p>
                    </div>
                  </div>
                )}

                <button onClick={resetWizard} className="mt-4 w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                  Book Another Class
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Gamified Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {/* Success Stories */}
          <div className="mb-10">
            <div className="mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Student Success Stories</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {successStories.map((s, i) => (
                <div key={i} className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">
                  <div className="mb-2 text-3xl">{s.icon}</div>
                  <p className="text-sm font-semibold text-white">{s.name}, Age {s.age}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.project}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" /> <Star className="h-3 w-3 fill-amber-400" /> <Star className="h-3 w-3 fill-amber-400" /> <Star className="h-3 w-3 fill-amber-400" /> <Star className="h-3 w-3 fill-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Board */}
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-teal-400" />
              <h3 className="text-lg font-bold text-white">Learning Milestones</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-2xl">{m.icon}</div>
                    <div>
                      <p className="text-xs font-medium text-teal-400">Level {m.level}</p>
                      <p className="text-sm font-semibold text-white">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                  </div>
                  {i < milestones.length - 1 && <ArrowRight className="hidden sm:block h-5 w-5 shrink-0 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-slate-500">Codeyoung © 2026 — Where young minds learn to code</p>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );

  function formatSlotTimeLocal(slotUtc: string, tz: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(slotUtc));
    } catch { return slotUtc; }
  }

  function formatSlotLocal(slotUtc: string, tz: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: tz, timeZoneName: 'short' }).format(new Date(slotUtc));
    } catch { return slotUtc; }
  }
}

// Inline Link icon since it's used but not imported from lucide
function Link({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
