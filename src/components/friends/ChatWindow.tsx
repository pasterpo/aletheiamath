import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation, useSendMessage, useMarkAsRead } from '@/hooks/useDirectMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, MessageCircle, ArrowLeft, Image, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface ChatWindowProps {
  friendId: string | null;
  friendName: string;
  onBack?: () => void;
}

export function ChatWindow({ friendId, friendName, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages, isLoading } = useConversation(friendId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mark messages as read when viewing
  useEffect(() => {
    if (friendId) {
      markAsRead.mutate(friendId);
    }
  }, [friendId, messages?.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

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
      const path = `dm/${user.id}/${Date.now()}.${ext}`;
      
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
      toast({ title: 'Failed to upload image', variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !friendId) return;

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const filteredMessage = filterBadWords(newMessage.trim());

      await sendMessage.mutateAsync({ 
        receiverId: friendId, 
        message: filteredMessage || (imageUrl ? '[Image]' : ''),
        imageUrl 
      });
      setNewMessage('');
      clearImage();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!friendId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a friend to start chatting</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {friendName[0].toUpperCase()}
            </span>
          </div>
          <Link to={`/profile?id=${friendId}`} className="hover:underline">
            <CardTitle className="text-base">{friendName}</CardTitle>
          </Link>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.image_url && (
                      <img 
                        src={msg.image_url} 
                        alt="Shared image" 
                        className="max-w-full rounded-lg mb-2 max-h-48 object-contain"
                      />
                    )}
                    {msg.message && msg.message !== '[Image]' && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Say hi!</p>
          </div>
        )}
      </ScrollArea>

      <CardContent className="border-t p-3">
        <div className="space-y-2">
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-16 rounded-lg" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
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
              placeholder="Type a message..."
              disabled={sendMessage.isPending || uploading}
            />
            <Button type="submit" disabled={sendMessage.isPending || uploading || (!newMessage.trim() && !imageFile)}>
              {sendMessage.isPending || uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
