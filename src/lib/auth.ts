import { supabase } from './supabase';
import type { AuthSession, DemoUser, Mentor, Role } from './types';

export async function login(email: string, password: string): Promise<AuthSession | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle();

  if (error || !user) return null;

  const demoUser: DemoUser = user as DemoUser;

  let mentor: Mentor | undefined;
  if (demoUser.role === 'mentor') {
    const { data: mentorData } = await supabase
      .from('mentors')
      .select('*')
      .eq('email', demoUser.email)
      .maybeSingle();
    if (mentorData) mentor = mentorData as Mentor;
  }

  return { user: demoUser, mentor };
}

export function getQuickLogin(role: Role): { email: string; password: string } {
  switch (role) {
    case 'parent':
      return { email: 'parent@demo.com', password: 'parent123' };
    case 'mentor':
      return { email: 'priya@codeyoung.com', password: 'mentor123' };
    case 'admin':
      return { email: 'admin@codeyoung.com', password: 'admin123' };
  }
}
