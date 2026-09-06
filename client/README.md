# CampusConnect — Client

React 18 + Vite SPA that powers the CampusConnect frontend.  
See the [root README](../README.md) for full project setup instructions.

## Available Scripts

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Build for production (output → dist/)
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
