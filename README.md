# CampusConnect

A full-stack MERN campus event and communication hub — replacing fragmented WhatsApp groups, notice boards, and manual sign-up forms.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, shadcn/ui, Zustand, React Router v6, Recharts |
| Backend | Node.js, Express, Mongoose, JWT (httpOnly cookie) |
| Database | MongoDB Atlas |
| Auth | bcryptjs + JWT |
| Email | Nodemailer (SMTP) |
| QR | `qrcode` (server), `qrcode.react` (client), `html5-qrcode` (scanner) |
| Jobs | node-cron |

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A MongoDB Atlas cluster (free tier works)
- An SMTP email provider (Gmail app password or Mailtrap for dev)

### 1. Clone & Install

```bash
# Install server deps
cd server && npm install

# Install client deps
cd client && npm install
```

### 2. Configure Environment Variables

**`server/.env`** — fill in your real values:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/campusconnect
JWT_SECRET=a-long-random-secret
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campusconnect.app
```

**`client/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- Backend → http://localhost:5000
- Frontend → http://localhost:5173

## User Roles

| Role | Default |Access |
|---|---|---|
| `student` | ✓ | Browse events, register, view QR, dashboard |
| `organizer` | — | Create/edit/delete events, check-in, export CSV |
| `admin` | — | All of the above + user management + platform stats |

> To make a user an admin, update their `role` field directly in MongoDB, or use the Admin panel once you have one admin account.

## API Overview

| Group | Base Path | Auth |
|---|---|---|
| Auth | `/api/auth` | Public / Cookie |
| Events | `/api/events` | Public + Organizer |
| Registrations | `/api/registrations` | Student + Organizer |
| Admin | `/api/admin` | Admin only |

Full route details are in `server/routes/`.

## Key Features

- **JWT via httpOnly cookie** — authentication without localStorage vulnerabilities
- **QR check-in** — camera-based scanner marks attendance in real time
- **Email notifications** — registration confirmation with QR attachment, 24h reminders, weekly digest
- **Recharts analytics** — line, bar, and donut charts on the organizer dashboard
- **Dark mode** — toggled via `document.documentElement.classList`
- **CSV export** — one-click download of registrant data per event

## Folder Structure

```
CampusConnect/
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/     # Axios instance
│       ├── components/
│       ├── hooks/
│       ├── pages/   # auth | student | organizer | admin
│       ├── store/   # Zustand auth
│       └── utils/
└── server/          # Node.js + Express backend
    ├── config/
    ├── constants/
    ├── controllers/
    ├── jobs/
    ├── middleware/
    ├── models/
    ├── routes/
    └── utils/
```

## Wiring Up Cloudinary (later)

1. Create a free Cloudinary account
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `server/.env`
3. Replace the stub in `server/config/cloudinary.js` with the real `cloudinary-multer-storage` uploader

## License

MIT
