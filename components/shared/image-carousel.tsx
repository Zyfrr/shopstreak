"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  productName: string;
}

export function ImageCarousel({ images, productName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const nextImage = useCallback(() => {
    if (isTransitioning || images.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const prevImage = useCallback(() => {
    if (isTransitioning || images.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [images.length, isTransitioning]);

  const goToImage = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Auto-slide functionality
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length, nextImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setZoomImage(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevImage, nextImage]);

  if (!images || images.length === 0) {
    return (
      <div className="bg-muted border border-border rounded-xl h-96 flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Container */}
        <div className="relative bg-card border border-border rounded-xl overflow-hidden h-96 md:h-[500px] group">
          {/* Main Image with Slide Animation */}
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              className={`w-full h-full object-contain p-4 transition-transform duration-300 ${
                isTransitioning ? 'scale-105' : 'scale-100'
              }`}
            />
            
            {/* Zoom Button */}
            <button
              onClick={() => setZoomImage(images[currentIndex])}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/90 z-10"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                disabled={isTransitioning}
                className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 md:p-3 rounded-full hover:bg-black/90 transition-all duration-300 opacity-100 md:opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={nextImage}
                disabled={isTransitioning}
                className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 md:p-3 rounded-full hover:bg-black/90 transition-all duration-300 opacity-100 md:opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm z-10">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Progress Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div 
                className="h-full bg-white transition-all duration-5000 ease-linear"
                style={{ 
                  width: isTransitioning ? '100%' : '0%',
                  animation: isTransitioning ? 'progress 5s linear' : 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Thumbnail Strip with Modern Scroll */}
        {images.length > 1 && (
          <div className="relative px-2">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  disabled={isTransitioning}
                  className={`flex-shrink-0 relative border-2 rounded-lg overflow-hidden transition-all duration-300 ${
                    currentIndex === index 
                      ? "border-primary scale-105 shadow-lg" 
                      : "border-border hover:border-primary/50 hover:scale-102"
                  } ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
                >
                  <img
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-20 h-20 object-cover"
                  />
                  {/* Active indicator dot */}
                  {currentIndex === index && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Gradient overlays for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={zoomImage}
              alt={`${productName} - Zoomed`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 rotate-90" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
}