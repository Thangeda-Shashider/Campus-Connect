import { useEffect } from 'react';
import { X, ExternalLink, ZoomIn } from 'lucide-react';

export default function ImageLightbox({ src, alt = 'Image preview', isOpen, onClose, title }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        // Prevent body scrolling while modal is active
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !src) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={title || alt}
        >
            {/* Top controls */}
            <div 
                className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none"
            >
                <div className="pointer-events-auto max-w-[70%]">
                    {title && (
                        <h3 className="text-white text-sm sm:text-base font-semibold truncate drop-shadow-md">
                            {title}
                        </h3>
                    )}
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors backdrop-blur-sm"
                        title="Open image in new tab"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Image Container */}
            <div 
                className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform select-none"
                />
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-xs text-white/60 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Press Esc or tap anywhere to close
            </div>
        </div>
    );
}
