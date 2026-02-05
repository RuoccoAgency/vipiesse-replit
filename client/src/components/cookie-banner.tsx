import { useState, useEffect } from "react";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "vipiesse_cookie_consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "all");
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "necessary");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-black/95 backdrop-blur-sm border-t border-neutral-800"
      data-testid="cookie-banner"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Utilizziamo i cookie</h3>
            <p className="text-neutral-400 text-sm">
              Questo sito utilizza cookie tecnici necessari per il funzionamento e cookie di terze parti per migliorare la tua esperienza. 
              Puoi accettare tutti i cookie o solo quelli necessari.{" "}
              <a href="/help/condizioni" className="text-white hover:underline">
                Maggiori informazioni
              </a>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 text-sm font-medium text-white border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors"
              data-testid="cookie-reject"
            >
              Solo necessari
            </button>
            <button
              onClick={acceptAll}
              className="px-6 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors"
              data-testid="cookie-accept"
            >
              Accetta tutti
            </button>
          </div>
          
          <button
            onClick={acceptNecessary}
            className="absolute top-4 right-4 md:static text-neutral-500 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
