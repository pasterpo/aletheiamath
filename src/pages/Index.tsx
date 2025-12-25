import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Trophy, Users, Lightbulb, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const features = [
  {
    icon: BookOpen,
    title: 'IMO 2027 Crash Course',
    description: 'A comprehensive curriculum designed to take you from foundations to olympiad-level mastery.',
    status: 'Coming Soon',
  },
  {
    icon: Trophy,
    title: 'Snap-Solve Duels',
    description: 'Real-time 1v1 mathematical battles to sharpen your speed and accuracy.',
    status: 'Coming Soon',
  },
  {
    icon: Users,
    title: 'Global Community',
    description: 'Connect with passionate mathematicians from around the world.',
    status: 'Coming Soon',
  },
];

const values = [
  {
    icon: Lightbulb,
    title: 'Curiosity',
    description: 'We nurture the innate desire to ask "why" and explore the depths of mathematical truth.',
  },
  {
    icon: Target,
    title: 'Rigor',
    description: 'Every proof is complete, every argument is sound. We embrace the beauty of precision.',
  },
  {
    icon: Brain,
    title: 'Intuition',
    description: 'Beyond memorization — we build deep understanding that reveals the elegance of mathematics.',
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative gradient-hero pattern-math overflow-hidden">
        <div className="container py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-in">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                The Aletheia Global Math Ecosystem
              </span>
            </div>
            
            <h1 className="heading-display text-foreground mb-6 animate-slide-up">
              Where High-Level Mathematics Becomes{' '}
              <span className="text-primary">Understandable</span> and{' '}
              <span className="text-accent">Enjoyable</span>
            </h1>
            
            <p className="body-large text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up delay-100">
              Aletheia is a platform for high-school students aspiring to the International Mathematical Olympiad. 
              We build intuition, not memorization — rigor, not shortcuts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-200">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="btn-premium group w-full sm:w-auto">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Philosophy Teaser */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="divider-gold mx-auto mb-8" />
            <blockquote className="font-serif text-2xl md:text-3xl text-foreground italic leading-relaxed">
              "The essence of mathematics lies not in making simple things complicated, 
              but in making complicated things simple."
            </blockquote>
            <p className="mt-6 text-muted-foreground body-regular">
              — Our guiding principle at AletheiaMath
            </p>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-section text-foreground mb-4">
              What's Coming
            </h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              We're building the most comprehensive platform for aspiring mathematical olympians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="card-premium p-6 md:p-8 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    {feature.status}
                  </span>
                </div>
                <h3 className="heading-subsection text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="body-regular text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-section text-foreground mb-4">
              Our Philosophy
            </h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              Three pillars that guide everything we create.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {values.map((value, index) => (
              <div 
                key={value.title} 
                className="text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="heading-subsection text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="body-regular text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Ready to Begin?
            </h2>
            <p className="text-primary-foreground/80 body-large mb-8 max-w-xl mx-auto">
              Join a community of passionate problem-solvers and start your journey toward mathematical excellence.
            </p>
            <Link to="/auth?mode=signup">
              <Button 
                size="lg" 
                variant="secondary"
                className="group"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}