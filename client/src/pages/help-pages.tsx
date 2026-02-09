import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard, Truck, RefreshCcw, HelpCircle, Mail, MapPin, Phone, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Compila tutti i campi");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore nell'invio");
      }
      setName("");
      setEmail("");
      setMessage("");
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Errore nell'invio del messaggio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HelpLayout title="Contattaci" subtitle="Il nostro team è a tua disposizione per qualsiasi domanda o richiesta.">
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300" data-testid="popup-contact-success">
          <div className="bg-green-50 border border-green-300 rounded-2xl px-8 py-5 shadow-xl flex items-center gap-4">
            <CheckCircle className="w-7 h-7 text-green-600 shrink-0" />
            <div>
              <p className="font-heading font-bold text-green-900 text-lg">Messaggio inviato!</p>
              <p className="text-green-700 text-sm">Ti risponderemo il prima possibile.</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">I Nostri Recapiti</h3>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-gray-900 mt-1 shrink-0" />
                <p>Via Giglio, 15<br />80026 Casoria (NA)<br />Italia</p>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-gray-900 shrink-0" />
                <p>+39 375 643 1589</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-gray-900 shrink-0" />
                <p>vipiessesales@gmail.com</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">Orari Uffici</h3>
            <p className="text-gray-600">
              Lunedì - Venerdì: 09:00 - 13:30/14:30 - 17:30<br />
              Sabato: Chiuso<br />
              Domenica: Chiuso
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Nome</label>
            <Input data-testid="input-contact-name" placeholder="Il tuo nome" value={name} onChange={e => setName(e.target.value)} className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Email</label>
            <Input data-testid="input-contact-email" type="email" placeholder="tua@email.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-white border-gray-300 rounded-xl h-12 focus:border-gray-900 transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 font-bold ml-1">Messaggio</label>
            <Textarea data-testid="input-contact-message" placeholder="Come possiamo aiutarti?" value={message} onChange={e => setMessage(e.target.value)} className="bg-white border-gray-300 rounded-xl min-h-[150px] focus:border-gray-900 transition-colors p-4 resize-none" />
          </div>
          {errorMsg && (
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
          )}
          <Button data-testid="button-contact-submit" type="button" disabled={isSubmitting} onClick={handleSubmit as any} className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 mt-2 font-heading uppercase tracking-widest text-sm">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Invio...</> : "Invia Messaggio"}
          </Button>
        </div>
      </div>
    </HelpLayout>
  );
}

