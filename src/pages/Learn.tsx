import { useState } from 'react';
import { Search, Filter, Play, BookOpen } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoCard } from '@/components/videos/VideoCard';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { useVideoCategories, useVideos, useVideoProgress, useUpdateVideoProgress, Video } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';

export default function Learn() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  
  const { data: categories = [] } = useVideoCategories();
  const { data: videos = [], isLoading } = useVideos(selectedCategory === 'all' ? undefined : selectedCategory);
  const { data: progress = [] } = useVideoProgress();
  const updateProgress = useUpdateVideoProgress();
  
  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const getVideoProgress = (videoId: string) => {
    return progress.find(p => p.video_id === videoId);
  };
  
  const handleMarkComplete = async () => {
    if (!activeVideo || !user) return;
    await updateProgress.mutateAsync({
      videoId: activeVideo.id,
      watchedSeconds: 0,
      completed: true,
    });
  };
  
  const currentIndex = activeVideo ? filteredVideos.findIndex(v => v.id === activeVideo.id) : -1;
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 gradient-hero pattern-math">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Video Learning Hub</span>
            </div>
            <h1 className="heading-display text-foreground mb-6">
              Master Mathematics Through
              <span className="text-primary"> Expert Guidance</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance">
              Curated video lessons covering olympiad mathematics, from foundational concepts 
              to advanced problem-solving techniques.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search videos by title, topic, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All Videos
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.slug}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.icon} {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Video Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-secondary animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  progress={getVideoProgress(video.id)}
                  onClick={() => setActiveVideo(video)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="heading-subsection text-muted-foreground mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms' : 'Check back soon for new content'}
              </p>
            </div>
          )}

          {/* Progress Summary */}
          {user && progress.length > 0 && (
            <div className="mt-12 p-6 bg-secondary/50 rounded-xl">
              <h3 className="font-semibold mb-2">Your Progress</h3>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-2xl font-bold text-primary">
                    {progress.filter(p => p.completed).length}
                  </span>
                  <span className="text-muted-foreground ml-1">videos completed</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round((progress.filter(p => p.completed).length / videos.length) * 100) || 0}%
                  </span>
                  <span className="text-muted-foreground ml-1">completion rate</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onComplete={user ? handleMarkComplete : undefined}
          onPrevious={currentIndex > 0 ? () => setActiveVideo(filteredVideos[currentIndex - 1]) : undefined}
          onNext={currentIndex < filteredVideos.length - 1 ? () => setActiveVideo(filteredVideos[currentIndex + 1]) : undefined}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < filteredVideos.length - 1}
        />
      )}
    </Layout>
  );
}
