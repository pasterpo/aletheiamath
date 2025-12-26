import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TournamentParticipant {
  id: string;
  user_id: string;
  tournament_id: string;
  status: string;
  score: number;
  lobby_since: string | null;
  last_opponent_id: string | null;
  user_stats?: { rating: number };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, tournament_id } = await req.json();
    console.log(`Tournament engine action: ${action} for tournament: ${tournament_id}`);

    if (action === "pair_arena") {
      // Arena pairing logic - runs every few seconds
      const result = await pairArenaPlayers(supabaseClient, tournament_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_swiss_round") {
      const result = await generateSwissRound(supabaseClient, tournament_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start_tournament") {
      const result = await startTournament(supabaseClient, tournament_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "end_tournament") {
      const result = await endTournament(supabaseClient, tournament_id);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "process_game_result") {
      const { game_id, tournament_ended } = await req.json();
      const result = await processGameResult(supabaseClient, game_id, tournament_ended);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "tick") {
      // Periodic tick - check tournaments that need actions
      const result = await handleTick(supabaseClient);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Tournament engine error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function pairArenaPlayers(supabase: any, tournamentId: string) {
  console.log("Starting arena pairing for tournament:", tournamentId);

  // Get all players in lobby
  const { data: participants, error: participantsError } = await supabase
    .from("tournament_participants")
    .select("*, user_stats:user_stats(rating)")
    .eq("tournament_id", tournamentId)
    .eq("status", "in_lobby")
    .order("lobby_since", { ascending: true });

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    throw participantsError;
  }

  if (!participants || participants.length < 2) {
    console.log("Not enough players in lobby:", participants?.length);
    return { paired: 0 };
  }

  // Get a random problem
  const { data: problems } = await supabase
    .from("problems")
    .select("id")
    .eq("is_published", true);

  if (!problems || problems.length === 0) {
    console.error("No problems available");
    return { error: "No problems available" };
  }

  const pairings: Array<{ playerA: TournamentParticipant; playerB: TournamentParticipant }> = [];
  const paired = new Set<string>();

  // Sort by rating for better pairing
  const sortedParticipants = participants.sort((a: TournamentParticipant, b: TournamentParticipant) => {
    const ratingA = a.user_stats?.rating || 1000;
    const ratingB = b.user_stats?.rating || 1000;
    return ratingA - ratingB;
  });

  // Pair adjacent players by rating
  for (let i = 0; i < sortedParticipants.length - 1; i++) {
    const playerA = sortedParticipants[i];
    
    if (paired.has(playerA.user_id)) continue;

    // Find a suitable opponent
    for (let j = i + 1; j < sortedParticipants.length; j++) {
      const playerB = sortedParticipants[j];
      
      if (paired.has(playerB.user_id)) continue;
      
      // Check if they played recently (anti-farming)
      const waitTime = playerA.lobby_since 
        ? (Date.now() - new Date(playerA.lobby_since).getTime()) / 1000 
        : 0;
      
      // Allow rematch after 25 seconds of waiting
      if (playerA.last_opponent_id === playerB.user_id && waitTime < 25) {
        continue;
      }

      // Rating gap check (widens over time)
      const ratingA = playerA.user_stats?.rating || 1000;
      const ratingB = playerB.user_stats?.rating || 1000;
      const ratingGap = Math.abs(ratingA - ratingB);
      const allowedGap = 200 + Math.floor(waitTime / 10) * 100; // Widens by 100 every 10 seconds

      if (ratingGap <= allowedGap) {
        pairings.push({ playerA, playerB });
        paired.add(playerA.user_id);
        paired.add(playerB.user_id);
        break;
      }
    }
  }

  console.log(`Creating ${pairings.length} games`);

  // Create games for each pairing
  for (const { playerA, playerB } of pairings) {
    const problemId = problems[Math.floor(Math.random() * problems.length)].id;

    // Create the game
    const { data: game, error: gameError } = await supabase
      .from("tournament_games")
      .insert({
        tournament_id: tournamentId,
        player_a_id: playerA.user_id,
        player_b_id: playerB.user_id,
        problem_id: problemId,
        status: "countdown",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (gameError) {
      console.error("Error creating game:", gameError);
      continue;
    }

    // Update participant statuses
    await supabase
      .from("tournament_participants")
      .update({ status: "in_game" })
      .in("user_id", [playerA.user_id, playerB.user_id])
      .eq("tournament_id", tournamentId);

    console.log(`Created game ${game.id} between ${playerA.user_id} and ${playerB.user_id}`);
  }

  return { paired: pairings.length };
}

async function generateSwissRound(supabase: any, tournamentId: string) {
  console.log("Generating Swiss round for tournament:", tournamentId);

  // Get tournament info
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError) throw tournamentError;

  const nextRound = (tournament.current_round || 0) + 1;

  if (nextRound > tournament.total_rounds) {
    return { error: "All rounds completed" };
  }

  // Check if previous round is complete
  if (nextRound > 1) {
    const { data: activeGames } = await supabase
      .from("tournament_games")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("round_number", nextRound - 1)
      .neq("status", "finished");

    if (activeGames && activeGames.length > 0) {
      return { error: "Previous round not complete" };
    }
  }

  // Get participants sorted by score
  const { data: participants, error: participantsError } = await supabase
    .from("tournament_participants")
    .select("*, user_stats:user_stats(rating)")
    .eq("tournament_id", tournamentId)
    .neq("status", "withdrawn")
    .order("score", { ascending: false });

  if (participantsError) throw participantsError;

  if (!participants || participants.length < 2) {
    return { error: "Not enough participants" };
  }

  // Get problems
  const { data: problems } = await supabase
    .from("problems")
    .select("id")
    .eq("is_published", true);

  if (!problems || problems.length === 0) {
    return { error: "No problems available" };
  }

  // Dutch pairing algorithm (simplified)
  const pairings: Array<{ playerA: TournamentParticipant; playerB: TournamentParticipant | null }> = [];
  const pairedIds = new Set<string>();

  // Get all previous games to avoid rematches
  const { data: previousGames } = await supabase
    .from("tournament_games")
    .select("player_a_id, player_b_id")
    .eq("tournament_id", tournamentId);

  const previousMatchups = new Set(
    previousGames?.map((g: any) => `${g.player_a_id}-${g.player_b_id}`) || []
  );
  previousGames?.forEach((g: any) => {
    previousMatchups.add(`${g.player_b_id}-${g.player_a_id}`);
  });

  // Group by score
  const scoreGroups = new Map<number, TournamentParticipant[]>();
  participants.forEach((p: TournamentParticipant) => {
    const score = p.score;
    if (!scoreGroups.has(score)) {
      scoreGroups.set(score, []);
    }
    scoreGroups.get(score)!.push(p);
  });

  // Pair within score groups, then across groups
  const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);
  
  for (const score of sortedScores) {
    const group = scoreGroups.get(score)!;
    
    for (let i = 0; i < group.length; i++) {
      const playerA = group[i];
      if (pairedIds.has(playerA.user_id)) continue;

      // Try to find opponent in same group
      let playerB: TournamentParticipant | null = null;
      
      for (let j = i + 1; j < group.length; j++) {
        const candidate = group[j];
        if (pairedIds.has(candidate.user_id)) continue;
        
        const matchupKey = `${playerA.user_id}-${candidate.user_id}`;
        if (!previousMatchups.has(matchupKey)) {
          playerB = candidate;
          break;
        }
      }

      // If no opponent in same group, try lower groups
      if (!playerB) {
        const currentScoreIndex = sortedScores.indexOf(score);
        for (let si = currentScoreIndex + 1; si < sortedScores.length; si++) {
          const lowerGroup = scoreGroups.get(sortedScores[si])!;
          for (const candidate of lowerGroup) {
            if (pairedIds.has(candidate.user_id)) continue;
            const matchupKey = `${playerA.user_id}-${candidate.user_id}`;
            if (!previousMatchups.has(matchupKey)) {
              playerB = candidate;
              break;
            }
          }
          if (playerB) break;
        }
      }

      if (playerB) {
        pairings.push({ playerA, playerB });
        pairedIds.add(playerA.user_id);
        pairedIds.add(playerB.user_id);
      }
    }
  }

  // Handle bye for odd player
  const unpairedPlayers = participants.filter((p: TournamentParticipant) => !pairedIds.has(p.user_id));
  if (unpairedPlayers.length === 1) {
    pairings.push({ playerA: unpairedPlayers[0], playerB: null });
  }

  console.log(`Creating ${pairings.length} games for round ${nextRound}`);

  // Create games
  for (const { playerA, playerB } of pairings) {
    if (playerB) {
      const problemId = problems[Math.floor(Math.random() * problems.length)].id;

      await supabase.from("tournament_games").insert({
        tournament_id: tournamentId,
        round_number: nextRound,
        player_a_id: playerA.user_id,
        player_b_id: playerB.user_id,
        problem_id: problemId,
        status: "countdown",
        started_at: new Date().toISOString(),
      });

      await supabase
        .from("tournament_participants")
        .update({ status: "in_game" })
        .in("user_id", [playerA.user_id, playerB.user_id])
        .eq("tournament_id", tournamentId);
    } else {
      // Bye - award 1 point
      await supabase.from("tournament_games").insert({
        tournament_id: tournamentId,
        round_number: nextRound,
        player_a_id: playerA.user_id,
        is_bye: true,
        status: "finished",
        points_awarded_a: 1,
        finished_at: new Date().toISOString(),
      });

      await supabase
        .from("tournament_participants")
        .update({ 
          score: playerA.score + 1,
          status: "in_lobby"
        })
        .eq("user_id", playerA.user_id)
        .eq("tournament_id", tournamentId);
    }
  }

  // Update tournament round
  await supabase
    .from("tournaments")
    .update({ current_round: nextRound })
    .eq("id", tournamentId);

  return { round: nextRound, pairings: pairings.length };
}

async function startTournament(supabase: any, tournamentId: string) {
  console.log("Starting tournament:", tournamentId);

  // Update tournament status
  await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);

  // Set all registered participants to in_lobby
  await supabase
    .from("tournament_participants")
    .update({ 
      status: "in_lobby",
      lobby_since: new Date().toISOString()
    })
    .eq("tournament_id", tournamentId)
    .eq("status", "registered");

  return { success: true };
}

async function handleTick(supabase: any) {
  console.log("Handling tournament tick");
  const now = new Date();

  // Find tournaments that should start
  const { data: tournamentsToStart } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "scheduled")
    .lte("start_time", now.toISOString());

  for (const tournament of tournamentsToStart || []) {
    console.log("Auto-starting tournament:", tournament.id);
    await startTournament(supabase, tournament.id);
  }

  // Find tournaments that should end
  const { data: activeTournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "active");

  for (const tournament of activeTournaments || []) {
    const startTime = new Date(tournament.start_time);
    const endTime = new Date(startTime.getTime() + tournament.duration_minutes * 60 * 1000);
    
    if (now >= endTime) {
      console.log("Auto-ending tournament:", tournament.id);
      await endTournament(supabase, tournament.id);
    } else {
      // Tournament is active - run arena pairing if it's an arena tournament
      if (tournament.tournament_type === "arena") {
        await pairArenaPlayers(supabase, tournament.id);
      }
    }
  }

  return { 
    success: true, 
    started: tournamentsToStart?.length || 0,
    checked: activeTournaments?.length || 0
  };
}

async function endTournament(supabase: any, tournamentId: string) {
  console.log("Ending tournament:", tournamentId);

  // Update tournament status
  await supabase
    .from("tournaments")
    .update({ status: "finished" })
    .eq("id", tournamentId);

  return { success: true };
}

async function processGameResult(supabase: any, gameId: string, tournamentEnded: boolean = false) {
  console.log("Processing game result:", gameId, "Tournament ended:", tournamentEnded);

  const { data: game, error: gameError } = await supabase
    .from("tournament_games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError) throw gameError;

  // If tournament has ended (buzzer), don't update leaderboard scores
  // but still update player stats for their profile
  if (tournamentEnded) {
    console.log("Game finished after tournament ended - not counting for leaderboard");
    return { success: true, countedForLeaderboard: false };
  }

  // Update participant scores
  if (game.points_awarded_a > 0) {
    const { data: participant } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", game.tournament_id)
      .eq("user_id", game.player_a_id)
      .single();

    if (participant) {
      const isWin = game.winner_id === game.player_a_id;
      const newStreak = isWin ? participant.streak + 1 : 0;
      const isOnFire = newStreak >= 2;

      await supabase
        .from("tournament_participants")
        .update({
          score: participant.score + game.points_awarded_a,
          wins: participant.wins + (isWin ? 1 : 0),
          losses: participant.losses + (!isWin && !game.is_draw ? 1 : 0),
          draws: participant.draws + (game.is_draw ? 1 : 0),
          streak: newStreak,
          is_on_fire: isOnFire,
          status: "in_lobby",
          lobby_since: new Date().toISOString(),
          last_opponent_id: game.player_b_id,
        })
        .eq("id", participant.id);
    }
  }

  if (game.points_awarded_b > 0 && game.player_b_id) {
    const { data: participant } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", game.tournament_id)
      .eq("user_id", game.player_b_id)
      .single();

    if (participant) {
      const isWin = game.winner_id === game.player_b_id;
      const newStreak = isWin ? participant.streak + 1 : 0;
      const isOnFire = newStreak >= 2;

      await supabase
        .from("tournament_participants")
        .update({
          score: participant.score + game.points_awarded_b,
          wins: participant.wins + (isWin ? 1 : 0),
          losses: participant.losses + (!isWin && !game.is_draw ? 1 : 0),
          draws: participant.draws + (game.is_draw ? 1 : 0),
          streak: newStreak,
          is_on_fire: isOnFire,
          status: "in_lobby",
          lobby_since: new Date().toISOString(),
          last_opponent_id: game.player_a_id,
        })
        .eq("id", participant.id);
    }
  }

  return { success: true };
}
