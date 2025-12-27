import { useState, useRef } from 'react';
import { Upload, Send, Loader2, CheckCircle, XCircle, AlertTriangle, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Problem } from '@/hooks/useProblems';

interface AIGradingInterfaceProps {
  problem: Problem;
}

interface GradeResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  errors: string[];
  improvements: string[];
  keyStepsMissing: string[];
}

export function AIGradingInterface({ problem }: AIGradingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [solutionText, setSolutionText] = useState('');
  const [solutionImageUrl, setSolutionImageUrl] = useState<string | null>(null);
  const [solutionImagePreview, setSolutionImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [officialSolution, setOfficialSolution] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      setSolutionImageUrl(publicUrl);
      setSolutionImagePreview(URL.createObjectURL(file));
      toast({ title: 'Image uploaded!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSolutionImageUrl(null);
    setSolutionImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitForGrading = async () => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to submit solutions', variant: 'destructive' });
      return;
    }

    if (!solutionText.trim() && !solutionImageUrl) {
      toast({ title: 'No solution', description: 'Please enter your solution or upload an image', variant: 'destructive' });
      return;
    }

    setGrading(true);
    setGradeResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('compare-solutions', {
        body: {
          problemId: problem.id,
          userSolutionText: solutionText.trim() || null,
          userSolutionImageUrl: solutionImageUrl,
        }
      });

      if (error) throw error;

      setGradeResult(data.grade);
      setOfficialSolution(data.officialSolution);

      if (data.grade.isCorrect) {
        toast({ title: '✅ Solution Correct!', description: `Score: ${data.grade.score}/100` });
      } else {
        toast({ title: '❌ Needs Improvement', description: 'Check the feedback below' });
      }
    } catch (error: any) {
      console.error('Grading error:', error);
      toast({ 
        title: 'Grading failed', 
        description: error.message || 'Failed to grade solution',
        variant: 'destructive'
      });
    } finally {
      setGrading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Submit Your Solution for AI Grading
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Write your solution or upload a photo of your handwritten work. Our AI will compare it against the official solution.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Solution Input */}
        <div className="space-y-2">
          <Textarea
            value={solutionText}
            onChange={(e) => setSolutionText(e.target.value)}
            placeholder="Type your complete solution here... Include all steps of your proof or calculation."
            className="min-h-[150px]"
            disabled={grading}
          />
        </div>

        {/* Image Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          {solutionImagePreview ? (
            <div className="relative">
              <img 
                src={solutionImagePreview} 
                alt="Your solution" 
                className="max-h-64 mx-auto rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={grading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload a photo of your handwritten solution
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || grading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmitForGrading} 
          disabled={grading || (!solutionText.trim() && !solutionImageUrl)}
          className="w-full"
        >
          {grading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI is grading your solution...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit for AI Grading
            </>
          )}
        </Button>

        {/* Grade Results */}
        {gradeResult && (
          <Card className={`${gradeResult.isCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
            <CardContent className="pt-6 space-y-4">
              {/* Score Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {gradeResult.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className="font-bold text-lg">
                    {gradeResult.isCorrect ? 'Correct!' : 'Needs Work'}
                  </span>
                </div>
                <Badge className={`${getScoreColor(gradeResult.score)} text-white`}>
                  Score: {gradeResult.score}/100
                </Badge>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <h4 className="font-semibold">Feedback:</h4>
                <p className="text-sm">{gradeResult.feedback}</p>
              </div>

              {/* Errors */}
              {gradeResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" /> Errors Found:
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {gradeResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Steps */}
              {gradeResult.keyStepsMissing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-500">Missing Steps:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {gradeResult.keyStepsMissing.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {gradeResult.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-500">Suggestions:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {gradeResult.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Official Solution */}
        {officialSolution && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Official Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{officialSolution}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
