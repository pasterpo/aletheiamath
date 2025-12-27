import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { problemId, userSolutionText, userSolutionImageUrl } = await req.json();

    if (!problemId) {
      return new Response(
        JSON.stringify({ error: "Missing problemId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userSolutionText && !userSolutionImageUrl) {
      return new Response(
        JSON.stringify({ error: "Please provide either solution text or image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch problem with solution
    const { data: problem, error: problemError } = await supabaseClient
      .from("problems")
      .select("id, title, statement, solution, answer")
      .eq("id", problemId)
      .single();

    if (problemError || !problem) {
      return new Response(
        JSON.stringify({ error: "Problem not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!problem.solution) {
      return new Response(
        JSON.stringify({ error: "This problem has no official solution to compare against" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare the prompt for AI comparison
    const systemPrompt = `You are a mathematical grading assistant. Your job is to compare a student's solution against the official solution for a math problem.

Analyze the student's solution and determine:
1. Is the mathematical reasoning correct?
2. Are there any logical errors or gaps in the proof?
3. Does the solution arrive at the correct answer?
4. What specific improvements could be made?

Be fair but rigorous. Mathematical olympiad problems require precise proofs.

Respond in JSON format:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "detailed feedback explaining what was correct and what was wrong",
  "errors": ["list of specific errors found"],
  "improvements": ["list of suggested improvements"],
  "keyStepsMissing": ["any important proof steps that were skipped"]
}`;

    const userPrompt = `Problem: ${problem.title}

Problem Statement:
${problem.statement}

Official Solution:
${problem.solution}

${problem.answer ? `Correct Answer: ${problem.answer}` : ''}

Student's Solution:
${userSolutionText || '[Submitted as image - analyze based on typical mathematical proof structure]'}

${userSolutionImageUrl ? `Student's solution image URL: ${userSolutionImageUrl}` : ''}

Please grade this student's solution by comparing it to the official solution. Be thorough in your analysis.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI grading service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse AI response
    let gradeResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        gradeResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        gradeResult = {
          isCorrect: false,
          score: 50,
          feedback: aiContent,
          errors: [],
          improvements: ["Please try again with a clearer solution"],
          keyStepsMissing: []
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      gradeResult = {
        isCorrect: false,
        score: 50,
        feedback: aiContent,
        errors: [],
        improvements: [],
        keyStepsMissing: []
      };
    }

    // Store the submission
    await supabaseClient
      .from("solution_submissions")
      .insert({
        user_id: user.id,
        problem_id: problemId,
        solution_text: userSolutionText || `[Image submission: ${userSolutionImageUrl}]`,
        status: gradeResult.isCorrect ? 'approved' : 'rejected',
        feedback: gradeResult.feedback,
        points_earned: gradeResult.isCorrect ? Math.round(gradeResult.score / 10) : 0,
        reviewed_at: new Date().toISOString(),
      });

    console.log(`Solution graded for user ${user.id} on problem ${problemId}: score=${gradeResult.score}`);

    return new Response(
      JSON.stringify({
        success: true,
        grade: gradeResult,
        officialSolution: problem.solution,
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