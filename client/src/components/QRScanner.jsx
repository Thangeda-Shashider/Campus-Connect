import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera } from 'lucide-react';

/**
 * Camera-based QR code scanner using html5-qrcode.
 * Calls onScan(decodedText) when a QR code is successfully scanned.
 * @param {{ onScan: (text: string) => void, disabled?: boolean }} props
 */
const QRScanner = ({ onScan, disabled = false }) => {
    const scannerRef = useRef(null);
    const containerId = 'qr-scanner-container';

    useEffect(() => {
        if (disabled) return;

        const scanner = new Html5QrcodeScanner(
            containerId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
                showTorchButtonIfSupported: true,
            },
            false
        );

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
            },
            (error) => {
                // Scan errors are normal (camera scanning frames) — suppress them
                void error;
            }
        );

        scannerRef.current = scanner;

        return () => {
            scanner.clear().catch(() => { });
        };
    }, [disabled]);

    if (disabled) {
        return (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-3">
                <Camera className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scanner disabled
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <div id={containerId} />
        </div>
    );
};

export default QRScanner;
