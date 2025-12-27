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
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  is_on_fire: boolean;
  lobby_since: string | null;
  last_opponent_id: string | null;
  pause_count: number;
  last_paused_at: string | null;
  can_rejoin_at: string | null;
  user_stats?: { rating: number };
}

interface TournamentGame {
  id: string;
  tournament_id: string;
  player_a_id: string;
  player_b_id: string | null;
  winner_id: string | null;
  is_draw: boolean;
  player_a_berserk: boolean;
  player_b_berserk: boolean;
  points_awarded_a: number;
  points_awarded_b: number;
  result_type: string;
}

// =============================================================================
// LICHESS SCORING SYSTEM (from ArenaSheet.scala)
// =============================================================================
// Win = 2 points base
// Win on fire (2+ win streak) = 4 points (double)
// Win with berserk = +1 point bonus
// Draw = 1 point (0 if draw streak detected)
// Loss = 0 points
// =============================================================================

enum ResultFlag {
  NORMAL = 1,
  STREAK_STARTER = 2,  // First win of potential streak
  DOUBLE = 3,          // On fire - double points
  NULL = 0,            // Draw streak - no points
}

function calculateScore(
  isWin: boolean,
  isDraw: boolean,
  isOnFire: boolean,
  hasBerserk: boolean,
  isValidBerserk: boolean, // berserk only valid if game wasn't too quick
  isStreakable: boolean,
  isDrawStreak: boolean
): { points: number; flag: ResultFlag } {
  if (isWin) {
    // Win scoring from Lichess ArenaSheet.scala
    let flag: ResultFlag;
    if (!isStreakable) {
      flag = ResultFlag.NORMAL;
    } else if (isOnFire) {
      flag = ResultFlag.DOUBLE;
    } else {
      flag = ResultFlag.STREAK_STARTER;
    }
    
    let points = flag === ResultFlag.DOUBLE ? 4 : 2;
    if (hasBerserk && isValidBerserk) {
      points += 1; // Berserk bonus
    }
    return { points, flag };
  }
  
  if (isDraw) {
    // Draw scoring
    if (isStreakable && isOnFire) {
      return { points: 2, flag: ResultFlag.DOUBLE }; // Double draw on fire
    }
    if (isDrawStreak) {
      return { points: 0, flag: ResultFlag.NULL }; // Null draw streak
    }
    return { points: 1, flag: ResultFlag.NORMAL };
  }
  
  // Loss
  return { points: 0, flag: ResultFlag.NORMAL };
}

// =============================================================================
// PAUSE SYSTEM (from Pause.scala)
// First pause = 10 seconds delay
// Subsequent pauses increase: delay = (pauses - 1) * (gameTotalTime / 15)
// Max delay = 120 seconds
// =============================================================================

