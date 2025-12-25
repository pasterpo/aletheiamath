import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { FriendsList } from '@/components/friends/FriendsList';
import { ChatWindow } from '@/components/friends/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useEffect } from 'react';

export default function Friends() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Friends & Chat</span>
            </div>
            <h1 className="heading-section text-foreground mb-2">Friends</h1>
            <p className="text-muted-foreground">
              Connect with other mathematicians and discuss problems
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Friends List - Always visible on desktop, toggleable on mobile */}
            <div className={`${selectedFriend ? 'hidden md:block' : 'block'}`}>
              <FriendsList
                onSelectFriend={(id, name) => setSelectedFriend({ id, name })}
                selectedFriendId={selectedFriend?.id}
              />
            </div>

            {/* Chat Window - 2 columns on desktop */}
            <div className={`md:col-span-2 ${!selectedFriend ? 'hidden md:block' : 'block'}`}>
              <ChatWindow
                friendId={selectedFriend?.id || null}
                friendName={selectedFriend?.name || ''}
                onBack={() => setSelectedFriend(null)}
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
