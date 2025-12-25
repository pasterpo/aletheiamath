import { Play, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoProgress } from '@/hooks/useVideos';

interface VideoCardProps {
  video: Video;
  progress?: VideoProgress;
  onClick?: () => void;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  olympiad: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function VideoCard({ video, progress, onClick }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
  
  return (
    <Card 
      className="card-premium cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        {progress?.completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-6 h-6 text-green-500 fill-green-100" />
          </div>
        )}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          {video.category && (
            <span className="text-xs text-muted-foreground">{video.category.icon}</span>
          )}
          <Badge variant="secondary" className={difficultyColors[video.difficulty || 'beginner']}>
            {video.difficulty}
          </Badge>
        </div>
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {video.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