function calculatePauseDelay(pauseCount: number, timePerProblemSeconds: number): number {
  const baseDelay = Math.floor(timePerProblemSeconds / 15);
  if (pauseCount <= 1) return 10; // First pause = 10s
  const delay = baseDelay * (pauseCount - 1);
  return Math.max(10, Math.min(delay, 120));
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

    const { action, tournament_id, game_id, tournament_ended } = await req.json();
    console.log(`Tournament engine action: ${action} for tournament: ${tournament_id}`);

    switch (action) {
      case "pair_arena":
        return jsonResponse(await pairArenaPlayers(supabaseClient, tournament_id));
      case "generate_swiss_round":
        return jsonResponse(await generateSwissRound(supabaseClient, tournament_id));
      case "start_tournament":
        return jsonResponse(await startTournament(supabaseClient, tournament_id));
      case "end_tournament":
        return jsonResponse(await endTournament(supabaseClient, tournament_id));
      case "process_game_result":
        return jsonResponse(await processGameResult(supabaseClient, game_id, tournament_ended));
      case "pause_player":
        return jsonResponse(await pausePlayer(supabaseClient, tournament_id, game_id));
      case "resume_player":
        return jsonResponse(await resumePlayer(supabaseClient, tournament_id, game_id));
      case "tick":
        return jsonResponse(await handleTick(supabaseClient));
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Tournament engine error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// SMART PAIRING SYSTEM (from AntmaPairing.scala & PairingSystem.scala)
// Uses weighted matching based on:
// - Rating proximity
// - Rank proximity (leaders should play leaders)
// - Last opponent cooldown
// =============================================================================

async function pairArenaPlayers(supabase: any, tournamentId: string) {
  console.log("Starting Lichess-style arena pairing for tournament:", tournamentId);

  // Get all players in lobby who can rejoin (not in pause delay)
  const now = new Date();
  const { data: participants, error: participantsError } = await supabase
    .from("tournament_participants")
    .select("*, user_stats:user_stats(rating)")
    .eq("tournament_id", tournamentId)
    .eq("status", "in_lobby")
    .order("score", { ascending: false });

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    throw participantsError;
  }

  // Filter out players still in pause delay
  const eligibleParticipants = (participants || []).filter((p: TournamentParticipant) => {
    if (!p.can_rejoin_at) return true;
    return new Date(p.can_rejoin_at) <= now;
  });

  if (eligibleParticipants.length < 2) {
    console.log("Not enough players in lobby:", eligibleParticipants.length);
    return { paired: 0 };
  }

  // Get a random problem
  const { data: problems } = await supabase
    .from("problems")
    .select("id, difficulty")
    .eq("is_published", true);

  if (!problems || problems.length === 0) {
    console.error("No problems available");
    return { error: "No problems available" };
  }

  // Get all participants for ranking calculation
  const { data: allParticipants } = await supabase
    .from("tournament_participants")
    .select("user_id, score")
    .eq("tournament_id", tournamentId)
    .neq("status", "withdrawn")
    .order("score", { ascending: false });

  // Create ranking map
  const rankingMap = new Map<string, number>();
  (allParticipants || []).forEach((p: any, index: number) => {
    rankingMap.set(p.user_id, index + 1);
  });

  const maxRank = allParticipants?.length || 1;

  // Lichess rankFactor: higher ranked players get more weight to rating difference
  // This helps leaders play each other
  const rankFactor = (rankA: number, rankB: number): number => {
    const rank = Math.min(rankA, rankB);
    // top rank factor = 2000, bottom rank factor = 300
    return 2000 - Math.floor((rank / maxRank) * 1700);
  };

  const pairings: Array<{ playerA: TournamentParticipant; playerB: TournamentParticipant }> = [];
  const paired = new Set<string>();

  // Sort by score (highest first) for proper pairing
  const sortedParticipants = [...eligibleParticipants].sort((a: TournamentParticipant, b: TournamentParticipant) => {
    if (b.score !== a.score) return b.score - a.score;
    const ratingA = a.user_stats?.rating || 1000;
    const ratingB = b.user_stats?.rating || 1000;
    return ratingB - ratingA;
  });

  // Weighted Matching Algorithm (simplified from Antma)
  for (let i = 0; i < sortedParticipants.length - 1; i++) {
    const playerA = sortedParticipants[i];
    if (paired.has(playerA.user_id)) continue;

    const waitTime = playerA.lobby_since 
      ? (now.getTime() - new Date(playerA.lobby_since).getTime()) / 1000 
      : 0;

    let bestOpponent: TournamentParticipant | null = null;
    let bestScore = Infinity;

    for (let j = i + 1; j < sortedParticipants.length; j++) {
      const playerB = sortedParticipants[j];
      if (paired.has(playerB.user_id)) continue;

      // Last opponent check - require 25s cooldown unless waiting too long
      if (playerA.last_opponent_id === playerB.user_id && waitTime < 25) {
        continue;
      }

      // Calculate pairing score (lower is better)
      const rankA = rankingMap.get(playerA.user_id) || 999;
      const rankB = rankingMap.get(playerB.user_id) || 999;
      const ratingA = playerA.user_stats?.rating || 1000;
      const ratingB = playerB.user_stats?.rating || 1000;

      const pairScore = 
        Math.abs(rankA - rankB) * rankFactor(rankA, rankB) +
        Math.abs(ratingA - ratingB);

      // Allow wider gaps over time
      const maxAllowedScore = 200000 + waitTime * 10000;

      if (pairScore < bestScore && pairScore < maxAllowedScore) {
        bestScore = pairScore;
        bestOpponent = playerB;
      }
    }

    if (bestOpponent) {
      pairings.push({ playerA, playerB: bestOpponent });
      paired.add(playerA.user_id);
      paired.add(bestOpponent.user_id);
    }
  }

  console.log(`Creating ${pairings.length} games with Lichess-style pairing`);

  // Create games and featured duels
  for (const { playerA, playerB } of pairings) {
    const problemId = problems[Math.floor(Math.random() * problems.length)].id;
    const ratingA = playerA.user_stats?.rating || 1000;
    const ratingB = playerB.user_stats?.rating || 1000;
    const avgRating = Math.floor((ratingA + ratingB) / 2);

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
        result_type: "pending",
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

    // Get profiles for featured duel
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", [playerA.user_id, playerB.user_id]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name || "Anonymous"]));

    // Create featured duel entry
    await supabase.from("tournament_featured_duels").insert({
      tournament_id: tournamentId,
      game_id: game.id,
      player_a_name: profileMap.get(playerA.user_id) || "Anonymous",
      player_b_name: profileMap.get(playerB.user_id) || "Anonymous",
      player_a_rating: ratingA,
      player_b_rating: ratingB,
      player_a_rank: rankingMap.get(playerA.user_id),
      player_b_rank: rankingMap.get(playerB.user_id),
      average_rating: avgRating,
    });

    console.log(`Created game ${game.id}: ${playerA.user_id} (${ratingA}) vs ${playerB.user_id} (${ratingB})`);
  }

  return { paired: pairings.length };
}

async function generateSwissRound(supabase: any, tournamentId: string) {
  console.log("Generating Swiss round for tournament:", tournamentId);

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

  const { data: problems } = await supabase
    .from("problems")
    .select("id")
    .eq("is_published", true);

  if (!problems || problems.length === 0) {
    return { error: "No problems available" };
  }

  // Dutch pairing algorithm
  const pairings: Array<{ playerA: TournamentParticipant; playerB: TournamentParticipant | null }> = [];
  const pairedIds = new Set<string>();

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

  const scoreGroups = new Map<number, TournamentParticipant[]>();
  participants.forEach((p: TournamentParticipant) => {
    const score = p.score;
    if (!scoreGroups.has(score)) {
      scoreGroups.set(score, []);
    }
    scoreGroups.get(score)!.push(p);
  });

  const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);
  
  for (const score of sortedScores) {
    const group = scoreGroups.get(score)!;
    
    for (let i = 0; i < group.length; i++) {
      const playerA = group[i];
      if (pairedIds.has(playerA.user_id)) continue;

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

  const unpairedPlayers = participants.filter((p: TournamentParticipant) => !pairedIds.has(p.user_id));
  if (unpairedPlayers.length === 1) {
    pairings.push({ playerA: unpairedPlayers[0], playerB: null });
  }

  console.log(`Creating ${pairings.length} games for round ${nextRound}`);

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
        result_type: "pending",
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
        result_type: "bye",
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

  await supabase
    .from("tournaments")
    .update({ current_round: nextRound })
    .eq("id", tournamentId);

  return { round: nextRound, pairings: pairings.length };
}

async function startTournament(supabase: any, tournamentId: string) {
  console.log("Starting tournament:", tournamentId);

  await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);

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

async function endTournament(supabase: any, tournamentId: string) {
  console.log("Ending tournament:", tournamentId);

  await supabase
    .from("tournaments")
    .update({ status: "finished" })
    .eq("id", tournamentId);

  // Clean up featured duels
  await supabase
    .from("tournament_featured_duels")
    .delete()
    .eq("tournament_id", tournamentId);

  return { success: true };
}

async function pausePlayer(supabase: any, tournamentId: string, userId: string) {
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("time_per_problem_seconds")
    .eq("id", tournamentId)
    .single();

  const { data: participant } = await supabase
    .from("tournament_participants")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();

  if (!participant) return { error: "Participant not found" };

  const newPauseCount = (participant.pause_count || 0) + 1;
  const delay = calculatePauseDelay(newPauseCount, tournament?.time_per_problem_seconds || 180);
  const canRejoinAt = new Date(Date.now() + delay * 1000).toISOString();

  await supabase
    .from("tournament_participants")
    .update({
      status: "paused",
      pause_count: newPauseCount,
      last_paused_at: new Date().toISOString(),
      can_rejoin_at: canRejoinAt,
    })
    .eq("id", participant.id);

  console.log(`Player ${userId} paused. Can rejoin at ${canRejoinAt} (${delay}s delay)`);
  return { success: true, delay, canRejoinAt };
}

async function resumePlayer(supabase: any, tournamentId: string, userId: string) {
  const { data: participant } = await supabase
    .from("tournament_participants")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();

  if (!participant) return { error: "Participant not found" };

  // Check if pause delay has passed
  if (participant.can_rejoin_at) {
    const canRejoin = new Date(participant.can_rejoin_at);
    if (new Date() < canRejoin) {
      const remaining = Math.ceil((canRejoin.getTime() - Date.now()) / 1000);
      return { error: `Must wait ${remaining} more seconds`, remaining };
    }
  }

  await supabase
    .from("tournament_participants")
    .update({
      status: "in_lobby",
      lobby_since: new Date().toISOString(),
    })
    .eq("id", participant.id);

  return { success: true };
}

async function handleTick(supabase: any) {
  console.log("Handling tournament tick");
  const now = new Date();

  const { data: tournamentsToStart } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "scheduled")
    .lte("start_time", now.toISOString());

  for (const tournament of tournamentsToStart || []) {
    console.log("Auto-starting tournament:", tournament.id);
    await startTournament(supabase, tournament.id);
  }

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
    } else if (tournament.tournament_type === "arena") {
      await pairArenaPlayers(supabase, tournament.id);
    }
  }

  return { 
    success: true, 
    started: tournamentsToStart?.length || 0,
    checked: activeTournaments?.length || 0
  };
}

