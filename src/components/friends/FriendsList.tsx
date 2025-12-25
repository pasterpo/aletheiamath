import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useFriends, useFriendRequests, useRespondToFriendRequest, useRemoveFriend } from '@/hooks/useFriends';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Check, X, MessageCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FriendsListProps {
  onSelectFriend: (friendId: string, friendName: string) => void;
  selectedFriendId?: string | null;
}

export function FriendsList({ onSelectFriend, selectedFriendId }: FriendsListProps) {
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const respondToRequest = useRespondToFriendRequest();
  const removeFriend = useRemoveFriend();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleAccept = async (requestId: string) => {
    try {
      await respondToRequest.mutateAsync({ requestId, accept: true });
      toast({ title: 'Friend request accepted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await respondToRequest.mutateAsync({ requestId, accept: false });
      toast({ title: 'Friend request declined' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredFriends = friends?.filter(f => 
    f.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
          {friends && friends.length > 0 && (
            <Badge variant="secondary">{friends.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-3">
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />

        {/* Friend Requests */}
        {requests && requests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-3 w-3" />
              Friend Requests ({requests.length})
            </p>
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {(req.profile?.full_name || req.profile?.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm truncate max-w-[100px]">
                    {req.profile?.full_name || req.profile?.email || 'User'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0"
                    onClick={() => handleAccept(req.id)}
                    disabled={respondToRequest.isPending}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0"
                    onClick={() => handleDecline(req.id)}
                    disabled={respondToRequest.isPending}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <ScrollArea className="flex-1">
          {friendsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFriends && filteredFriends.length > 0 ? (
            <div className="space-y-1">
              {filteredFriends.map((friend) => {
                const friendUserId = friend.profile?.user_id;
                const isSelected = selectedFriendId === friendUserId;
                
                return (
                  <div 
                    key={friend.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => friendUserId && onSelectFriend(
                      friendUserId, 
                      friend.profile?.full_name || friend.profile?.email || 'User'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {(friend.profile?.full_name || friend.profile?.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <Link 
                          to={`/profile?id=${friendUserId}`}
                          className="text-sm font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {friend.profile?.full_name || friend.profile?.email || 'User'}
                        </Link>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        friendUserId && onSelectFriend(
                          friendUserId,
                          friend.profile?.full_name || friend.profile?.email || 'User'
                        );
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No friends yet</p>
              <p className="text-xs mt-1">Visit profiles to add friends</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
