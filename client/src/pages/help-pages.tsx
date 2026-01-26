import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard, Truck, RefreshCcw, HelpCircle, Mail, MapPin, Phone } from "lucide-react";

/* --- LAYOUT WRAPPER --- */
const HelpLayout = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
  <div className="container mx-auto px-4 py-32 min-h-screen max-w-4xl pt-32">
    <div className="text-center mb-16 space-y-4">
      <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter text-gray-900">
        {title}
      </h1>
      {subtitle && <p className="text-gray-600 text-lg max-w-2xl mx-auto">{subtitle}</p>}
    </div>
    <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-8 md:p-12">
      {children}
    </div>
  </div>
);

/* --- CONTATTACI --- */
export function ContactPage() {
  return (
    <HelpLayout title="Contattaci" subtitle="Il nostro team è a tua disposizione per qualsiasi domanda o richiesta.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">I Nostri Recapiti</h3>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-gray-900 mt-1 shrink-0" />
                <p>Via Nazionale delle Puglie<br />80026 Casoria (NA)<br />Italia</p>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-gray-900 shrink-0" />
                <p>+39 081 123 4567</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-gray-900 shrink-0" />
                <p>info@vipiesse.it</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">Orari Uffici</h3>
            <p className="text-gray-600">
              Lunedì - Venerdì: 09:00 - 18:00<br />
              Sabato: 09:00 - 13:00<br />
              Domenica: Chiuso
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Nome</label>
            <Input placeholder="Il tuo nome" className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email</label>
            <Input type="email" placeholder="tua@email.com" className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Messaggio</label>
            <Textarea placeholder="Come possiamo aiutarti?" className="bg-white border-gray-300 rounded-xl min-h-[150px] focus:border-gray-900 transition-colors p-4 resize-none" />
          </div>
          <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 mt-2 font-heading uppercase tracking-widest text-sm">
            Invia Messaggio
          </Button>
        </form>
      </div>
    </HelpLayout>
  );
}

