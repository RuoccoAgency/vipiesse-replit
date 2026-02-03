import { Link } from "wouter";

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
            <span>Privacy Policy</span>
            <span>Cookie Policy</span>
            <span>P.IVA 01459591218</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
