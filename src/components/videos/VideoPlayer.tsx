import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Video } from '@/hooks/useVideos';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onComplete?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function VideoPlayer({ 
  video, 
  onClose, 
  onComplete,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="w-full max-w-5xl mx-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
          />
        </div>
        
        <div className="mt-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{video.title}</h2>
              {video.category && (
                <p className="text-white/60 mt-1">
                  {video.category.icon} {video.category.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasPrevious && (
                <Button variant="outline" onClick={onPrevious} className="border-white/20 text-white hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              )}
              {hasNext && (
                <Button variant="outline" onClick={onNext} className="border-white/20 text-white hover:bg-white/10">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {onComplete && (
                <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
          {video.description && (
            <p className="text-white/80 mt-4 max-w-3xl">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
