import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Swords, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function ActionButtons() {
  const { user } = useAuth();

  return (
    <div className="space-y-3">
      <Link to={user ? '/duels' : '/auth'}>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Swords className="h-4 w-4 text-primary" />
          </div>
          <span>Create lobby duel</span>
        </Button>
      </Link>

      <Link to="/users">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <span>Challenge a friend</span>
        </Button>
      </Link>

      <Link to="/aletheia-rating">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 text-left"
        >
          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Monitor className="h-4 w-4 text-green-500" />
          </div>
          <span>Practice problems</span>
        </Button>
      </Link>
    </div>
  );
}
