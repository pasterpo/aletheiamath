import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateTournament, TournamentType } from '@/hooks/useTournaments';
import { Zap, Swords, Loader2 } from 'lucide-react';

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTournament = useCreateTournament();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType>('arena');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [timePerProblem, setTimePerProblem] = useState('180');
  const [minRating, setMinRating] = useState('0');
  const [maxRating, setMaxRating] = useState('9999');
  const [startTime, setStartTime] = useState('');
  const [totalRounds, setTotalRounds] = useState('5');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: 'Error', description: 'Tournament name is required', variant: 'destructive' });
      return;
    }

    if (!startTime) {
      toast({ title: 'Error', description: 'Start time is required', variant: 'destructive' });
      return;
    }

    try {
      const tournament = await createTournament.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        tournament_type: tournamentType,
        duration_minutes: parseInt(durationMinutes),
        time_per_problem_seconds: parseInt(timePerProblem),
        min_rating: parseInt(minRating),
        max_rating: parseInt(maxRating),
        start_time: new Date(startTime).toISOString(),
        total_rounds: parseInt(totalRounds),
        status: 'scheduled',
      });

      toast({ title: 'Tournament created!', description: 'Players can now register' });
      onOpenChange(false);
      navigate(`/tournaments/${tournament.id}`);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create tournament',
        variant: 'destructive'
      });
    }
  };

  // Default to 1 hour from now
  const getDefaultStartTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0, 0, 0);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="Hourly Algebra Arena"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A fast-paced algebra competition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tournament Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tournamentType === 'arena' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setTournamentType('arena')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Arena
              </Button>
              <Button
                type="button"
                variant={tournamentType === 'swiss' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setTournamentType('swiss')}
              >
                <Swords className="h-4 w-4 mr-2" />
                Swiss
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime || getDefaultStartTime()}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePerProblem">Time/Problem (sec)</Label>
              <Select value={timePerProblem} onValueChange={setTimePerProblem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60s</SelectItem>
                  <SelectItem value="120">2 min</SelectItem>
                  <SelectItem value="180">3 min</SelectItem>
                  <SelectItem value="300">5 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tournamentType === 'swiss' && (
            <div className="space-y-2">
              <Label htmlFor="totalRounds">Number of Rounds</Label>
              <Select value={totalRounds} onValueChange={setTotalRounds}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 rounds</SelectItem>
                  <SelectItem value="5">5 rounds</SelectItem>
                  <SelectItem value="7">7 rounds</SelectItem>
                  <SelectItem value="9">9 rounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minRating">Min Rating</Label>
              <Input
                id="minRating"
                type="number"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRating">Max Rating</Label>
              <Input
                id="maxRating"
                type="number"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTournament.isPending}>
              {createTournament.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tournament
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
