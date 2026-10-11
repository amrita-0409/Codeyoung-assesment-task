import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';

interface AIAssistantProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const quickActions = [
  'How do I book a class?',
  'What subjects are available?',
  'What age groups do you teach?',
  'How does the capacity system work?',
  'What timezones are supported?',
];

const knowledgeBase: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['book', 'booking', 'schedule', 'class', 'demo', 'how do i book'],
    answer: "Booking a demo class is easy! On the Parent Portal, browse our mentor grid, search by name or subject, then click 'Book Demo Class' on any mentor card. Pick a date from the 7-day calendar, select an available time slot (shown in your local timezone), fill in your child's details, and confirm. You'll get a meeting link instantly!",
  },
  {
    keywords: ['subject', 'course', 'teach', 'learn', 'coding', 'programming'],
    answer: "We teach 12+ subjects including: Scratch Programming (ages 6-10), Python for AI (ages 10-18), Web Development with React, Game Development, Robotics & Arduino, App Development with Flutter, Data Science, and more. Each subject is tailored to your child's age and experience level.",
  },
  {
    keywords: ['age', 'old', 'kid', 'child', 'year'],
    answer: "We teach kids ages 6-18! Our mentors specialize in different age groups: 6-8 (Scratch & block coding), 8-10 (intro to Python), 10-14 (Python, AI/ML, web dev), and 14-18 (advanced full-stack, AI/ML, app development). Every class is age-appropriate and engaging.",
  },
  {
    keywords: ['capacity', 'limit', 'slot', 'full', 'max'],
    answer: "Our capacity system ensures quality: each mentor teaches a maximum of 2 classes per day, and the global platform limit is 20 classes per day. This keeps groups small and attention high. When a mentor is fully booked, their card shows 'Fully Booked Today'. If the global limit is hit for a date, you'll see a banner to pick another date.",
  },
  {
    keywords: ['timezone', 'time zone', 'ist', 'local', 'utc', 'dst'],
    answer: "The Parent Portal uses Google Maps to pin your current location and resolve its timezone (with GPS + Maps Time Zone). You also see live clocks for preferred areas like New York, London, Dubai, India, Singapore, and Sydney — tap one to view class slots in that zone. Mentors still see their schedule in IST.",
  },
  {
    keywords: ['mentor', 'teacher', 'who', 'instructor'],
    answer: "We have 10 expert mentors from top tech backgrounds - former Google engineers, IIT graduates, AI researchers, and full-stack developers. Each has a rating (average 4.8 stars) and specializes in specific subjects and age groups. You can pick any mentor based on your child's interests!",
  },
  {
    keywords: ['cancel', 'refund', 'reschedule', 'change'],
    answer: "You can cancel any booking from the 'My Bookings' tab in your Parent Portal. Just click 'Cancel' on any booking card. Since demo classes are free, there's no refund process needed. To rebook, simply browse mentors and book a new slot!",
  },
  {
    keywords: ['free', 'cost', 'price', 'pay', 'demo'],
    answer: "Demo classes are completely free! It's a great way to experience Codeyoung's teaching quality before committing. After your demo, you can discuss enrollment plans with your mentor.",
  },
  {
    keywords: ['experience', 'level', 'beginner', 'intermediate', 'advanced'],
    answer: "When booking, you'll select your child's experience level: Beginner (new to coding), Intermediate (some block coding or basic syntax), or Advanced (comfortable with a language). This helps the mentor customize the demo class to your child's skill level.",
  },
  {
    keywords: ['ai', 'assistant', 'help', 'what can you do'],
    answer: "I'm CodeBot, your AI assistant! I can answer questions about booking classes, available subjects, age groups, timezone support, capacity limits, mentors, and more. Just type your question or tap a quick-action chip below!",
  },
  {
    keywords: ['reset', 'admin', 'sandbox', 'seed', 'test', 'evaluator'],
    answer: "Admin tools include: 'Seed Test Data' (creates 18 mock bookings), 'Force Capacity Overflow' (injects 20 bookings to test error states), and 'Reset All Bookings' (clears all records). These are for evaluator testing and found in the Admin Control Room's Sandbox section.",
  },
];

function getAnswer(question: string): string {
  const lower = question.toLowerCase();
  let bestMatch: { keywords: string[]; answer: string } | null = null;
  let bestScore = 0;
  for (const entry of knowledgeBase) {
    const score = entry.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }
  if (bestMatch && bestScore > 0) return bestMatch.answer;
  return "I'm not sure about that yet, but I can help with booking classes, available subjects, age groups, timezones, capacity limits, mentors, and platform features. Try asking about one of those topics!";
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi! I'm CodeBot, your AI assistant. I can help you with booking classes, understanding subjects, capacity limits, timezones, and more. What would you like to know?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const answer = getAnswer(question);
      setMessages((prev) => [...prev, { role: 'bot', text: answer }]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex h-[600px] max-h-screen w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:w-96 sm:bottom-6 sm:right-6 sm:rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-500 to-blue-500 p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-teal-500 bg-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white">CodeBot AI</p>
            <p className="text-xs text-teal-100">Online • Always here to help</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-br from-teal-400 to-blue-500'}`}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-slate-500" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-100'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {quickActions.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200 transition hover:bg-teal-100">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 p-3">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
          />
          <button type="submit" disabled={!input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white transition hover:shadow-md disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
