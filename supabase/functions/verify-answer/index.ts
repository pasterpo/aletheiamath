import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse and evaluate fraction strings like "1/2" to decimal
function parseFraction(str: string): number | null {
  str = str.trim();
  
  // Direct number
  const directNum = parseFloat(str);
  if (!isNaN(directNum) && !str.includes('/')) {
    return directNum;
  }
  
  // Fraction format
  const fractionMatch = str.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }
  
  return null;
}

function compareAnswers(userAnswer: string, correctAnswer: string, answerType: string | null): boolean {
  const userClean = userAnswer.trim().toLowerCase();
  const correctClean = correctAnswer.trim().toLowerCase();
  
  if (answerType === 'exact') {
    return userClean === correctClean;
  }
  
  if (answerType === 'numeric' || answerType === 'fraction') {
    const userNum = parseFraction(userClean);
    const correctNum = parseFraction(correctClean);
    
    if (userNum !== null && correctNum !== null) {
      return Math.abs(userNum - correctNum) < 0.001;
    }
  }
  
  // Fallback to exact match
  return userClean === correctClean;
}

// New rating formula based on difficulty 10-100:
// Correct: +difficulty (e.g., +10 for easiest, +100 for hardest)
// Incorrect: -(110 - difficulty) (e.g., -100 for easiest wrong, -10 for hardest wrong)
function calculateRatingChange(difficulty: number, isCorrect: boolean): number {
  const diff = difficulty || 50; // Default to 50 if not set
  if (isCorrect) {
    return diff;
  } else {
    return -(110 - diff);
  }
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

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { problemId, userAnswer } = await req.json();

    if (!problemId || !userAnswer) {
      return new Response(
        JSON.stringify({ error: "Missing problemId or userAnswer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already attempted this problem
    const { data: existingAttempt } = await supabaseClient
      .from("user_attempted_problems")
      .select("id")
      .eq("user_id", user.id)
      .eq("problem_id", problemId)
      .maybeSingle();

    if (existingAttempt) {
      return new Response(
        JSON.stringify({ error: "You have already attempted this problem" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch problem with answer (server-side only)
    const { data: problem, error: problemError } = await supabaseClient
      .from("problems")
      .select("id, answer, answer_type, difficulty")
      .eq("id", problemId)
      .single();

    if (problemError || !problem) {
      return new Response(
        JSON.stringify({ error: "Problem not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!problem.answer) {
      return new Response(
        JSON.stringify({ error: "This problem has no answer key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current user stats
    const { data: currentStats } = await supabaseClient
      .from("user_stats")
      .select("rating, problems_solved, total_points")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentRating = currentStats?.rating || 1000;
    const isCorrect = compareAnswers(userAnswer, problem.answer, problem.answer_type);
    const ratingChange = calculateRatingChange(problem.difficulty || 50, isCorrect);

    // Record the attempt
    await supabaseClient
      .from("user_attempted_problems")
      .insert({
        user_id: user.id,
        problem_id: problemId,
        result: isCorrect ? 'correct' : 'incorrect',
      });

    // Update user stats
    const newRating = Math.max(0, currentRating + ratingChange);
    const newSolved = (currentStats?.problems_solved || 0) + (isCorrect ? 1 : 0);
    const newPoints = (currentStats?.total_points || 0) + (isCorrect ? ratingChange : 0);

    if (currentStats) {
      await supabaseClient
        .from("user_stats")
        .update({
          rating: newRating,
          problems_solved: newSolved,
          total_points: newPoints,
          last_activity_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      // Create new stats record if doesn't exist
      await supabaseClient
        .from("user_stats")
        .insert({
          user_id: user.id,
          rating: newRating,
          problems_solved: isCorrect ? 1 : 0,
          total_points: isCorrect ? ratingChange : 0,
          last_activity_at: new Date().toISOString(),
        });
    }

    console.log(`User ${user.id}: answer=${isCorrect ? 'correct' : 'incorrect'}, difficulty=${problem.difficulty}, rating change=${ratingChange}, new rating=${newRating}`);

    return new Response(
      JSON.stringify({
        isCorrect,
        ratingChange,
        correctAnswer: isCorrect ? null : problem.answer, // Only reveal on incorrect
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
