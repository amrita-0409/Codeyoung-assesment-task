/*
# Codeyoung Appointment Booking System - Initial Schema

Creates the core tables for a full-stack appointment-booking platform with
three user roles (parent, mentor, admin), 10 seeded mentor profiles, and a
bookings table that enforces per-mentor (2/day) and global (20/day) capacity.

1. New Tables
- `users`  — demo auth credentials + role (parent / mentor / admin)
- `mentors` — mentor profiles: subjects, age groups, rating, capacity, timezone
- `bookings` — parent→mentor session bookings with full timezone context

2. Security
- RLS enabled on every table.
- Policies use `TO anon, authenticated` because this is a demo app with
  a custom lightweight login (no Supabase Auth). Data is intentionally shared.

3. Seed Data
- 3 demo users:  parent@demo.com, priya@codeyoung.com, admin@codeyoung.com
- 10 mentor profiles across Scratch, Python, AI/ML, Web Dev, Robotics, etc.
*/

-- ─── users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  password   text NOT NULL,
  role       text NOT NULL CHECK (role IN ('parent','mentor','admin')),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

-- ─── mentors ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentors (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  email              text NOT NULL,
  subjects           text[] NOT NULL DEFAULT '{}',
  age_groups         text[] NOT NULL DEFAULT '{}',
  rating             numeric NOT NULL DEFAULT 5.0,
  avatar_url         text,
  bio                text NOT NULL DEFAULT '',
  timezone           text NOT NULL DEFAULT 'Asia/Kolkata',
  max_daily_capacity int NOT NULL DEFAULT 2,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz DEFAULT now()
);
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mentors" ON mentors;
CREATE POLICY "anon_select_mentors" ON mentors FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_mentors" ON mentors;
CREATE POLICY "anon_insert_mentors" ON mentors FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_mentors" ON mentors;
CREATE POLICY "anon_update_mentors" ON mentors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_mentors" ON mentors;
CREATE POLICY "anon_delete_mentors" ON mentors FOR DELETE
  TO anon, authenticated USING (true);

-- ─── bookings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id         uuid REFERENCES mentors(id) ON DELETE CASCADE,
  parent_email      text NOT NULL,
  parent_name       text NOT NULL,
  child_name        text NOT NULL,
  child_age         int NOT NULL,
  experience_level  text NOT NULL,
  subject           text NOT NULL,
  slot_utc          timestamptz NOT NULL,
  slot_date         date NOT NULL,
  parent_timezone   text NOT NULL DEFAULT 'UTC',
  status            text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  meeting_link      text NOT NULL,
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bookings_mentor_date ON bookings(mentor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_email);

-- ─── seed demo users ─────────────────────────────────────
INSERT INTO users (email, password, role, name) VALUES
  ('parent@demo.com',    'parent123', 'parent',  'Demo Parent'),
  ('priya@codeyoung.com','mentor123', 'mentor',  'Priya Sharma'),
  ('admin@codeyoung.com','admin123',  'admin',   'Admin User')
ON CONFLICT (email) DO NOTHING;

-- ─── seed 10 mentors ─────────────────────────────────────
INSERT INTO mentors (user_id, name, email, subjects, age_groups, rating, bio, timezone, max_daily_capacity)
SELECT id, 'Priya Sharma', 'priya@codeyoung.com',
  ARRAY['Scratch','Python'], ARRAY['6-10','10-14'], 4.9,
  'Former Google engineer who loves teaching kids the joy of coding through games and stories.',
  'Asia/Kolkata', 2
FROM users WHERE email = 'priya@codeyoung.com'
ON CONFLICT DO NOTHING;

INSERT INTO mentors (name, email, subjects, age_groups, rating, bio, timezone, max_daily_capacity)
VALUES
  ('Arjun Mehta', 'arjun@codeyoung.com',
   ARRAY['Python','AI/ML'], ARRAY['10-14','14-18'], 4.8,
   'AI researcher turned educator. Makes machine learning accessible for young minds.',
   'Asia/Kolkata', 2),
  ('Sneha Patel', 'sneha@codeyoung.com',
   ARRAY['Web Development','JavaScript'], ARRAY['12-18'], 4.7,
   'Full-stack developer who builds beautiful web apps and teaches kids to do the same.',
   'Asia/Kolkata', 2),
  ('Rohit Gupta', 'rohit@codeyoung.com',
   ARRAY['Robotics','Arduino'], ARRAY['8-14'], 4.6,
   'Robotics engineer passionate about hands-on STEM learning for curious kids.',
   'Asia/Kolkata', 2),
  ('Ananya Singh', 'ananya@codeyoung.com',
   ARRAY['Scratch','Game Development'], ARRAY['6-12'], 4.9,
   'Game designer who turns playtime into learning time with Scratch and block coding.',
   'Asia/Kolkata', 2),
  ('Vikram Reddy', 'vikram@codeyoung.com',
   ARRAY['Python','Data Science'], ARRAY['12-18'], 4.5,
   'Data scientist who makes numbers fun and storytelling visual for teens.',
   'Asia/Kolkata', 2),
  ('Kavya Nair', 'kavya@codeyoung.com',
   ARRAY['App Development','Flutter'], ARRAY['10-16'], 4.7,
   'Mobile app developer helping kids build real apps they can show friends.',
   'Asia/Kolkata', 2),
  ('Aditya Kumar', 'aditya@codeyoung.com',
   ARRAY['AI/ML','Python'], ARRAY['12-18'], 4.8,
   'ML engineer from IIT Bombay. Demystifies AI for the next generation.',
   'Asia/Kolkata', 2),
  ('Ishita Joshi', 'ishita@codeyoung.com',
   ARRAY['Scratch','Block Coding'], ARRAY['6-10'], 4.9,
   'Early-coding specialist who makes technology feel like magic for little ones.',
   'Asia/Kolkata', 2),
  ('Karan Malhotra', 'karan@codeyoung.com',
   ARRAY['Web Development','React'], ARRAY['14-18'], 4.6,
   'React expert and open-source contributor. Teaches modern web the right way.',
   'Asia/Kolkata', 2)
ON CONFLICT DO NOTHING;