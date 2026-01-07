import { CATEGORY_IMAGES } from "@/lib/data";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlider } from "@/components/hero-slider";

export function Home() {
  return (
    <div className="flex flex-col gap-16 pb-20">
      
      {/* SECTION A: HERO SLIDER */}
      <HeroSlider />

      {/* SECTION B: Large Tiles (Donna, Uomo, Bambino) */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            { title: "Donna", img: CATEGORY_IMAGES.donna, link: "/shop/donna" },
            { title: "Uomo", img: CATEGORY_IMAGES.uomo, link: "/shop/uomo" },
            { title: "Bambino", img: CATEGORY_IMAGES.bambino, link: "/shop/bambino" },
          ].map((cat) => (
            <Link key={cat.title} href={cat.link}>
              <div className="relative h-[60vh] overflow-hidden group cursor-pointer">
                <img 
                  src={cat.img} 
                  alt={cat.title} 
                  className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                  <h2 className="text-5xl font-heading font-bold text-white uppercase tracking-tighter border-b-2 border-transparent group-hover:border-white transition-all pb-2">
                    {cat.title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION C: Our Story */}
      <section className="container mx-auto px-4 py-20 bg-neutral-900/50">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <span className="text-sm font-heading uppercase tracking-widest text-neutral-400">Since 1990</span>
          <h2 className="text-3xl md:text-4xl font-heading font-medium text-white leading-tight">
            La nostra storia inizia a Napoli, cuore pulsante della manifattura italiana.
          </h2>
          <p className="text-neutral-400 leading-relaxed font-light text-lg">
            VIPIESSE nasce dalla passione per la calzatura di qualità. Da oltre trent'anni selezioniamo i migliori prodotti per i nostri clienti all'ingrosso, garantendo stile, comfort e prezzi competitivi.
          </p>
          <Link href="/business">
            <Button variant="link" className="text-white hover:text-gray-300 uppercase tracking-widest mt-4">
              Scopri di più <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* SECTION D: Brands Strip */}
      <section className="border-y border-neutral-800 bg-black py-12 overflow-hidden">
        <div className="container mx-auto px-4">
           <p className="text-center text-neutral-500 text-xs uppercase tracking-[0.2em] mb-8">Official Distributors</p>
           <div className="flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap gap-8 md:gap-0">
             {/* Text logos as placeholders for Adidas, Nike, Puma, Inblu */}
             <span className="font-heading text-3xl font-bold">ADIDAS</span>
             <span className="font-heading text-3xl font-bold">NIKE</span>
             <span className="font-heading text-3xl font-bold">PUMA</span>
             <span className="font-heading text-3xl font-bold italic">inblu</span>
             <span className="font-heading text-3xl font-bold">VIPIESSE</span>
           </div>
        </div>
      </section>

      {/* SECTION E: Help (Replaced/Augmented Footer logic, but explicit section requested) */}
      <section className="container mx-auto px-4 py-10">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Contattaci", href: "/help/contattaci" },
              { label: "Aiuto Taglie", href: "/help/taglie" },
              { label: "Condizioni", href: "/help/condizioni" },
              { label: "Spedizioni", href: "/help/spedizioni-resi" },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <div className="p-6 border border-neutral-800 hover:bg-neutral-900 transition-colors cursor-pointer rounded-sm">
                  <span className="font-heading uppercase tracking-wide text-sm">{item.label}</span>
                </div>
              </Link>
            ))}
         </div>
      </section>

    </div>
  );
}
