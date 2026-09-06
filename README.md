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

2. **Apply required patches** (in order) from the [`supabase/patches/`](./supabase/patches/) directory:

   | Patch | Purpose | Required? |
   |---|---|---|
   | [`001_admin_rls_fix.sql`](./supabase/patches/001_admin_rls_fix.sql) | Grants admin role permission to update/delete any profile row (promote/demote users) | ✅ Yes — admin features won't work without this |
   | [`002_profile_phone_bio.sql`](./supabase/patches/002_profile_phone_bio.sql) | Adds `phone` and `bio` columns to `public.profiles` | ✅ Yes — profile popover and registration prefill require these |

   > ⚠️ **Also run this one-time SQL** to backfill `email` into `profiles` for any users created before Branch 1:
   > ```sql
   > UPDATE public.profiles p
   > SET email = u.email
   > FROM auth.users u
   > WHERE p.id = u.id AND p.email IS NULL;
   > ```

3. Go to **Storage → Buckets** and create the following:

   | Bucket | Public? | Used for |
   |---|---|---|
   | `event-banners` | ✅ Public | Event banner images |
   | `payment-qr` | ✅ Public | UPI QR codes shown to students |
   | `payment-screenshots` | ❌ Private | Student payment proof uploads |
   | `achievement-proofs` | ❌ Private | Student certification/workshop proofs |

4. Copy your project URL and anon key from **Project Settings → API**

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

> **Login identifier:** Users can log in with their **Roll No**, **Faculty ID**, or **email address** — not just email.

---

## Key Features

### 🔐 Authentication & Access Control
- **Flexible login** — accepts Roll No, Faculty ID, or email as identifier; resolves to the linked email internally
- **RLS-enforced security** — access control lives in PostgreSQL RLS policies, not middleware
- **Role-based routing** — students, organizers, and admins each see a different dashboard

### 👤 Profile Popover
- Click the avatar in the navbar to open a rich profile panel
- View and edit **phone number**, **bio**, and **interest tags** inline
- Changes are saved to Supabase and reflected immediately in Zustand state

### 📅 Event Management
- Organizers create and edit events with a full-featured form
- Upload banner images to Supabase Storage (public `event-banners` bucket)
- Set capacity, date, venue, category, paid/free, and custom registration fields

### 📋 Registration Form Builder (Google Forms-style)
- Organizers can attach custom fields to any event: `text`, `email`, `number`, `select` (dropdown), `checkbox`, `textarea`
- One-click **Quick Templates**: Team Name, GitHub URL, T-Shirt Size, Dietary Preference, Laptop Needed, Project Abstract
- **Reorder** fields with Move Up / Move Down controls; **Duplicate** any field
- **Live Student Preview** tab — see exactly what the student registration form will look like before saving

### 📝 Smart Registration Modal (Student)
- Roll No and College Email are **auto-populated** from profile — displayed in a verified locked card
- Phone number is **auto-filled** from profile if saved (shows "Auto-filled" badge); otherwise editable
- On successful registration, phone number is **auto-synced back** to the student's profile
- Custom event fields (dropdowns, checkboxes, textareas) render dynamically inside the modal

### 🖼️ Event Banner Lightbox
- Click any event banner on the event detail page to open it **full-screen** in a lightbox overlay
- Close with **ESC**, click outside, or the × button
- "Open in new tab" button available inside the lightbox
- Hover the banner to see the expand hint with gradient overlay

### 📱 QR Check-in (Organizer)
- Camera-based scanner powered by `html5-qrcode` marks attendance in real time
- **Robust token extractor** handles raw UUIDs, URL query params, JSON payloads, and quoted strings from any QR generator
- **2.5 s scan debounce** prevents double-firing from high frame-rate cameras
- **Manual ticket code entry** fallback for low-light or camera issues
- Organizer UI clearly distinguishes a **fresh check-in** from an **already checked-in** ticket

### 🏆 Achievement Tracker
- Students upload monthly certification/workshop proofs (PDF or image)
- Admin reviews and approves or rejects each submission

### 📊 Analytics & Admin
- **Clickable stat cards** on the admin dashboard — "Total Users" navigates to `/admin/users`, "Total Events" to `/admin/events`
- Recharts bar, line, and donut charts on the organizer dashboard
- Admin can **promote / demote** users between roles (requires `001_admin_rls_fix.sql` patch)
- **CSV export** of registrant lists (client-side, no server endpoint needed)

### 💳 Manual UPI Payments
- Organiser uploads a UPI QR image; student pays externally and uploads a screenshot
- Organiser verifies payment screenshot before confirming the registration

### 🌙 Dark Mode
- Toggled via `document.documentElement.classList`

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
│       │   ├── EventForm.jsx        # Full form builder (organizer)
│       │   ├── ImageLightbox.jsx    # Full-screen image overlay
│       │   ├── ProfilePopover.jsx   # Navbar profile panel
│       │   ├── QRScanner.jsx        # Camera check-in + manual fallback
│       │   └── QRDisplay.jsx        # Student ticket QR display
│       ├── hooks/           # Custom React hooks
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── student/     # Dashboard, EventList, EventDetail
│       │   ├── organizer/   # ManageEvents, CreateEvent, EditEvent, CheckIn, OrganizerRegistrants
│       │   └── admin/       # AdminDashboard, ManageUsers
│       ├── store/           # Zustand — authStore.js only
│       └── utils/           # Pure helpers (CSV export, date formatting)
├── supabase/
│   ├── schema.sql           # Full PostgreSQL schema — run this in Supabase SQL Editor
│   └── patches/             # Incremental SQL patches — apply in order after schema.sql
│       ├── 001_admin_rls_fix.sql     # Admin promote/demote RLS policies
│       └── 002_profile_phone_bio.sql # Adds phone + bio to profiles table
```

---

## Database Patches Reference

If you already had the schema running before the latest features were added, apply these patches in order:

```sql
-- 1. Allow admin to update/delete any profile (promote/demote users)
-- File: supabase/patches/001_admin_rls_fix.sql

-- 2. Add phone and bio fields to profiles (profile popover + registration prefill)
-- File: supabase/patches/002_profile_phone_bio.sql

-- 3. Backfill email into profiles for users created before Branch 1
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
```

---

## License

MIT
