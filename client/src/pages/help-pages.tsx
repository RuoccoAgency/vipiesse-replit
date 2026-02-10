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

/* --- PRIVACY POLICY --- */
export function PrivacyPolicyPage() {
  return (
    <HelpLayout title="Privacy Policy" subtitle="Informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR).">
      <div className="prose max-w-none text-gray-600">
        <p className="lead text-gray-900">
          VIPIESSE S.r.l. (di seguito "Titolare"), con sede in Via Nazionale delle Puglie, 80026 Casoria (NA), P.IVA 01459591218, in qualità di Titolare del trattamento, informa l'utente ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR) che i dati personali saranno trattati con le seguenti modalità e per le seguenti finalità.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">1. Tipologia di Dati Raccolti</h3>
        <p>
          Durante la navigazione e l'utilizzo del sito, vengono raccolti i seguenti dati personali:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Dati identificativi:</strong> nome, cognome, indirizzo email, numero di telefono, indirizzo di spedizione</li>
          <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, orario di accesso</li>
          <li><strong>Dati di acquisto:</strong> prodotti acquistati, storico ordini, metodo di pagamento utilizzato</li>
          <li><strong>Dati forniti volontariamente:</strong> informazioni inserite nei moduli di contatto o registrazione</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">2. Finalità del Trattamento</h3>
        <p>I dati personali sono trattati per le seguenti finalità:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Gestione degli ordini e delle spedizioni</li>
          <li>Creazione e gestione dell'account utente</li>
          <li>Adempimento degli obblighi contrattuali e fiscali</li>
          <li>Risposta alle richieste di informazioni e assistenza clienti</li>
          <li>Invio di comunicazioni commerciali (previo consenso)</li>
          <li>Miglioramento dell'esperienza di navigazione e del servizio</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">3. Base Giuridica del Trattamento</h3>
        <p>
          Il trattamento dei dati personali si fonda sulle seguenti basi giuridiche: esecuzione del contratto (art. 6, par. 1, lett. b GDPR), adempimento di obblighi legali (art. 6, par. 1, lett. c GDPR), consenso dell'interessato (art. 6, par. 1, lett. a GDPR), legittimo interesse del Titolare (art. 6, par. 1, lett. f GDPR).
        </p>

        <h3 className="font-heading text-gray-900 mt-8">4. Conservazione dei Dati</h3>
        <p>
          I dati personali saranno conservati per il tempo strettamente necessario al raggiungimento delle finalità per cui sono stati raccolti. In particolare: i dati relativi agli ordini saranno conservati per 10 anni per obblighi fiscali; i dati dell'account utente saranno conservati fino alla cancellazione dell'account; i dati di navigazione saranno conservati per un massimo di 12 mesi.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">5. Condivisione dei Dati</h3>
        <p>I dati personali potranno essere condivisi con:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Corrieri per la gestione delle spedizioni (BRT, GLS, ecc.)</li>
          <li>Istituti bancari e fornitori di servizi di pagamento (Stripe)</li>
          <li>Fornitori di servizi IT e hosting</li>
          <li>Autorità competenti su richiesta</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">6. Diritti dell'Interessato</h3>
        <p>L'utente ha il diritto di:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Accedere ai propri dati personali (art. 15 GDPR)</li>
          <li>Ottenere la rettifica dei dati inesatti (art. 16 GDPR)</li>
          <li>Ottenere la cancellazione dei dati (art. 17 GDPR)</li>
          <li>Limitare il trattamento (art. 18 GDPR)</li>
          <li>Opporsi al trattamento (art. 21 GDPR)</li>
          <li>Richiedere la portabilità dei dati (art. 20 GDPR)</li>
          <li>Revocare il consenso in qualsiasi momento</li>
          <li>Proporre reclamo al Garante per la Protezione dei Dati Personali</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">7. Contatti</h3>
        <p>
          Per esercitare i propri diritti o per qualsiasi informazione relativa al trattamento dei dati personali, l'utente può contattare il Titolare all'indirizzo email: <strong>vipiessesales@gmail.com</strong> oppure scrivendo a VIPIESSE S.r.l., Via Nazionale delle Puglie, 80026 Casoria (NA).
        </p>

        <p className="text-sm text-gray-500 mt-8 italic">Ultimo aggiornamento: Febbraio 2026</p>
      </div>
    </HelpLayout>
  );
}

