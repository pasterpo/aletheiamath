import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Clock, Zap, Target, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const waitlistSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  country: z.string().optional(),
  current_level: z.string().optional(),
  motivation: z.string().min(20, 'Please write at least 20 characters about your motivation'),
  experience: z.string().optional(),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

export default function IMO2027() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const form = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      full_name: '',
      email: user?.email || '',
      country: '',
      current_level: '',
      motivation: '',
      experience: '',
    },
  });
  
  const onSubmit = async (data: WaitlistForm) => {
    setIsSubmitting(true);
    try {
      const insertData: {
        full_name: string;
        email: string;
        country?: string;
        current_level?: string;
        motivation?: string;
        experience?: string;
        user_id?: string;
      } = {
        full_name: data.full_name,
        email: data.email,
        country: data.country || undefined,
        current_level: data.current_level || undefined,
        motivation: data.motivation,
        experience: data.experience || undefined,
      };
      
      if (user?.id) {
        insertData.user_id = user.id;
      }
      
      const { error } = await supabase.from('imo_waitlist').insert(insertData);
      
      if (error) throw error;
      
      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'We\'ll be in touch soon with next steps.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const features = [
    {
      icon: Target,
      title: 'Structured Curriculum',
      description: 'Comprehensive preparation covering all four olympiad domains: Algebra, Geometry, Number Theory, and Combinatorics.',
    },
    {
      icon: Users,
      title: 'Expert Mentorship',
      description: 'Learn from experienced olympiad coaches and past IMO medalists who understand the competition mindset.',
    },
    {
      icon: Clock,
      title: 'Intensive Training',
      description: 'Weekly problem sets, mock exams, and timed practice sessions to build speed and accuracy.',
    },
    {
      icon: Trophy,
      title: 'Competition Simulation',
      description: 'Regular mock IMOs with authentic conditions to prepare for the real experience.',
    },
  ];
  
  const timeline = [
    { phase: 'Phase 1', title: 'Foundation Building', duration: 'Months 1-3', description: 'Master fundamental techniques in all four areas' },
    { phase: 'Phase 2', title: 'Advanced Topics', duration: 'Months 4-8', description: 'Tackle olympiad-level problems and learn advanced methods' },
    { phase: 'Phase 3', title: 'Competition Prep', duration: 'Months 9-12', description: 'Focus on speed, strategy, mental preparation, and mock competitions' },
  ];
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 gradient-hero pattern-math overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Elite Preparation Program</span>
            </div>
            <h1 className="heading-display text-foreground mb-6">
              IMO 2027
              <span className="block text-primary">Preparation Program</span>
            </h1>
            <p className="body-large text-muted-foreground text-balance max-w-2xl mx-auto mb-8">
              Join our intensive one-year program designed to prepare exceptional students 
              for the International Mathematical Olympiad. Limited spots available.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="btn-premium" onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}>
                Apply Now <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/problems')}>
                Try Sample Problems
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-section text-foreground mb-4">Program Highlights</h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              Everything you need to compete at the highest level
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-premium">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-section text-foreground mb-4">12-Month Journey</h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              A structured path from foundation to IMO readiness
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <div key={item.phase} className="flex gap-4 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-primary">{item.phase}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {item.duration}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section id="waitlist" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <Card className="card-elevated text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="heading-section mb-4">Application Received!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your interest in our IMO 2027 Preparation Program. 
                    We'll review your application and contact you within 2 weeks.
                  </p>
                  <Button onClick={() => navigate('/problems')}>
                    Start Practicing <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-elevated">
                <CardHeader className="text-center">
                  <CardTitle className="heading-section">Apply for IMO 2027 Program</CardTitle>
                  <CardDescription className="body-regular">
                    Complete this form to express your interest. Limited to 50 students.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Your country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="current_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                  <SelectItem value="national_olympiad">National Olympiad Level</SelectItem>
                                  <SelectItem value="international_olympiad">International Olympiad Experience</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="motivation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Why do you want to join this program? *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your mathematical journey and goals..."
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Competition Experience (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any math competitions you've participated in and results..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full btn-premium" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
