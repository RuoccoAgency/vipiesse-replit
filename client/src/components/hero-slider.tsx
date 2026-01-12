import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Import generated hero images
import bestSellerHero from '@assets/WhatsApp_Image_2026-01-12_at_09.02.47_1768217512987.jpeg';
import summerHero from '@assets/WhatsApp_Image_2026-01-12_at_11.22.31_1768217523554.jpeg';
import outletHero from '@assets/generated_images/outlet_sale_hero.png';

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

const SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "I PIÙ VENDUTI",
    subtitle: "Scopri le icone di stile amate da tutti",
    ctaLabel: "Acquista ora",
    ctaHref: "/shop?filter=bestseller",
    imageUrl: bestSellerHero,
  },
  {
    id: 2,
    title: "PREPARATI PER LA STAGIONE",
    subtitle: "La nuova collezione Summer 25 è arrivata",
    ctaLabel: "Acquista ora",
    ctaHref: "/shop?filter=season",
    imageUrl: summerHero,
  },
  {
    id: 3,
    title: "OUTLET",
    subtitle: "Occasioni imperdibili su ultimi pezzi",
    ctaLabel: "Acquista ora",
    ctaHref: "/outlet",
    imageUrl: outletHero,
  },
];

const AUTOPLAY_DURATION = 5000; // 5 seconds

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-rotation & Progress logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isPlaying) {
      const startTime = Date.now();
      const endTime = startTime + AUTOPLAY_DURATION;

      // Progress bar ticker (smooth update)
      progressInterval = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        const newProgress = 100 - (remaining / AUTOPLAY_DURATION) * 100;

        if (newProgress >= 100) {
          setProgress(0);
        } else {
          setProgress(newProgress);
        }
      }, 50);

      // Slide change
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        setProgress(0); // Reset progress immediately on slide change
      }, AUTOPLAY_DURATION);
    }

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentSlide]); // Restart timer when slide changes or pause toggled

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    setProgress(0);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="relative w-full h-[90vh] md:h-screen bg-black overflow-hidden group">
      
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Image */}
          <img
            src={SLIDES[currentSlide].imageUrl}
            alt={SLIDES[currentSlide].title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Text Content */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 pt-20">
             <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
             >
                <h2 className="text-6xl md:text-9xl font-heading font-bold text-white uppercase tracking-tighter mb-6 drop-shadow-xl leading-none">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-xl md:text-2xl text-white/90 font-light mb-10 max-w-2xl mx-auto drop-shadow-md tracking-wide">
                  {SLIDES[currentSlide].subtitle}
                </p>
                <Link href={SLIDES[currentSlide].ctaHref}>
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-200 font-heading uppercase tracking-widest px-10 py-7 text-xl transition-transform hover:scale-105">
                    {SLIDES[currentSlide].ctaLabel}
                  </Button>
                </Link>
             </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Main Arrows (Vertical Center, Edges) */}
      <div className="absolute inset-y-0 left-0 flex items-center px-4 md:px-8 z-30 pointer-events-none">
        <button 
          onClick={handlePrev} 
          className="pointer-events-auto p-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all hover:scale-110 group-hover:opacity-100 opacity-0 md:opacity-100"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-8 w-8 md:h-12 md:w-12" strokeWidth={1.5} />
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center px-4 md:px-8 z-30 pointer-events-none">
        <button 
          onClick={handleNext} 
          className="pointer-events-auto p-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all hover:scale-110 group-hover:opacity-100 opacity-0 md:opacity-100"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-8 w-8 md:h-12 md:w-12" strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom Right Controls (Play/Pause + Timer) */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end gap-2">
         {/* Slide Counter */}
         <div className="text-white/80 font-mono text-xs mb-2 bg-black/50 px-2 py-1 rounded">
            {currentSlide + 1} / {SLIDES.length}
         </div>

         <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay} 
              className="p-2 hover:bg-white/20 rounded-md transition-colors text-white"
              title={isPlaying ? "Pausa" : "Riprendi"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
         </div>

         {/* Timer / Progress */}
         <div className="flex items-center gap-2 mt-2 w-[180px]">
           <span className="text-[10px] text-white/70 font-mono w-4">5s</span>
           <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-white"
               animate={{ width: `${progress}%` }}
               transition={{ ease: "linear", duration: 0.1 }}
             />
           </div>
         </div>
      </div>

    </div>
  );
}
