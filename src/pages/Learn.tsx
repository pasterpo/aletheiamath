import { useState } from 'react';
import { Search, Filter, Play, BookOpen, Plus, Trash2, Video, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoCard } from '@/components/videos/VideoCard';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { useVideoCategories, useVideos, useVideoProgress, useUpdateVideoProgress, Video as VideoType } from '@/hooks/useVideos';
import { useAddVideo, useDeleteVideo } from '@/hooks/useVideoManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';

export default function Learn() {
  const { user } = useAuth();
  const { data: role } = useMyRole();
  const { toast } = useToast();
  const isDeveloper = role === 'developer';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<VideoType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state for adding video
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  
  const { data: categories = [] } = useVideoCategories();
  const { data: videos = [], isLoading } = useVideos(selectedCategory === 'all' ? undefined : selectedCategory);
  const { data: progress = [] } = useVideoProgress();
  const updateProgress = useUpdateVideoProgress();
  const addVideo = useAddVideo();
  const deleteVideo = useDeleteVideo();
  
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

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim() || !title.trim()) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    try {
      await addVideo.mutateAsync({
        youtube_id: youtubeUrl,
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty: difficulty || undefined,
        category_id: categoryId || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
      toast({ title: 'Video added successfully!' });
      setDialogOpen(false);
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      setDifficulty('');
      setCategoryId('');
      setTags('');
    } catch (error: any) {
      toast({ title: 'Error adding video', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteVideo.mutateAsync(videoId);
      toast({ title: 'Video deleted' });
    } catch (error: any) {
      toast({ title: 'Error deleting video', description: error.message, variant: 'destructive' });
    }
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
            {isDeveloper && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add YouTube Video</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>YouTube URL or Video ID *</Label>
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or video ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Video title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma separated)</Label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="algebra, equations, imo"
                      />
                    </div>
                    <Button 
                      onClick={handleAddVideo} 
                      className="w-full"
                      disabled={addVideo.isPending}
                    >
                      {addVideo.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Video className="h-4 w-4 mr-2" />
                      )}
                      Add Video
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
                <div key={video.id} className="relative group">
                  <VideoCard
                    video={video}
                    progress={getVideoProgress(video.id)}
                    onClick={() => setActiveVideo(video)}
                  />
                  {isDeveloper && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
