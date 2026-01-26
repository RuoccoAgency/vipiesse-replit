import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Business() {
  return (
    <div className="container mx-auto px-4 py-32 min-h-screen pt-32">
      <div className="max-w-2xl mx-auto space-y-12 text-center">
        
        {/* Header Section */}
        <div className="space-y-6">
          <span className="text-sm font-heading uppercase tracking-widest text-gray-500">Portale B2B</span>
          <h1 className="text-5xl md:text-6xl font-heading font-bold uppercase tracking-tighter text-gray-900">
            Area Business
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl mx-auto">
            Accedi alla piattaforma dedicata ai rivenditori VIPIESSE.
            Visualizza listini esclusivi, gestisci i tuoi ordini e approfitta delle offerte riservate.
          </p>
        </div>

        {/* Benefits Grid (Simplified) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-gray-200">
          <div className="p-4">
             <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Prezzi Riservati</h4>
             <p className="text-gray-500 text-sm">Listini all'ingrosso dedicati per massimizzare il tuo margine.</p>
          </div>
          <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200">
             <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Spedizioni Prioritarie</h4>
             <p className="text-gray-500 text-sm">Evasione ordini in 24/48h con corriere espresso.</p>
          </div>
          <div className="p-4 border-t md:border-t-0 md:border-l border-gray-200">
             <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Supporto Dedicato</h4>
             <p className="text-gray-500 text-sm">Account manager personale per ogni tua esigenza commerciale.</p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-gray-50 border border-gray-200 p-8 md:p-12 rounded-[2rem] text-left">
           <div className="mb-8 text-center">
             <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">Diventa Rivenditore</h3>
             <p className="text-gray-500 text-sm">Compila il modulo per richiedere l'accesso.</p>
           </div>
           
           <form className="space-y-5 max-w-md mx-auto">
             <div className="space-y-2">
               <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Ragione Sociale</label>
               <input type="text" className="w-full bg-white border border-gray-300 p-4 rounded-xl text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" placeholder="Nome Azienda S.r.l." />
             </div>
             <div className="space-y-2">
               <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Partita IVA</label>
               <input type="text" className="w-full bg-white border border-gray-300 p-4 rounded-xl text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" placeholder="IT00000000000" />
             </div>
             <div className="space-y-2">
               <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email Aziendale</label>
               <input type="email" className="w-full bg-white border border-gray-300 p-4 rounded-xl text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" placeholder="amministrazione@azienda.it" />
             </div>
             
             <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 mt-6 h-14 text-lg">
               INVIA RICHIESTA
             </Button>

             <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
               Inviando la richiesta accetti i termini di servizio e la politica sulla privacy.
               Verrai ricontattato dal nostro team entro 24 ore lavorative.
             </p>
           </form>
        </div>

        {/* Login Link */}
        <div className="pt-8">
          <p className="text-gray-500">Sei già un nostro partner?</p>
          <Link href="/login">
            <Button variant="link" className="text-gray-900 hover:text-gray-600 uppercase tracking-widest font-bold mt-2">
              Accedi al Portale
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
