// Apply dark mode BEFORE React renders to avoid flash
const saved = localStorage.getItem('campusconnect-theme');
if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}