/* --- COOKIE POLICY --- */
export function CookiePolicyPage() {
  return (
    <HelpLayout title="Cookie Policy" subtitle="Informativa sull'utilizzo dei cookie ai sensi della normativa vigente.">
      <div className="prose max-w-none text-gray-600">
        <p className="lead text-gray-900">
          Il presente sito web utilizza cookie e tecnologie simili per garantire il corretto funzionamento delle procedure e migliorare l'esperienza di utilizzo delle applicazioni online.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">1. Cosa Sono i Cookie</h3>
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al browser dell'utente, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva. I cookie sono utilizzati per diverse finalità, hanno caratteristiche diverse e possono essere utilizzati sia dal titolare del sito che da terze parti.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">2. Tipologie di Cookie Utilizzati</h3>

        <h4 className="font-heading text-gray-900 mt-6">Cookie Tecnici (Necessari)</h4>
        <p>Questi cookie sono essenziali per il funzionamento del sito e non possono essere disattivati. Includono:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cookie di sessione:</strong> mantengono la sessione dell'utente attiva durante la navigazione</li>
          <li><strong>Cookie di autenticazione:</strong> permettono l'accesso all'area riservata dell'utente</li>
          <li><strong>Cookie del carrello:</strong> memorizzano i prodotti aggiunti al carrello</li>
          <li><strong>Cookie di preferenze:</strong> memorizzano le scelte dell'utente (es. accettazione cookie)</li>
        </ul>

        <h4 className="font-heading text-gray-900 mt-6">Cookie Analitici</h4>
        <p>
          Utilizziamo cookie analitici per comprendere come gli utenti interagiscono con il sito, raccogliendo informazioni in forma anonima e aggregata sul numero di visitatori, le pagine visitate e il tempo di permanenza.
        </p>

        <h4 className="font-heading text-gray-900 mt-6">Cookie di Terze Parti</h4>
        <p>Il sito potrebbe utilizzare cookie di terze parti per i seguenti servizi:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Stripe:</strong> per l'elaborazione sicura dei pagamenti</li>
          <li><strong>Google Fonts:</strong> per il caricamento dei font del sito</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">3. Gestione dei Cookie</h3>
        <p>
          L'utente può gestire le proprie preferenze sui cookie attraverso le impostazioni del proprio browser. Di seguito i link alle guide per i browser più comuni:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Google Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie</li>
          <li><strong>Mozilla Firefox:</strong> Opzioni → Privacy e sicurezza → Cookie</li>
          <li><strong>Safari:</strong> Preferenze → Privacy → Cookie</li>
          <li><strong>Microsoft Edge:</strong> Impostazioni → Cookie e autorizzazioni sito</li>
        </ul>
        <p>
          La disattivazione dei cookie tecnici potrebbe compromettere l'utilizzo di alcune funzionalità del sito, come il login e il carrello.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">4. Durata dei Cookie</h3>
        <p>I cookie utilizzati dal sito hanno le seguenti durate:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cookie di sessione:</strong> vengono cancellati alla chiusura del browser</li>
          <li><strong>Cookie di autenticazione:</strong> durata massima di 7 giorni</li>
          <li><strong>Cookie di preferenze:</strong> durata massima di 12 mesi</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">5. Contatti</h3>
        <p>
          Per qualsiasi informazione relativa all'utilizzo dei cookie, l'utente può contattarci all'indirizzo email: <strong>vipiessesales@gmail.com</strong>
        </p>

        <p className="text-sm text-gray-500 mt-8 italic">Ultimo aggiornamento: Febbraio 2026</p>
      </div>
    </HelpLayout>
  );
}

