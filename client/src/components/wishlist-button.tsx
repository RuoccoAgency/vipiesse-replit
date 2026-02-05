import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function WishlistButton({ productId, className, size = "md", showText = false }: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      checkIfSaved();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, productId]);

  const checkIfSaved = async () => {
    try {
      const res = await fetch(`/api/my/saved/${productId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleSaved = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Accedi per salvare",
        description: "Devi accedere per salvare i prodotti nei preferiti",
      });
      return;
    }

    const previousState = isSaved;
    const newState = !isSaved;
    
    setIsSaved(newState);
    setIsLoading(true);
    
    try {
      const method = previousState ? "DELETE" : "POST";
      const res = await fetch(`/api/my/saved/${productId}`, { 
        method,
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
        toast({
          title: data.saved ? "Salvato nei preferiti" : "Rimosso dai preferiti",
          description: data.saved 
            ? "Prodotto aggiunto alla tua wishlist" 
            : "Prodotto rimosso dalla wishlist",
        });
      } else {
        setIsSaved(previousState);
        toast({
          title: "Errore",
          description: "Non è stato possibile completare l'operazione",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsSaved(previousState);
      toast({
        title: "Errore",
        description: "Si è verificato un errore di rete",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (isChecking) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md",
          sizeClasses[size],
          className
        )}
      >
        <Loader2 className={cn("animate-spin text-gray-400", iconSizes[size])} />
      </button>
    );
  }

  if (showText) {
    return (
      <button
        onClick={toggleSaved}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
          isSaved 
            ? "bg-red-50 border-red-200 text-red-600" 
            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
          className
        )}
        data-testid={`wishlist-button-${productId}`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Heart className={cn("w-5 h-5", isSaved && "fill-red-500")} />
        )}
        <span className="text-sm font-medium">
          {isSaved ? "Salvato" : "Salva"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleSaved}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110",
        sizeClasses[size],
        isSaved && "bg-red-50",
        className
      )}
      data-testid={`wishlist-button-${productId}`}
    >
      {isLoading ? (
        <Loader2 className={cn("animate-spin text-gray-400", iconSizes[size])} />
      ) : (
        <Heart 
          className={cn(
            iconSizes[size],
            isSaved ? "text-red-500 fill-red-500" : "text-gray-700"
          )} 
        />
      )}
    </button>
  );
}
