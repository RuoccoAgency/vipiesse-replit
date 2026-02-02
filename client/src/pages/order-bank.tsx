import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Copy, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BankInfo {
  iban: string;
  accountHolder: string;
  bankName: string;
}

export function OrderBank() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNumber = params.get("order") || "";
  const totalStr = params.get("total") || "0";
  const total = parseFloat(totalStr);
  
  const { toast } = useToast();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payment-config")
      .then(res => res.json())
      .then(data => {
        setBankInfo({
          iban: data.bankIban || "",
          accountHolder: data.bankAccountName || "",
          bankName: data.bankName || ""
        });
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiato!",
        description: `${field} copiato negli appunti`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile copiare negli appunti",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
            Ordine Registrato!
          </h1>
          
          <p className="text-gray-600 text-lg mb-2">
            Il tuo ordine è stato registrato con successo.
          </p>
          
          <p className="text-gray-900 font-medium text-xl">
            Ordine: <span className="font-mono">{orderNumber}</span>
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="font-heading font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dati per il Bonifico Bancario
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Intestatario</p>
                  <p className="font-medium text-gray-900">{bankInfo?.accountHolder || "Caricamento..."}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo?.accountHolder || "", "Intestatario")}
                  className="text-gray-500 hover:text-gray-900"
                >
                  {copiedField === "Intestatario" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">IBAN</p>
                  <p className="font-mono font-medium text-gray-900 text-sm sm:text-base break-all">
                    {bankInfo?.iban || "Caricamento..."}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo?.iban || "", "IBAN")}
                  className="text-gray-500 hover:text-gray-900 flex-shrink-0"
                >
                  {copiedField === "IBAN" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Banca</p>
                  <p className="font-medium text-gray-900">{bankInfo?.bankName || "Caricamento..."}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-yellow-700 mb-1">Causale (importante!)</p>
                  <p className="font-mono font-bold text-yellow-900 text-lg">{orderNumber}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(orderNumber, "Causale")}
                  className="text-yellow-700 hover:text-yellow-900"
                >
                  {copiedField === "Causale" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-700 mb-1">Importo da versare</p>
                  <p className="font-bold text-green-900 text-2xl">€{total.toFixed(2)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(total.toFixed(2), "Importo")}
                  className="text-green-700 hover:text-green-900"
                >
                  {copiedField === "Importo" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Cosa succede ora?</h3>
          
          <div className="space-y-3 text-gray-600">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                1
              </div>
              <p>Effettua il bonifico usando i dati indicati sopra</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                2
              </div>
              <p>Inserisci il numero ordine nella causale per velocizzare la verifica</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                3
              </div>
              <p>Riceverai una conferma via email appena il pagamento sarà verificato</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                4
              </div>
              <p>Il tuo ordine sarà spedito dopo la conferma del pagamento</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-amber-800 text-sm">
            <strong>Nota:</strong> I bonifici possono richiedere 1-3 giorni lavorativi per essere accreditati. 
            Ti invieremo una email di conferma non appena riceveremo il pagamento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button variant="outline" className="w-full sm:w-auto">
              Continua lo Shopping
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800">
              Torna alla Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
