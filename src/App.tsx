import { useState } from 'react';
import Login from '@/pages/Login';
import ParentDashboard from '@/pages/ParentDashboard';
import MentorDashboard from '@/pages/MentorDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import AIAssistant from '@/components/AIAssistant';
import { Sparkles } from 'lucide-react';
import type { AuthSession } from '@/lib/types';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [showAI, setShowAI] = useState(false);

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <>
      {session.user.role === 'parent' && (
        <ParentDashboard session={session} onLogout={() => setSession(null)} onOpenAI={() => setShowAI(true)} />
      )}
      {session.user.role === 'mentor' && (
        <MentorDashboard session={session} onLogout={() => setSession(null)} onOpenAI={() => setShowAI(true)} />
      )}
      {session.user.role === 'admin' && (
        <AdminDashboard session={session} onLogout={() => setSession(null)} onOpenAI={() => setShowAI(true)} />
      )}

      {/* Floating AI button */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-xl shadow-teal-500/30 transition hover:scale-105 hover:shadow-2xl"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">AI</span>
        </button>
      )}

      {/* AI Assistant panel */}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </>
  );
}
