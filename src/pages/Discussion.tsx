import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Trash2, Loader2, Plus, Users, Clock, Image, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRole } from '@/hooks/useRoles';
import { useDiscussionTopics, useCreateTopic, useDeleteTopic, DiscussionTopic } from '@/hooks/useDiscussionTopics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Bad words filter
const BAD_WORDS = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard', 'dick', 'pussy', 'cock'];

function filterBadWords(text: string): string {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  image_url: string | null;
  topic_id: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export default function Discussion() {
  const { user } = useAuth();
  const { data: role } = useMyRole();
  const { toast } = useToast();
  const { data: topics = [], isLoading: topicsLoading } = useDiscussionTopics();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();
  
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDeveloper = role === 'developer';

  useEffect(() => {
    if (selectedTopic) {
      fetchMessages(selectedTopic.id);
      
      // Subscribe to realtime updates for this topic
      const channel = supabase
        .channel(`discussion-messages-${selectedTopic.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'discussion_messages',
            filter: `topic_id=eq.${selectedTopic.id}`
          },
          async (payload) => {
            const newMsg = payload.new as Message;
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', newMsg.user_id)
              .maybeSingle();
            
            setMessages(prev => [...prev, { ...newMsg, profile: profile || undefined }]);
            scrollToBottom();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'discussion_messages'
          },
          (payload) => {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTopic]);

  const fetchMessages = async (topicId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussion_messages')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;

      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const messagesWithProfiles = data?.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id)
      })) || [];

      setMessages(messagesWithProfiles);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Max 5MB allowed', variant: 'destructive' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    
    setUploading(true);
    try {
      const ext = imageFile.name.split('.').pop();
      const path = `discussion/${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(path, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user || !selectedTopic) return;

    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const filteredMessage = filterBadWords(newMessage.trim());

      const { error } = await supabase
        .from('discussion_messages')
        .insert({
          user_id: user.id,
          topic_id: selectedTopic.id,
          message: filteredMessage,
          image_url: imageUrl,
        });

      if (error) throw error;
      setNewMessage('');
      clearImage();
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('discussion_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Failed to delete message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    try {
      await createTopic.mutateAsync({ name: newTopicName, description: newTopicDesc });
      setNewTopicName('');
      setNewTopicDesc('');
      setDialogOpen(false);
      toast({ title: 'Topic created!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await deleteTopic.mutateAsync(topicId);
      if (selectedTopic?.id === topicId) {
        setSelectedTopic(null);
        setMessages([]);
      }
      toast({ title: 'Topic deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Community Discussion</span>
            </div>
            <h1 className="heading-section text-foreground mb-2">Discussion Forum</h1>
            <p className="text-muted-foreground">
              Join topic-based discussions with the AletheiaMath community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Topics Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Topics</CardTitle>
                    {isDeveloper && (
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Topic</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Topic Name</Label>
                              <Input
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                placeholder="e.g., Number Theory Discussion"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Description (optional)</Label>
                              <Textarea
                                value={newTopicDesc}
                                onChange={(e) => setNewTopicDesc(e.target.value)}
                                placeholder="What is this topic about?"
                              />
                            </div>
                            <Button onClick={handleCreateTopic} className="w-full">
                              Create Topic
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {topicsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : topics.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground px-4">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No topics yet</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                              selectedTopic?.id === topic.id ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => setSelectedTopic(topic)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{topic.name}</h4>
                                {topic.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {topic.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {topic.message_count || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {topic.last_message_at ? formatDistanceToNow(new Date(topic.last_message_at), { addSuffix: true }) : 'No activity'}
                                  </span>
                                </div>
                              </div>
                              {isDeveloper && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTopic(topic.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                {selectedTopic ? (
                  <>
                    <CardHeader className="border-b pb-3">
                      <CardTitle className="text-lg">{selectedTopic.name}</CardTitle>
                      {selectedTopic.description && (
                        <p className="text-sm text-muted-foreground">{selectedTopic.description}</p>
                      )}
                    </CardHeader>
                    <ScrollArea className="flex-1 p-4">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((msg) => {
                            const isOwnMessage = msg.user_id === user?.id;
                            const canDelete = isOwnMessage || isDeveloper;
                            
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-primary">
                                    {(msg.profile?.full_name || msg.profile?.email || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                                  <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                                    <Link 
                                      to={`/profile?id=${msg.user_id}`}
                                      className="text-sm font-medium hover:underline"
                                    >
                                      {msg.profile?.full_name || msg.profile?.email || 'Anonymous'}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                    </span>
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(msg.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <div
                                    className={`inline-block p-3 rounded-lg ${
                                      isOwnMessage
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary'
                                    }`}
                                  >
                                    {msg.image_url && (
                                      <img 
                                        src={msg.image_url} 
                                        alt="Shared image" 
                                        className="max-w-full rounded-lg mb-2 max-h-64 object-contain"
                                      />
                                    )}
                                    {msg.message && (
                                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={scrollRef} />
                        </div>
                      )}
                    </ScrollArea>
                    
                    <CardContent className="border-t p-4">
                      {user ? (
                        <div className="space-y-2">
                          {imagePreview && (
                            <div className="relative inline-block">
                              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={clearImage}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <form onSubmit={handleSend} className="flex gap-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageSelect}
                              accept="image/*"
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              <Image className="h-4 w-4" />
                            </Button>
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              disabled={sending || uploading}
                            />
                            <Button type="submit" disabled={sending || uploading || (!newMessage.trim() && !imageFile)}>
                              {sending || uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <Link to="/auth">
                            <Button>Sign in to chat</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a topic to start chatting</p>
                      <p className="text-sm">Choose from the topics on the left</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