/* --- AIUTO TAGLIE --- */
export function SizeGuidePage() {
  const sizesUomo = [
    { eu: "39", uk: "5 ½", us: "9 ½", cm: "25" },
    { eu: "39 ½", uk: "6", us: "7", cm: "25,4" },
    { eu: "40", uk: "6 ½", us: "7 ½", cm: "25,8" },
    { eu: "40 ½", uk: "20.9", us: "3", cm: "26,1" },
    { eu: "41", uk: "7", us: "8", cm: "26,4" },
    { eu: "41 ½", uk: "7 ½", us: "8 ½", cm: "26,8" },
    { eu: "42", uk: "8", us: "9", cm: "27,2" },
    { eu: "42 ½", uk: "8 ½", us: "9 ½", cm: "27,6" },
    { eu: "43", uk: "9", us: "10", cm: "28" },
    { eu: "43 ½", uk: "20.9", us: "3", cm: "28,2" },
    { eu: "44", uk: "9 ½", us: "10 ½", cm: "28,5" },
    { eu: "44 ½", uk: "10", us: "11", cm: "28,7" },
    { eu: "45", uk: "10 ½", us: "11 ½", cm: "29" },
    { eu: "45 ½", uk: "20.9", us: "3", cm: "29,4" },
    { eu: "46", uk: "11", us: "12", cm: "29,8" },
    { eu: "46 ½", uk: "11 ½", us: "12 ½", cm: "30,2" },
    { eu: "47", uk: "12", us: "13", cm: "30,7" },
    { eu: "47 ½", uk: "12 ½", us: "13 ½", cm: "31,1" },
    { eu: "48", uk: "13", us: "14", cm: "31,5" },
  ];

  const sizesDonna = [
    { eu: "35", uk: "2 ½", us: "4 ½", cm: "22,3" },
    { eu: "35 ½", uk: "3", us: "5", cm: "22,5" },
    { eu: "36", uk: "3 ½", us: "5 ½", cm: "22,8" },
    { eu: "36 ½", uk: "20.9", us: "3", cm: "22,9" },
    { eu: "37", uk: "4", us: "6", cm: "23,6" },
    { eu: "37 ½", uk: "4 ½", us: "6 ½", cm: "24" },
    { eu: "38", uk: "5", us: "7", cm: "24,3" },
    { eu: "38 ½", uk: "20.9", us: "3", cm: "24,6" },
    { eu: "39", uk: "5 ½", us: "9 ½", cm: "25" },
    { eu: "39 ½", uk: "6", us: "7", cm: "25,4" },
    { eu: "40", uk: "6 ½", us: "7 ½", cm: "25,8" },
    { eu: "40 ½", uk: "20.9", us: "3", cm: "26,1" },
    { eu: "41", uk: "7", us: "9", cm: "26,4" },
    { eu: "41 ½", uk: "7 ½", us: "9 ½", cm: "26,8" },
  ];

  const sizesBambino = [
    { eu: "19", uk: "3", us: "3 ½", cm: "12" },
    { eu: "20", uk: "3 ½", us: "4 ½", cm: "13" },
    { eu: "21", uk: "4 ½", us: "5", cm: "13,8" },
    { eu: "22", uk: "5 ½", us: "6", cm: "14,5" },
    { eu: "23", uk: "6", us: "6 ½", cm: "15,3" },
    { eu: "24", uk: "7", us: "7 ½", cm: "16" },
    { eu: "25", uk: "7 ½", us: "8 ½", cm: "16,5" },
    { eu: "26", uk: "8 ½", us: "9 ½", cm: "17" },
    { eu: "27", uk: "9", us: "10", cm: "17,7" },
    { eu: "28", uk: "10", us: "11", cm: "18,4" },
    { eu: "29", uk: "11", us: "12", cm: "19" },
    { eu: "30", uk: "11 ½", us: "12 ½", cm: "19,5" },
    { eu: "31", uk: "12 ½", us: "13", cm: "20,2" },
    { eu: "32", uk: "13 ½", us: "1", cm: "20,9" },
    { eu: "33", uk: "1", us: "1 ½", cm: "21,5" },
    { eu: "34", uk: "1 ½", us: "2 ½", cm: "22" },
  ];

  const SizeTable = ({ data }: { data: { eu: string; uk: string; us: string; cm: string }[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-200 hover:bg-transparent">
            <TableHead className="text-gray-500">Taglia EU</TableHead>
            <TableHead className="text-gray-500">Taglia UK</TableHead>
            <TableHead className="text-gray-500">Taglia US</TableHead>
            <TableHead className="text-gray-500 text-right">cm</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((size, i) => (
            <TableRow key={i} className="border-gray-200 hover:bg-gray-100">
              <TableCell className="font-bold text-gray-900">{size.eu}</TableCell>
              <TableCell className="text-gray-600">{size.uk}</TableCell>
              <TableCell className="text-gray-600">{size.us}</TableCell>
              <TableCell className="text-right text-gray-600">{size.cm}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <HelpLayout title="Guida alle Taglie" subtitle="Trova la misura perfetta per te consultando le nostre tabelle di conversione.">
      <div className="space-y-12">
        
        {/* UOMO */}
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Scarpe Uomo</h3>
          <SizeTable data={sizesUomo} />
        </div>

        {/* DONNA */}
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Scarpe Donna</h3>
          <SizeTable data={sizesDonna} />
        </div>

        {/* BAMBINO */}
        <div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Scarpe Bambino</h3>
          <SizeTable data={sizesBambino} />
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
          Il pagamento può essere effettuato tramite Carta di Credito, Bonifico Bancario o altri metodi specificati nella sezione "Come Pagare".
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
          <div className="h-10 w-10 flex items-center justify-center text-gray-900 font-bold shrink-0 border border-gray-900 rounded-full">€</div>
          <div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Bonifico Bancario</h3>
            <p className="text-gray-600 mb-2">È possibile pagare tramite bonifico bancario anticipato. L'ordine verrà evaso una volta ricevuto l'accredito.</p>
            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 font-mono">
              IBAN: IT27 F088 5540 0800 0000 0100 040<br/>
              Intestato a: VIPIESSE S.R.L.
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
              <p className="text-gray-600 text-sm mb-4">Consegna in 48 ore lavorative.</p>
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-200 pt-4">
                <span className="text-gray-900">Costo</span>
                <span className="text-gray-900">€5.00 (Gratis &gt; 50€)</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Estero</h4>
              <p className="text-gray-600 text-sm mb-4">Consegna in 3-5 giorni lavorativi.</p>
              <div className="flex justify-between items-center text-sm font-medium border-t border-gray-200 pt-4">
                <span className="text-gray-900">Costo</span>
                <span className="text-gray-900">€5.00</span>
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
                Il reso per il cambio taglia è a carico del cliente. Invitiamo pertanto i nostri clienti a consultare attentamente la guida alle taglie prima di effettuare l’acquisto. Le spese di spedizione per il reso sono a carico del cliente, salvo il caso in cui il prodotto risulti difettoso.
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
