export type Role = 'parent' | 'mentor' | 'admin';

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
}

export interface Mentor {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subjects: string[];
  age_groups: string[];
  rating: number;
  avatar_url: string | null;
  bio: string;
  timezone: string;
  max_daily_capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  mentor_id: string;
  parent_email: string;
  parent_name: string;
  child_name: string;
  child_age: number;
  experience_level: string;
  subject: string;
  slot_utc: string;
  slot_date: string;
  parent_timezone: string;
  status: 'confirmed' | 'cancelled';
  meeting_link: string;
  created_at: string;
}

export interface MentorWithLoad extends Mentor {
  today_count: number;
  today_bookings: Booking[];
}

export interface AuthSession {
  user: DemoUser;
  mentor?: Mentor;
}
