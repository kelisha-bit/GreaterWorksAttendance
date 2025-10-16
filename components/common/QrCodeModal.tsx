import React, { useEffect, useRef } from 'react';
import { Member } from '../../types';
import Modal from './Modal';
import Button from './Button';

// This tells TypeScript that a 'QRCode' variable will be available globally,
// as it's loaded from a script tag in index.html.
declare var QRCode: any;


interface QrCodeModalProps {
    member: Member | null;
    onClose: () => void;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ member, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (member && canvasRef.current) {
            const canvas = canvasRef.current;
            let attempts = 0;
            const maxAttempts = 50; // Try for up to 5 seconds

            const generateQrCode = () => {
                // Check if the QRCode library is loaded and available in the global scope
                if (typeof QRCode !== 'undefined') {
                    // VERIFIED: The member's unique ID is correctly passed to the QR Code generator here.
                    QRCode.toCanvas(canvas, member.id, { width: 256 }, (error: any) => {
                        if (error) console.error('Error generating QR Code:', error);
                    });
                } else if (attempts < maxAttempts) {
                    // If not loaded, wait and try again
                    attempts++;
                    setTimeout(generateQrCode, 100);
                } else {
                    console.error("QRCode library failed to load in time. Make sure it's available globally and the CDN link is correct.");
                }
            };
            
            generateQrCode();
        }
    }, [member]);

    if (!member) return null;
    
    return (
        <Modal isOpen={!!member} onClose={onClose} title={`QR Code for ${member.fullName}`}>
            <div className="flex flex-col items-center justify-center p-4">
                <canvas ref={canvasRef} />
                <p className="mt-4 text-lg font-semibold text-gw-dark">{member.fullName}</p>
                <p className="text-gray-600">{member.id}</p>
                 <Button onClick={onClose} className="mt-6">Close</Button>
            </div>
        </Modal>
    );
};

export default QrCodeModal;