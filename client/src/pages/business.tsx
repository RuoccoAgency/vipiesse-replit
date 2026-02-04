import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, CheckCircle, Building2, Truck, HeadphonesIcon, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const businessSchema = z.object({
  companyName: z.string().min(2, "Ragione sociale richiesta"),
  vatNumber: z.string().min(11, "Partita IVA non valida (minimo 11 caratteri)"),
  email: z.string().email("Email non valida"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional(),
  contactPerson: z.string().optional(),
  businessType: z.string().optional(),
  message: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

export function Business() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      companyName: "",
      vatNumber: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      cap: "",
      contactPerson: "",
      businessType: "",
      message: "",
    },
  });

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/business-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Errore nell'invio della richiesta");
      }

      setIsSuccess(true);
      toast({
        title: "Richiesta inviata!",
        description: "Ti contatteremo entro 24 ore lavorative.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container mx-auto px-4 py-12 max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Richiesta Inviata!
            </h1>
            <p className="text-gray-600 mb-6">
              Grazie per il tuo interesse. Il nostro team commerciale ti contatterà entro 24 ore lavorative per attivare il tuo account business.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              Torna alla Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        <div className="text-center mb-12">
          <span className="text-sm font-heading uppercase tracking-widest text-gray-500">Portale B2B</span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tight text-gray-900 mt-2">
            Area Business
          </h1>
          <p className="text-gray-600 text-lg mt-4 max-w-2xl mx-auto">
            Accedi alla piattaforma dedicata ai rivenditori VIPIESSE.
            Visualizza listini esclusivi, gestisci i tuoi ordini e approfitta delle offerte riservate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Prezzi Riservati</h4>
            <p className="text-gray-500 text-sm">Listini all'ingrosso dedicati per massimizzare il tuo margine.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Spedizioni Prioritarie</h4>
            <p className="text-gray-500 text-sm">Evasione ordini in 24/48h con corriere espresso.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HeadphonesIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-gray-900 font-bold uppercase tracking-wide mb-2">Supporto Dedicato</h4>
            <p className="text-gray-500 text-sm">Account manager personale per ogni tua esigenza commerciale.</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Diventa Rivenditore</h2>
            <p className="text-gray-500">Compila il modulo per richiedere l'accesso al portale B2B.</p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Ragione Sociale *</label>
                <input 
                  {...form.register("companyName")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="Nome Azienda S.r.l."
                  data-testid="input-companyName"
                />
                {form.formState.errors.companyName && (
                  <p className="text-red-500 text-xs">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Partita IVA *</label>
                <input 
                  {...form.register("vatNumber")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="IT00000000000"
                  data-testid="input-vatNumber"
                />
                {form.formState.errors.vatNumber && (
                  <p className="text-red-500 text-xs">{form.formState.errors.vatNumber.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Email Aziendale *</label>
                <input 
                  type="email"
                  {...form.register("email")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="info@azienda.it"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Telefono</label>
                <input 
                  {...form.register("phone")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="+39 02 1234567"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Referente Aziendale</label>
              <input 
                {...form.register("contactPerson")}
                className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                placeholder="Nome e Cognome"
                data-testid="input-contactPerson"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Indirizzo</label>
                <input 
                  {...form.register("address")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="Via Roma 1"
                  data-testid="input-address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">CAP</label>
                <input 
                  {...form.register("cap")}
                  className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                  placeholder="00100"
                  data-testid="input-cap"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Città</label>
              <input 
                {...form.register("city")}
                className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors" 
                placeholder="Roma"
                data-testid="input-city"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Tipo di Attività</label>
              <select 
                {...form.register("businessType")}
                className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                data-testid="select-businessType"
              >
                <option value="">Seleziona...</option>
                <option value="negozio">Negozio di Calzature</option>
                <option value="grande_distribuzione">Grande Distribuzione</option>
                <option value="ecommerce">E-commerce</option>
                <option value="mercato">Mercato/Ambulante</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-500 font-bold">Messaggio (opzionale)</label>
              <textarea 
                {...form.register("message")}
                rows={3}
                className="w-full bg-white border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-colors resize-none" 
                placeholder="Raccontaci della tua attività..."
                data-testid="textarea-message"
              />
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base font-heading uppercase tracking-widest"
              data-testid="button-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                "Invia Richiesta"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Inviando la richiesta accetti i termini di servizio e la politica sulla privacy.
              Verrai ricontattato dal nostro team entro 24 ore lavorative.
            </p>
          </form>
        </div>

        <div className="text-center mt-10">
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