/* --- AIUTO TAGLIE --- */
export function SizeGuidePage() {
  return (
    <HelpLayout title="Guida alle Taglie" subtitle="Trova la misura perfetta per te consultando le nostre tabelle di conversione.">
      <div className="space-y-12">
        
        {/* DONNA */}
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Donna</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500">EU</TableHead>
                  <TableHead className="text-gray-500">US</TableHead>
                  <TableHead className="text-gray-500">UK</TableHead>
                  <TableHead className="text-gray-500 text-right">CM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[36, 37, 38, 39, 40, 41].map((size, i) => (
                  <TableRow key={size} className="border-gray-200 hover:bg-gray-100">
                    <TableCell className="font-bold text-gray-900">{size}</TableCell>
                    <TableCell className="text-gray-600">{size - 30}</TableCell>
                    <TableCell className="text-gray-600">{size - 32}</TableCell>
                    <TableCell className="text-right text-gray-600">{22 + (i * 0.5)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* UOMO */}
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Uomo</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-500">EU</TableHead>
                  <TableHead className="text-gray-500">US</TableHead>
                  <TableHead className="text-gray-500">UK</TableHead>
                  <TableHead className="text-gray-500 text-right">CM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[40, 41, 42, 43, 44, 45, 46].map((size, i) => (
                  <TableRow key={size} className="border-gray-200 hover:bg-gray-100">
                    <TableCell className="font-bold text-gray-900">{size}</TableCell>
                    <TableCell className="text-gray-600">{size - 33}</TableCell>
                    <TableCell className="text-gray-600">{size - 34}</TableCell>
                    <TableCell className="text-right text-gray-600">{25 + (i * 0.5)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-start gap-4">
          <HelpCircle className="text-gray-900 h-6 w-6 shrink-0 mt-1" />
          <div>
            <h4 className="text-gray-900 font-bold mb-2">Come misurare il piede</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Posiziona il piede su un foglio di carta, fai un segno all'estremità del tallone e uno all'estremità dell'alluce.
              Misura la distanza tra i due segni e confrontala con la colonna CM. Ti consigliamo di scegliere una taglia in più se sei indeciso.
            </p>
          </div>
        </div>

      </div>
    </HelpLayout>
  );
}

/* --- CONDIZIONI VENDITA --- */
export function TermsPage() {
  return (
    <HelpLayout title="Condizioni di Vendita" subtitle="Leggi attentamente le condizioni che regolano l'acquisto dei nostri prodotti.">
      <div className="prose max-w-none text-gray-600">
        <p className="lead text-gray-900">
          Le presenti Condizioni Generali di Vendita regolano l'offerta e la vendita di prodotti tramite il sito web VIPIESSE.
        </p>
        
        <h3 className="font-heading text-gray-900 mt-8">1. Ambito di Applicazione</h3>
        <p>
          La vendita di prodotti tramite il Sito costituisce un contratto a distanza disciplinato dal Capo I, Titolo III (artt. 45 e ss.) del Decreto Legislativo 6 settembre 2005, n. 206 ("Codice del Consumo") e dal Decreto Legislativo 9 aprile 2003, n. 70, contenente la disciplina del commercio elettronico.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">2. Accettazione delle Condizioni</h3>
        <p>
          Effettuando un ordine nelle varie modalità previste, il Cliente dichiara di aver preso visione di tutte le indicazioni a lui fornite durante la procedura d'acquisto, e di accettare integralmente le condizioni generali e di pagamento di seguito trascritte.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">3. Prezzi e Prodotti</h3>
        <p>
          Tutti i prezzi di vendita dei prodotti esposti sul Sito sono indicati in Euro e sono comprensivi di IVA, salvo diversa indicazione (es. Area Business). Le spese di spedizione non sono comprese nel prezzo d'acquisto, ma sono indicate e calcolate al momento della conclusione del processo di acquisto prima dell'effettuazione del pagamento.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">4. Modalità di Pagamento</h3>
        <p>
          Il pagamento può essere effettuato tramite Carta di Credito, PayPal, Bonifico Bancario o altri metodi specificati nella sezione "Come Pagare".
        </p>
      </div>
    </HelpLayout>
  );
}

/* --- COME PAGARE --- */
export function PaymentsPage() {
  return (
    <HelpLayout title="Metodi di Pagamento" subtitle="Offriamo diverse soluzioni per garantire pagamenti sicuri e veloci.">
      <div className="grid grid-cols-1 gap-6">
        
        <div className="flex items-start gap-6 p-6 rounded-2xl border border-gray-200 bg-white">
          <CreditCard className="h-10 w-10 text-gray-900 shrink-0" />
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Carte di Credito / Debito</h3>
            <p className="text-gray-600 mb-4">Accettiamo tutte le principali carte di credito e debito (Visa, Mastercard, American Express, Maestro).</p>
            <div className="flex gap-2">
               <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-700 font-medium">VISA</div>
               <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-700 font-medium">Mastercard</div>
               <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-700 font-medium">Amex</div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-6 p-6 rounded-2xl border border-gray-200 bg-white">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">P</div>
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">PayPal</h3>
            <p className="text-gray-600">Paga in modo rapido e sicuro utilizzando il tuo account PayPal. È possibile pagare anche in 3 rate senza interessi.</p>
          </div>
        </div>

        <div className="flex items-start gap-6 p-6 rounded-2xl border border-gray-200 bg-white">
          <div className="h-10 w-10 flex items-center justify-center text-gray-900 font-bold shrink-0 border border-gray-900 rounded-full">€</div>
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Bonifico Bancario</h3>
            <p className="text-gray-600 mb-2">È possibile pagare tramite bonifico bancario anticipato. L'ordine verrà evaso una volta ricevuto l'accredito.</p>
            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 font-mono">
              IBAN: IT00 X000 0000 0000 0000 0000 000<br/>
              Intestato a: VIPIESSE S.r.l.
            </div>
          </div>
        </div>

      </div>
    </HelpLayout>
  );
}

/* --- SPEDIZIONI E RESI --- */
export function ShippingPage() {
  return (
    <HelpLayout title="Spedizioni e Resi" subtitle="Tutto quello che devi sapere sulla consegna e sulla nostra politica di reso.">
      <div className="space-y-12">
        
        {/* SPEDIZIONI */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <Truck className="h-8 w-8 text-gray-900" />
            <h2 className="text-3xl font-heading font-bold text-gray-900 uppercase tracking-tight">Spedizioni</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Italia (Standard)</h4>
              <p className="text-gray-600 text-sm mb-4">Consegna in 3-5 giorni lavorativi.</p>
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-200 pt-4">
                <span className="text-gray-900">Costo</span>
                <span className="text-gray-900">€5.00 (Gratis &gt; 50€)</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Italia (Express)</h4>
              <p className="text-gray-600 text-sm mb-4">Consegna in 24/48 ore lavorative.</p>
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-200 pt-4">
                <span className="text-gray-900">Costo</span>
                <span className="text-gray-900">€9.00</span>
              </div>
            </div>
          </div>
        </section>

        {/* RESI */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <RefreshCcw className="h-8 w-8 text-gray-900" />
            <h2 className="text-3xl font-heading font-bold text-gray-900 uppercase tracking-tight">Politica di Reso</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-200">
              <AccordionTrigger className="text-gray-900 hover:text-gray-600">Quanto tempo ho per fare un reso?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Hai a disposizione 14 giorni dalla data di ricezione dell'ordine per richiedere il reso di uno o più articoli.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-gray-200">
              <AccordionTrigger className="text-gray-900 hover:text-gray-600">Il reso è gratuito?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Il primo reso per cambio taglia è gratuito in Italia. Per i rimborsi completi, le spese di spedizione del reso sono a carico del cliente, a meno che il prodotto non sia difettoso.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-gray-200">
              <AccordionTrigger className="text-gray-900 hover:text-gray-600">Come effettuo un reso?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Accedi alla tua area personale, vai nella sezione "I miei ordini" e seleziona "Richiedi Reso". Segui le istruzioni per stampare l'etichetta e prenotare il ritiro.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </div>
    </HelpLayout>
  );
}
