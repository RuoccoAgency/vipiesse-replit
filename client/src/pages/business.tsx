import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Business() {
  return (
    <div className="container mx-auto px-4 py-20 min-h-screen max-w-4xl">
      <div className="space-y-8">
        <h1 className="text-5xl font-heading font-bold uppercase tracking-tighter">Area Business</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6 text-neutral-300">
             <p className="text-lg leading-relaxed">
               VIPIESSE offre condizioni esclusive per rivenditori, negozianti e grossisti. 
               Accedi alla nostra piattaforma B2B per visualizzare i prezzi all'ingrosso e gestire i tuoi ordini in autonomia.
             </p>
             <ul className="list-disc pl-5 space-y-2 marker:text-white">
               <li>Listini prezzi riservati</li>
               <li>Scontistica per quantità</li>
               <li>Spedizioni prioritarie</li>
               <li>Assistenza dedicata</li>
               <li>Fatturazione elettronica automatica</li>
             </ul>
             
             <div className="pt-8">
               <h3 className="font-heading text-xl mb-4">Sei già cliente?</h3>
               <Link href="/login">
                 <Button className="w-full md:w-auto bg-white text-black hover:bg-gray-200 uppercase font-bold tracking-widest px-8">
                   Accedi al portale B2B
                 </Button>
               </Link>
             </div>
          </div>

          <div className="bg-neutral-900 p-8 border border-neutral-800">
             <h3 className="font-heading text-2xl mb-6">Diventa Rivenditore</h3>
             <form className="space-y-4">
               <div className="space-y-1">
                 <label className="text-xs uppercase tracking-wide text-neutral-500">Ragione Sociale</label>
                 <input type="text" className="w-full bg-black border border-neutral-700 p-3 text-white focus:border-white outline-none" placeholder="Nome Azienda" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs uppercase tracking-wide text-neutral-500">Partita IVA</label>
                 <input type="text" className="w-full bg-black border border-neutral-700 p-3 text-white focus:border-white outline-none" placeholder="IT00000000000" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs uppercase tracking-wide text-neutral-500">Email Aziendale</label>
                 <input type="email" className="w-full bg-black border border-neutral-700 p-3 text-white focus:border-white outline-none" placeholder="email@azienda.it" />
               </div>
               <Button className="w-full mt-4 bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 uppercase font-bold tracking-widest">
                 Invia Richiesta
               </Button>
               <p className="text-xs text-neutral-500 text-center mt-4">
                 Verrai ricontattato entro 24h lavorative.
               </p>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
