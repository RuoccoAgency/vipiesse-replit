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

      {/* SECTION B: Large Tiles (Donna, Uomo, Bambino) - IMMERSIVE PANELS */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[85vh]">
          {[
            { title: "Donna", img: CATEGORY_IMAGES.donna, link: "/shop/donna", accent: "text-white" },
            { title: "Uomo", img: CATEGORY_IMAGES.uomo, link: "/shop/uomo", accent: "text-white" },
            { title: "Bambino", img: CATEGORY_IMAGES.bambino, link: "/shop/bambino", accent: "text-white" },
          ].map((cat, idx) => (
            <Link key={cat.title} href={cat.link}>
              <div className={`relative h-[70vh] lg:h-full w-full overflow-hidden group cursor-pointer border-r border-black/20 ${idx === 2 ? 'border-r-0' : ''}`}>
                
                {/* Image Scale Effect */}
                <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-110">
                   <img 
                    src={cat.img} 
                    alt={cat.title} 
                    className="h-full w-full object-cover"
                  />
                  {/* Heavy Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 p-8 text-center">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                    Esplora Collezione
                  </span>
                  <h2 className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold text-white uppercase tracking-tighter drop-shadow-2xl group-hover:text-gray-200 transition-colors">
                    {cat.title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION C: Our Story */}
      <section className="container mx-auto px-4 py-32 md:py-48">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          {/* Header */}
          <div className="space-y-6">
            <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-neutral-500">Dal 1990</span>
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white uppercase tracking-widest">
                La Nostra Storia
              </h2>
              <div className="h-[1px] w-24 bg-white/20 mx-auto" />
            </div>
          </div>

          {/* Paragraph */}
          <p className="text-white/80 leading-loose font-light text-lg md:text-xl max-w-2xl mx-auto">
            VIPIESSE nasce a Napoli dalla passione per la calzatura e per il lavoro fatto bene. 
            Da oltre trent’anni selezioniamo e distribuiamo calzature all’ingrosso, unendo stile, comfort e prezzi competitivi. 
            Ogni stagione curiamo collezioni pensate per rivenditori e negozianti, con disponibilità costante, 
            assortimento aggiornato e attenzione ai dettagli.
          </p>

          {/* CTA */}
          <div className="pt-4">
            <Link href="/business">
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-neutral-400 transition-colors cursor-pointer border-b border-transparent hover:border-neutral-400 pb-1">
                Scopri di più <ArrowRight className="ml-2 h-3 w-3" />
              </span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* SECTION D: Brands Strip */}
      <section className="border-y border-neutral-900 bg-black py-16 overflow-hidden">
        <div className="container mx-auto px-4">
           <p className="text-center text-neutral-600 text-xs uppercase tracking-[0.3em] mb-12">Official Distributors</p>
           <div className="flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700 flex-wrap gap-12 md:gap-0 px-4 md:px-20">
             {/* Text logos as placeholders for Adidas, Nike, Puma, Inblu */}
             <span className="font-heading text-4xl font-bold hover:text-white transition-colors cursor-default">ADIDAS</span>
             <span className="font-heading text-4xl font-bold hover:text-white transition-colors cursor-default">NIKE</span>
             <span className="font-heading text-4xl font-bold hover:text-white transition-colors cursor-default">PUMA</span>
             <span className="font-heading text-4xl font-bold italic hover:text-white transition-colors cursor-default">inblu</span>
             <span className="font-heading text-4xl font-bold hover:text-white transition-colors cursor-default">VIPIESSE</span>
           </div>
        </div>
      </section>

      {/* SECTION E: Help Section Redesigned */}
      <section className="container mx-auto px-4 py-32 md:py-48 border-t border-neutral-900">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          {/* Header */}
          <div className="space-y-6">
            <span className="text-xs font-heading font-bold uppercase tracking-[0.2em] text-neutral-500">Supporto Clienti</span>
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white uppercase tracking-widest">
                Serve Aiuto?
              </h2>
              <div className="h-[1px] w-24 bg-white/20 mx-auto" />
            </div>
          </div>

          {/* Intro Text */}
          <p className="text-white/80 leading-loose font-light text-lg md:text-xl max-w-2xl mx-auto">
             Il nostro team è a tua disposizione. Consulta le guide rapide o contattaci per assistenza dedicata sui tuoi ordini.
          </p>

          {/* Clean Links List */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 pt-4">
            {[
              { label: "Contattaci", href: "/help/contattaci" },
              { label: "Guida Taglie", href: "/help/taglie" },
              { label: "Spedizioni e Resi", href: "/help/spedizioni-resi" },
              { label: "Condizioni", href: "/help/condizioni" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <span className="group inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-neutral-400 transition-colors cursor-pointer border-b border-transparent hover:border-neutral-400 pb-1">
                  {item.label} <ArrowRight className="ml-2 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

    </div>
  );
}
