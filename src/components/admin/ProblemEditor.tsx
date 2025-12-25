import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProblem } from '@/hooks/useProblems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ProblemCategory } from '@/hooks/useProblems';

interface ProblemEditorProps {
  problemId: string | null;
  categories: ProblemCategory[];
  onClose: () => void;
}

export function ProblemEditor({ problemId, categories, onClose }: ProblemEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: existingProblem } = useProblem(problemId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    statement: '',
    answer: '',
    answer_type: 'exact',
    difficulty: '5',
    category_id: '',
    source: '',
    year: '',
    hints: '',
    solution: '',
    tags: '',
    is_published: true,
    image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (existingProblem) {
      const problemWithImage = existingProblem as any;
      setFormData({
        title: existingProblem.title || '',
        statement: existingProblem.statement || '',
        answer: problemWithImage.answer || '',
        answer_type: problemWithImage.answer_type || 'exact',
        difficulty: existingProblem.difficulty?.toString() || '5',
        category_id: existingProblem.category_id || '',
        source: existingProblem.source || '',
        year: existingProblem.year?.toString() || '',
        hints: existingProblem.hints?.join('\n') || '',
        solution: existingProblem.solution || '',
        tags: existingProblem.tags?.join(', ') || '',
        is_published: true,
        image_url: problemWithImage.image_url || '',
      });
      if (problemWithImage.image_url) {
        setImagePreview(problemWithImage.image_url);
      }
    }
  }, [existingProblem]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `problems/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('problem-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('problem-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      
      toast({ title: 'Image uploaded successfully' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const problemData = {
        title: formData.title,
        statement: formData.statement,
        answer: formData.answer || null,
        answer_type: formData.answer_type,
        difficulty: parseInt(formData.difficulty),
        category_id: formData.category_id || null,
        source: formData.source || null,
        year: formData.year ? parseInt(formData.year) : null,
        hints: formData.hints ? formData.hints.split('\n').filter(h => h.trim()) : null,
        solution: formData.solution || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        is_published: formData.is_published,
        image_url: formData.image_url || null,
      };

      if (problemId) {
        const { error } = await supabase
          .from('problems')
          .update(problemData)
          .eq('id', problemId);

        if (error) throw error;
        toast({ title: 'Problem updated successfully' });
      } else {
        const { error } = await supabase
          .from('problems')
          .insert(problemData);

        if (error) throw error;
        toast({ title: 'Problem created successfully' });
      }

      queryClient.invalidateQueries({ queryKey: ['problems'] });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save problem',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle>{problemId ? 'Edit Problem' : 'Create New Problem'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Problem Image Upload */}
          <div className="space-y-2">
            <Label>Problem Image (optional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Problem" 
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an image of the problem statement
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
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Statement */}
          <div className="space-y-2">
            <Label htmlFor="statement">Problem Statement * (supports LaTeX with $...$)</Label>
            <Textarea
              id="statement"
              value={formData.statement}
              onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
              className="min-h-[150px]"
              required
            />
          </div>

          {/* Answer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Answer (for verification)</Label>
              <Input
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="e.g., 42, 1/2, 3.14159"
              />
              <p className="text-xs text-muted-foreground">
                Supports integers, decimals, and fractions (like 1/2)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer_type">Answer Type</Label>
              <Select
                value={formData.answer_type}
                onValueChange={(value) => setFormData({ ...formData, answer_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="numeric">Numeric (±0.001)</SelectItem>
                  <SelectItem value="fraction">Fraction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty and Source */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty (1-10)</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level} {level <= 3 ? '(Easy)' : level <= 6 ? '(Medium)' : '(Hard)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., IMO, AMC, USAMO"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g., 2023"
              />
            </div>
          </div>

          {/* Hints */}
          <div className="space-y-2">
            <Label htmlFor="hints">Hints (one per line)</Label>
            <Textarea
              id="hints"
              value={formData.hints}
              onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
              className="min-h-[100px]"
              placeholder="Enter each hint on a new line"
            />
          </div>

          {/* Solution */}
          <div className="space-y-2">
            <Label htmlFor="solution">Solution (supports LaTeX)</Label>
            <Textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="min-h-[150px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., combinatorics, pigeonhole, counting"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : problemId ? 'Update Problem' : 'Create Problem'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}