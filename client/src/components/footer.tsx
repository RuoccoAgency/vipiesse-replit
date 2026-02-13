import { Link } from "wouter";
import { Instagram } from "lucide-react";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.18 8.18 0 0 0 4.76 1.52V6.87a4.84 4.84 0 0 1-1-.18z"/>
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white pt-16 pb-8 border-t border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="font-heading text-2xl font-bold">VIPIESSE</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Dal 1990 il punto di riferimento per l'ingrosso di calzature in Italia. Qualità, stile e convenienza.
            </p>
            <div className="text-sm text-neutral-500">
              <p>Via Nazionale delle Puglie</p>
              <p>80026 Casoria (NA)</p>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://www.instagram.com/vipiessesrl/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" data-testid="link-instagram" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/vipiessepantofole?locale=it_IT" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" data-testid="link-facebook" aria-label="Facebook">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@vipiesse_pantofole" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors" data-testid="link-tiktok" aria-label="TikTok">
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-heading text-lg mb-6 text-white">Esplora</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/shop/donna" className="hover:text-white transition-colors">Donna</Link></li>
              <li><Link href="/shop/uomo" className="hover:text-white transition-colors">Uomo</Link></li>
              <li><Link href="/shop/bambino" className="hover:text-white transition-colors">Bambino</Link></li>
              <li><Link href="/outlet" className="hover:text-red-500 transition-colors">Outlet</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h4 className="font-heading text-lg mb-6 text-white">Serve Aiuto?</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li><Link href="/help/contattaci" className="hover:text-white transition-colors">Contattaci</Link></li>
              <li><Link href="/help/taglie" className="hover:text-white transition-colors">Guida alle Taglie</Link></li>
              <li><Link href="/help/condizioni" className="hover:text-white transition-colors">Condizioni di Vendita</Link></li>
              <li><Link href="/help/pagamenti" className="hover:text-white transition-colors">Metodi di Pagamento</Link></li>
              <li><Link href="/help/spedizioni-resi" className="hover:text-white transition-colors">Spedizioni e Resi</Link></li>
              <li><Link href="/diritto-recesso" className="hover:text-white transition-colors">Diritto di Recesso</Link></li>
            </ul>
          </div>

          {/* Newsletter / Shipping Rule */}
          <div>
            <h4 className="font-heading text-lg mb-6 text-white">Spedizioni</h4>
            <div className="p-4 bg-neutral-800 border border-neutral-700 rounded-sm">
              <p className="text-sm text-white font-medium mb-1">Costi di Spedizione</p>
              <p className="text-xs text-neutral-400">
                Sotto i 50€: <span className="text-white">5€</span><br/>
                Oltre i 50€: <span className="text-green-400 font-bold">GRATIS</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500">
          <p>&copy; 2026 VIPIESSE S.r.l. Tutti i diritti riservati.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <span>P.IVA 01459591218</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
