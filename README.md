# Codeyoung Full-Stack Appointment-Booking System

A robust, enterprise-ready full-stack demo class booking platform engineered specifically for Codeyoung's cross-continental scheduling operations. This application coordinates multi-region timezones, manages strict day-level resource allocation constraints, and provides dedicated portals for Parents, Mentors, and Administrators.

---

## 🚀 Key Architectural Features

*   **Role-Based Access Control (RBAC):** Distinct dashboards customized for Parents, Mentors, and Admins. It includes an inline evaluator bypass dropdown to switch roles instantly without complex sign-up sheets.
*   **Daylight Savings Time (DST) & Timezone Engine:** Powered by Luxon to store all schedule slots in canonical UTC format inside the database. It converts time dynamically on the UI based on browser local settings, seamlessly handling US (EST/PST), UK (GMT/BST), and India (IST) zone changes.
*   **Mentor Capacity Guardrails:** A strict transactional database enforcement layer that caps each mentor at a maximum of 2 demo classes per calendar day. It natively balances a 10-mentor pool against 20 daily global parent booking windows.
*   **Automated Communication Simulation:** Generates unique virtual dummy meeting URLs upon booking validation. It renders an on-screen mock notification log showcasing the exact transaction emails dispatched to both parent and teacher profiles.
*   **10-Second Auto-Scrolling Course Banner:** A responsive top-level horizontal carousel highlighting core tracks that automatically slides forward every 10 seconds using optimized React timing cycles.
*   **Gamified Kids Motivation & Success Showcase:** An engaging layout footer presenting successful student projects and progressive coding achievement badges to increase user interaction.

---

## 🛠️ Tech Stack & Dependencies

*   **Frontend Ecosystem:** React.js 18, TypeScript, Vite
*   **Styling Engine:** Tailwind CSS, Lucide React (for iconography)
*   **Time Management Library:** Luxon (handling IANA timezone records)
*   **Backend & Relational Database:** Supabase, PostgreSQL
*   **State Management:** React Context API (Auth and Booking states)

---

## 💻 Local Project Setup & Installation

Follow these sequential steps to establish a running local environment on your computer:

### Prerequisites
Ensure you have Node.js (version 18.0 or higher) and npm installed.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd project
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Setup Environment Configuration
Create a file named `.env` in the root folder of the project and add your unique Supabase operational keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_public_key
```

### 4. Initialize Local Development Server
```bash
npm run dev
```
The console will output the local network target URL, typically `http://localhost:5173`. Open this address inside your browser.

---

## 🗄️ Database Schema Blueprint

The application relies on PostgreSQL tables initialized via Supabase migrations. The core schemas are structured as follows:

*   **Mentors Table:** Contains fields for ID, Name, Email, Base Timezone (defaults to 'Asia/Kolkata'), and Active Status flags.
*   **Bookings Table:** Tracks the Unique Booking ID, Mentor ID relation, Parent ID relation, Slot DateTime (stored in UTC), Booking Date string (extracted for rapid day-level capacity validation queries), and the generated Dummy Meeting Link.

---

## 🧪 Evaluation Guide for Reviewers

To simplify grading, use the specialized testing dashboard tools included on the interface:

*   **Parent Simulation Flow:** Navigate the visual calendar wizard. Select a time slot to see it auto-convert into your local system time. Submit the booking to witness the simulated confirmation email pop up on the UI logs.
*   **Mentor Agenda View:** Switch to the Mentor profile to see all booked times instantly grouped and converted into pure India Standard Time (IST). Observe the circular capacity ring track the daily workload.
*   **Admin Sandbox Panel:** Utilize the "Seed Evaluator Test Data" button to fill the system tables with mock history logs immediately. Use the "Reset Capacity Ledgers" button to clear the tables and run clean edge-case tests.

