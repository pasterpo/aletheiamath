import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Brain, Timer, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeControl {
  time: number;
  label: string;
  category: 'bullet' | 'blitz' | 'rapid' | 'classical';
  difficulty: number;
}

const timeControls: TimeControl[] = [
  { time: 30, label: '30s', category: 'bullet', difficulty: 1 },
  { time: 60, label: '1m', category: 'bullet', difficulty: 2 },
  { time: 90, label: '1+30', category: 'bullet', difficulty: 3 },
  { time: 120, label: '2m', category: 'blitz', difficulty: 4 },
  { time: 180, label: '3m', category: 'blitz', difficulty: 5 },
  { time: 300, label: '5m', category: 'blitz', difficulty: 6 },
  { time: 600, label: '10m', category: 'rapid', difficulty: 7 },
  { time: 900, label: '15m', category: 'rapid', difficulty: 8 },
  { time: 1800, label: '30m', category: 'classical', difficulty: 9 },
];

const categoryColors = {
  bullet: 'from-orange-500 to-red-600',
  blitz: 'from-yellow-500 to-orange-500',
  rapid: 'from-green-500 to-emerald-600',
  classical: 'from-blue-500 to-indigo-600',
};

const categoryIcons = {
  bullet: Zap,
  blitz: Flame,
  rapid: Clock,
  classical: Brain,
};

const categoryLabels = {
  bullet: 'Bullet',
  blitz: 'Blitz', 
  rapid: 'Rapid',
  classical: 'Classical',
};

export function QuickPlayGrid() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);

  const handleQuickPlay = async (control: TimeControl) => {
    if (!user) {
      toast.error('Please sign in to play');
      navigate('/auth');
      return;
    }

    setIsSearching(true);
    
    try {
      // Look for an existing waiting duel with matching time control
      const { data: existingDuel, error: searchError } = await supabase
        .from('duels')
        .select('*')
        .eq('status', 'waiting')
        .neq('challenger_id', user.id)
        .limit(1)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingDuel) {
        // Join existing duel
        const { error: joinError } = await supabase
          .from('duels')
          .update({
            opponent_id: user.id,
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', existingDuel.id);

        if (joinError) throw joinError;
        
        toast.success('Opponent found!');
        navigate(`/duel/${existingDuel.id}`);
      } else {
        // Create new duel
        const { data: newDuel, error: createError } = await supabase
          .from('duels')
          .insert({
            challenger_id: user.id,
            status: 'waiting',
          })
          .select()
          .single();

        if (createError) throw createError;
        
        toast.info('Searching for opponent...');
        navigate(`/duel/${newDuel.id}`);
      }
    } catch (error) {
      console.error('Quick play error:', error);
      toast.error('Failed to start duel');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Quick Play</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {timeControls.map((control) => {
          const Icon = categoryIcons[control.category];
          return (
            <button
              key={control.time}
              onClick={() => handleQuickPlay(control)}
              disabled={isSearching}
              className={cn(
                "relative group p-4 rounded-lg transition-all duration-200",
                "bg-secondary/50 hover:bg-secondary",
                "border border-transparent hover:border-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="text-center">
                <span className="text-xl font-bold text-foreground block">
                  {control.label}
                </span>
                <span className={cn(
                  "text-xs font-medium mt-1 flex items-center justify-center gap-1",
                  control.category === 'bullet' && "text-orange-500",
                  control.category === 'blitz' && "text-yellow-500",
                  control.category === 'rapid' && "text-green-500",
                  control.category === 'classical' && "text-blue-500",
                )}>
                  <Icon className="h-3 w-3" />
                  {categoryLabels[control.category]}
                </span>
              </div>
              
              {/* Hover gradient overlay */}
              <div className={cn(
                "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity",
                "bg-gradient-to-br",
                categoryColors[control.category]
              )} />
            </button>
          );
        })}
        
        {/* Custom button */}
        <button
          onClick={() => navigate('/duels')}
          className={cn(
            "p-4 rounded-lg transition-all duration-200",
            "bg-secondary/50 hover:bg-secondary",
            "border border-dashed border-border hover:border-primary/30"
          )}
        >
          <div className="text-center">
            <span className="text-lg font-medium text-muted-foreground">
              Custom
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
