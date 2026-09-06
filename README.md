# CampusConnect

A campus event and achievement management hub built for CSE departments — replacing fragmented WhatsApp groups, physical notice boards, and manual sign-up sheets with one centralised platform.

> **Stack:** React (Vite SPA) + Supabase — no Express server, no MongoDB.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v4, shadcn/ui (Radix), Zustand, React Router v6, Recharts |
| Backend-as-a-Service | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage + RLS) |
| Auth | Supabase Auth (email/password, session in localStorage) |
| Database | PostgreSQL via Supabase — relational schema with foreign keys |
| Storage | Supabase Storage — event banners, UPI QR codes, payment screenshots, achievement proofs |
| Forms | React Hook Form + Zod |
| QR Scan | `html5-qrcode` (camera-based scanner in browser) |
| Deployment | Vercel (frontend) — no server to host |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A free [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
# Install frontend dependencies
cd client && npm install
```

That's it — there is no server to install.

### 2. Set up Supabase

1. Go to your Supabase project → **SQL Editor** → run the full schema from [`supabase/schema.sql`](./supabase/schema.sql)
   - Creates tables: `profiles`, `events`, `registrations`, `achievements`
   - Creates RLS policies, the `handle_new_user` trigger, and storage bucket policies
2. Go to **Storage → Buckets** and create the following:

| Bucket | Public? | Used for |
|---|---|---|
| `event-banners` | ✅ Public | Event banner images |
| `payment-qr` | ✅ Public | UPI QR codes shown to students |
| `payment-screenshots` | ❌ Private | Student payment proof uploads |
| `achievement-proofs` | ❌ Private | Student certification/workshop proofs |

3. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure Environment Variables

Create `client/.env` (never commit this file — it is already in `.gitignore`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ Only the **anon/publishable** key goes here — never the `service_role` secret.  
> Security is enforced by **Row Level Security (RLS)** policies in PostgreSQL, not by hiding the anon key.

### 4. Run

```bash
# From project root
npm run dev
# or
cd client && npm run dev
```

App runs at → **http://localhost:5173**

---

## User Roles

| Role | How to set | Access |
|---|---|---|
| `student` | Default on signup | Browse events, register, view QR ticket, upload achievements |
| `organizer` | Admin sets via Manage Users page | All of the above + create/edit events, QR check-in, export CSV, verify payments |
| `admin` | Set directly in Supabase `profiles` table (first time) | Everything + user management + platform-wide stats + achievement review |

---

## Key Features

- **No backend server** — React talks directly to Supabase via the JS SDK. No Render cold starts, no CORS config.
- **RLS-enforced security** — Access control lives in PostgreSQL RLS policies, not middleware.
- **Supabase Auth** — Email/password login, session auto-refresh, no custom JWT code.
- **QR check-in** — Camera-based scanner (`html5-qrcode`) marks attendance in real time.
- **Manual UPI payments** — Organiser uploads QR image; student pays and uploads screenshot; organiser verifies.
- **Achievement tracker** — Students upload monthly certification/workshop proofs; admin reviews and approves/rejects.
- **CSV export** — Client-side CSV generation (no server endpoint needed).
- **Recharts analytics** — Bar, line, and donut charts on the organiser dashboard.
- **Dark mode** — Toggled via `document.documentElement.classList`.

---

## Folder Structure

```
CampusConnect/
├── client/                  # React + Vite SPA (the entire app)
│   └── src/
│       ├── lib/
│       │   ├── supabase.js  # Supabase client singleton
│       │   ├── constants.js # Shared enums (ROLES, CATEGORIES, etc.)
│       │   └── api/         # One file per domain — wraps Supabase queries
│       │       ├── auth.js
│       │       ├── events.js
│       │       ├── registrations.js
│       │       ├── achievements.js
│       │       └── admin.js
│       ├── components/      # Shared/reusable UI components
│       ├── hooks/           # Custom React hooks
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── student/     # Dashboard, EventList, EventDetail
│       │   ├── organizer/   # ManageEvents, CreateEvent, EditEvent, CheckIn, OrganizerRegistrants
│       │   └── admin/       # AdminDashboard, ManageUsers
│       ├── store/           # Zustand — authStore.js only
│       └── utils/           # Pure helpers (CSV export, date formatting)
├── supabase/
│   └── schema.sql           # Full PostgreSQL schema — run this in Supabase SQL Editor
└── .ai/                     # AI agent context files (not shipped to production)
```

---

## License

MIT
