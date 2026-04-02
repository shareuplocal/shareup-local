import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Keyboard, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [manualCode, setManualCode] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      if (isManual) return;
      
      try {
        // Ensure the element exists before initializing
        const readerElement = document.getElementById("reader");
        if (!readerElement) return;

        html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 150 } };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner Error:", err);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setIsManual(true);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode?.clear();
          }).catch(err => console.error("Stop error", err));
        } else {
          try {
            html5QrCode.clear();
          } catch (e) {}
        }
      }
    };
  }, [onScan, isManual]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden relative shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">
            {isManual ? "Saisie Manuelle" : "Scanner le produit"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="relative min-h-[300px] flex flex-col items-center justify-center bg-gray-50">
          {!isManual ? (
            <>
              <div id="reader" className="w-full h-full"></div>
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/90">
                  <p className="text-red-500 font-bold mb-4">{error}</p>
                  <button 
                    onClick={() => setIsManual(true)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Utiliser le clavier
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Code-barres</label>
                <input
                  autoFocus
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Entrez les chiffres..."
                  className="w-full bg-white rounded-2xl px-6 py-4 font-black text-gray-900 focus:ring-4 focus:ring-green-500/10 transition-all outline-none border-2 border-gray-100 placeholder:text-gray-300"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100"
              >
                Valider
              </button>
            </form>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={() => {
              if (!isManual) stopScanner();
              setIsManual(!isManual);
            }}
            className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-green-600 transition-colors"
          >
            {isManual ? <Camera size={14} /> : <Keyboard size={14} />}
            {isManual ? "Retour au scanner" : "Saisie manuelle"}
          </button>
        </div>
      </div>
      
      {!isManual && (
        <p className="text-white/60 mt-8 text-center text-xs font-bold uppercase tracking-widest">
          Placez le code-barres dans le cadre
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;
