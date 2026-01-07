import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Import generated hero images
import bestSellerHero from '@assets/generated_images/fashion_best_sellers_hero.png';
import summerHero from '@assets/generated_images/summer_season_hero.png';
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
    title: "I più venduti",
    subtitle: "Scopri le icone di stile amate da tutti",
    ctaLabel: "Acquista ora",
    ctaHref: "/shop?filter=bestseller",
    imageUrl: bestSellerHero,
  },
  {
    id: 2,
    title: "Preparati per la stagione",
    subtitle: "La nuova collezione Summer 25 è arrivata",
    ctaLabel: "Acquista ora",
    ctaHref: "/shop?filter=season",
    imageUrl: summerHero,
  },
  {
    id: 3,
    title: "Outlet",
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
    <div className="relative w-full h-[60vh] md:h-[80vh] bg-black overflow-hidden group">
      
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
          <div className="absolute inset-0 bg-black/40" />

          {/* Text Content */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
             >
                <h2 className="text-5xl md:text-7xl font-heading font-bold text-white uppercase tracking-tighter mb-4 drop-shadow-lg">
                  {SLIDES[currentSlide].title}
                </h2>
                <p className="text-lg md:text-xl text-white/90 font-light mb-8 max-w-xl mx-auto drop-shadow-md">
                  {SLIDES[currentSlide].subtitle}
                </p>
                <Link href={SLIDES[currentSlide].ctaHref}>
                  <Button size="lg" className="bg-white text-black hover:bg-neutral-200 font-heading uppercase tracking-widest px-8 py-6 text-lg">
                    {SLIDES[currentSlide].ctaLabel}
                  </Button>
                </Link>
             </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls Overlay (Bottom Right) */}
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

            {/* Prev/Next */}
            <div className="flex gap-1 border-l border-white/20 pl-2">
              <button onClick={handlePrev} className="p-2 hover:bg-white/20 rounded-md transition-colors text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-white/20 rounded-md transition-colors text-white">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
         </div>

         {/* Timer / Progress */}
         <div className="flex items-center gap-2 mt-2 w-[180px]">
           <span className="text-[10px] text-white/70 font-mono w-4">5s</span>
           <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-white"
               animate={{ width: `${progress}%` }}
               transition={{ ease: "linear", duration: 0.1 }} // Smooth, but controlled by React state updates
             />
           </div>
         </div>
      </div>

    </div>
  );
}