/* --- DIRITTO DI RECESSO --- */
export function WithdrawalPage() {
  return (
    <HelpLayout title="Diritto di Recesso" subtitle="Informativa sul diritto di recesso ai sensi del D.Lgs. 206/2005 (Codice del Consumo).">
      <div className="prose max-w-none text-gray-600">
        <p className="lead text-gray-900">
          Ai sensi degli artt. 52 e ss. del Codice del Consumo, il consumatore ha il diritto di recedere dal contratto di acquisto senza dover fornire alcuna motivazione e senza alcuna penalità.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">1. Termini per il Recesso</h3>
        <p>
          Il diritto di recesso può essere esercitato entro <strong>14 giorni</strong> dalla data di ricevimento dei prodotti. Il termine decorre dal giorno in cui il consumatore o un terzo da lui designato acquisisce il possesso fisico dei beni.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">2. Come Esercitare il Recesso</h3>
        <p>Per esercitare il diritto di recesso, il consumatore deve:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Comunicare la propria decisione di recedere dal contratto tramite una dichiarazione esplicita inviata via email a <strong>vipiessesales@gmail.com</strong>, indicando il numero dell'ordine e i prodotti per i quali si intende esercitare il recesso.</li>
          <li>Restituire i prodotti entro <strong>14 giorni</strong> dalla comunicazione di recesso al seguente indirizzo: VIPIESSE S.r.l., Via Nazionale delle Puglie, 80026 Casoria (NA).</li>
        </ol>

        <h3 className="font-heading text-gray-900 mt-8">3. Condizioni dei Prodotti Restituiti</h3>
        <p>I prodotti restituiti devono essere:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Integri e non utilizzati</li>
          <li>Nella confezione originale, completa in tutte le sue parti</li>
          <li>Corredati di tutti gli accessori e le etichette originali</li>
          <li>Accompagnati dalla ricevuta d'acquisto</li>
        </ul>
        <p>
          Il consumatore è responsabile della diminuzione del valore dei beni risultante da una manipolazione dei prodotti diversa da quella necessaria per stabilirne la natura, le caratteristiche e il funzionamento.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">4. Spese di Restituzione</h3>
        <p>
          Le spese di spedizione per la restituzione dei prodotti sono a carico del consumatore, salvo il caso in cui il prodotto risulti difettoso o non conforme a quanto ordinato.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">5. Rimborso</h3>
        <p>
          Il rimborso sarà effettuato entro <strong>14 giorni</strong> dalla data in cui il Titolare è stato informato della decisione del consumatore di recedere dal contratto, utilizzando lo stesso mezzo di pagamento usato per la transazione iniziale, salvo diverso accordo. Il rimborso potrà essere trattenuto fino al ricevimento dei beni restituiti o fino alla dimostrazione da parte del consumatore di aver spedito i beni, a seconda di quale situazione si verifichi per prima.
        </p>
        <p>
          Il rimborso includerà il prezzo dei prodotti e le eventuali spese di consegna standard. Non verranno rimborsate eventuali spese aggiuntive derivanti dalla scelta di una modalità di consegna diversa dalla consegna standard.
        </p>

        <h3 className="font-heading text-gray-900 mt-8">6. Esclusioni</h3>
        <p>Il diritto di recesso è escluso nei seguenti casi:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prodotti confezionati su misura o chiaramente personalizzati</li>
          <li>Prodotti sigillati che non si prestano ad essere restituiti per motivi igienici e che sono stati aperti dopo la consegna</li>
        </ul>

        <h3 className="font-heading text-gray-900 mt-8">7. Contatti</h3>
        <p>
          Per esercitare il diritto di recesso o per qualsiasi domanda, contattaci a: <strong>vipiessesales@gmail.com</strong> oppure al numero <strong>+39 375 643 1589</strong>.
        </p>

        <p className="text-sm text-gray-500 mt-8 italic">Ultimo aggiornamento: Febbraio 2026</p>
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