// =============================================================================
// LICHESS GAME RESULT PROCESSING
// =============================================================================

async function processGameResult(supabase: any, gameId: string, tournamentEnded: boolean = false) {
  console.log("Processing game result with Lichess scoring:", gameId);

  const { data: game, error: gameError } = await supabase
    .from("tournament_games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError) throw gameError;

  // Get tournament for streakable setting
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", game.tournament_id)
    .single();

  const isStreakable = tournament?.tournament_type === "arena"; // Arena has streaks

  if (tournamentEnded) {
    console.log("Game finished after tournament ended - not counting for leaderboard");
    return { success: true, countedForLeaderboard: false };
  }

  // Remove from featured duels
  await supabase
    .from("tournament_featured_duels")
    .delete()
    .eq("game_id", gameId);

  // Process player A
  await processPlayerResult(supabase, game, true, isStreakable);
  
  // Process player B
  if (game.player_b_id) {
    await processPlayerResult(supabase, game, false, isStreakable);
  }

  return { success: true };
}

async function processPlayerResult(
  supabase: any, 
  game: TournamentGame, 
  isPlayerA: boolean,
  isStreakable: boolean
) {
  const playerId = isPlayerA ? game.player_a_id : game.player_b_id;
  if (!playerId) return;

  const { data: participant } = await supabase
    .from("tournament_participants")
    .select("*")
    .eq("tournament_id", game.tournament_id)
    .eq("user_id", playerId)
    .single();

  if (!participant) return;

  const isWin = game.winner_id === playerId;
  const isLoss = game.winner_id && game.winner_id !== playerId;
  const isDraw = !game.winner_id && !game.is_draw ? false : game.is_draw;
  
  const hasBerserk = isPlayerA ? game.player_a_berserk : game.player_b_berserk;
  const isValidBerserk = hasBerserk; // Could add quick finish check here
  
  // Was on fire before this game
  const wasOnFire = participant.is_on_fire;
  
  // Check for draw streak (2+ consecutive draws)
  const isDrawStreak = !isWin && participant.streak === 0 && isDraw;

  // Calculate score
  const { points } = calculateScore(
    isWin,
    isDraw,
    wasOnFire,
    hasBerserk,
    isValidBerserk,
    isStreakable,
    isDrawStreak
  );

  // Update streak
  let newStreak: number;
  let newIsOnFire: boolean;
  
  if (isWin) {
    newStreak = participant.streak + 1;
    newIsOnFire = newStreak >= 2;
  } else {
    newStreak = 0;
    newIsOnFire = false;
  }

  const opponentId = isPlayerA ? game.player_b_id : game.player_a_id;

  await supabase
    .from("tournament_participants")
    .update({
      score: participant.score + points,
      wins: participant.wins + (isWin ? 1 : 0),
      losses: participant.losses + (isLoss ? 1 : 0),
      draws: participant.draws + (isDraw ? 1 : 0),
      streak: newStreak,
      is_on_fire: newIsOnFire,
      status: "in_lobby",
      lobby_since: new Date().toISOString(),
      last_opponent_id: opponentId,
    })
    .eq("id", participant.id);

  // Update game points
  const pointsField = isPlayerA ? "points_awarded_a" : "points_awarded_b";
  await supabase
    .from("tournament_games")
    .update({ [pointsField]: points })
    .eq("id", game.id);

  console.log(`Player ${playerId}: ${isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'} +${points}pts (streak: ${newStreak}, fire: ${newIsOnFire})`);
}
