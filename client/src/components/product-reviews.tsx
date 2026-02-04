import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductReview {
  id: number;
  productId: number;
  rating: number;
  name: string | null;
  title: string | null;
  comment: string;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

interface ProductReviewsProps {
  productId: number;
}

function StarRating({ rating, size = "md", interactive = false, onRatingChange }: { 
  rating: number; 
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;
  
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={cn("transition-colors", interactive && "cursor-pointer hover:scale-110")}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRatingChange?.(star)}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= displayRating 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBreakdown({ breakdown, totalReviews }: { breakdown: Record<number, number>; totalReviews: number }) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = breakdown[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <span className="w-12 text-gray-600">{rating} stelle</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (!res.ok) throw new Error("Errore nel caricamento recensioni");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          name: formName || undefined,
          title: formTitle || undefined,
          comment: formComment,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nell'invio");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Recensione inviata!", description: "Grazie per il tuo feedback." });
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setShowForm(false);
      setFormRating(0);
      setFormName("");
      setFormTitle("");
      setFormComment("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) {
      toast({ title: "Errore", description: "Seleziona una valutazione", variant: "destructive" });
      return;
    }
    if (formComment.length < 10) {
      toast({ title: "Errore", description: "Il commento deve avere almeno 10 caratteri", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  const { reviews = [], averageRating = 0, totalReviews = 0, ratingBreakdown = {} } = data || {};

  return (
    <div className="border-t border-gray-200 pt-8 mt-8" data-testid="reviews-section">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recensioni Clienti</h2>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-1 bg-gray-50 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "-"}
            </div>
            <div className="flex justify-center mb-2">
              <StarRating rating={Math.round(averageRating)} size="md" />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {totalReviews} {totalReviews === 1 ? "recensione" : "recensioni"}
            </p>
            <RatingBreakdown breakdown={ratingBreakdown} totalReviews={totalReviews} />
          </div>
        </div>

        <div className="md:col-span-2">
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="mb-6 bg-gray-900 text-white hover:bg-gray-800"
              data-testid="write-review-button"
            >
              Scrivi una Recensione
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-6" data-testid="review-form">
              <h3 className="font-bold text-gray-900 mb-4">La tua recensione</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Valutazione *</label>
                <StarRating rating={formRating} size="lg" interactive onRatingChange={setFormRating} />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome (opzionale)</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder="Il tuo nome"
                    data-testid="review-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titolo (opzionale)</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none"
                    placeholder="Titolo della recensione"
                    data-testid="review-title"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Commento *</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none resize-none"
                  placeholder="Scrivi la tua esperienza con questo prodotto..."
                  data-testid="review-comment"
                />
                <p className="text-xs text-gray-500 mt-1">{formComment.length}/1000 caratteri (min 10)</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  data-testid="submit-review"
                >
                  {submitMutation.isPending ? "Invio..." : "Invia Recensione"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  data-testid="cancel-review"
                >
                  Annulla
                </Button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessuna recensione ancora. Sii il primo a recensire questo prodotto!
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0" data-testid={`review-item-${review.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{review.name || "Cliente"}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                      )}
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
