import Layout from '@/components/layout/Layout';
import { Target, Heart, Clock, Users, BookOpen, Award } from 'lucide-react';

const coreValues = [
  {
    icon: Target,
    title: 'Curiosity',
    description: 'We believe the best mathematicians are driven by genuine wonder. Every "why" opens a door to deeper understanding.',
  },
  {
    icon: Heart,
    title: 'Rigor',
    description: 'Mathematics is the art of precise reasoning. We embrace complete proofs, sound arguments, and intellectual honesty.',
  },
  {
    icon: Clock,
    title: 'Patience',
    description: 'Mastery takes time. We encourage persistence through difficult problems, knowing that struggle leads to growth.',
  },
  {
    icon: BookOpen,
    title: 'Intellectual Honesty',
    description: 'We admit when we don\'t know something. True learning begins with acknowledging the limits of our understanding.',
  },
];

const targetAudience = [
  {
    icon: Users,
    title: 'High School Students',
    description: 'Students in grades 9-12 who want to go beyond the standard curriculum and explore olympiad-level mathematics.',
  },
  {
    icon: Award,
    title: 'IMO Aspirants',
    description: 'Ambitious problem-solvers aiming to compete at the International Mathematical Olympiad level.',
  },
  {
    icon: Heart,
    title: 'Math Enthusiasts',
    description: 'Anyone with a genuine love for mathematics who wants to deepen their understanding and problem-solving skills.',
  },
];

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              About AletheiaMath
            </span>
            <h1 className="heading-display text-foreground mb-6">
              The Pursuit of{' '}
              <span className="text-primary">Mathematical Truth</span>
            </h1>
            <p className="body-large text-muted-foreground">
              "ἀλήθεια" (Aletheia) is the Greek word for truth and disclosure. 
              We exist to reveal the beauty and elegance hidden within mathematics.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="divider-gold mb-8" />
              <h2 className="heading-section text-foreground mb-6">
                Our Mission
              </h2>
              <div className="space-y-4 text-muted-foreground body-regular">
                <p>
                  AletheiaMath was born from a simple observation: too many students learn mathematics 
                  through memorization rather than understanding. They learn <em>what</em> to do, 
                  but not <em>why</em> it works.
                </p>
                <p>
                  We're building a platform that changes this. Our mission is to make high-level 
                  mathematics accessible to curious minds everywhere — not by watering it down, 
                  but by presenting it with the clarity and rigor it deserves.
                </p>
                <p>
                  Whether you're preparing for the International Mathematical Olympiad or simply 
                  want to explore the depths of mathematical thinking, AletheiaMath is your companion 
                  on this journey.
                </p>
              </div>
            </div>
            
            <div className="card-elevated p-8 md:p-10">
              <blockquote className="font-serif text-xl md:text-2xl text-foreground italic leading-relaxed">
                "The goal is not to train students to solve specific types of problems, 
                but to develop minds that can approach any problem with creativity and precision."
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-serif font-bold text-primary">α</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">AletheiaMath Philosophy</p>
                  <p className="text-sm text-muted-foreground">Founding Principle</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-section text-foreground mb-4">
              Core Values
            </h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build and teach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {coreValues.map((value, index) => (
              <div 
                key={value.title}
                className="card-premium p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="heading-subsection text-foreground mb-2">
                      {value.title}
                    </h3>
                    <p className="body-regular text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-section text-foreground mb-4">
              Who Is AletheiaMath For?
            </h2>
            <p className="body-large text-muted-foreground max-w-2xl mx-auto">
              We welcome all curious minds, with special focus on these groups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {targetAudience.map((audience) => (
              <div key={audience.title} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                  <audience.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="heading-subsection text-foreground mb-3">
                  {audience.title}
                </h3>
                <p className="body-regular text-muted-foreground">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teaching Philosophy */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
                Our Teaching Philosophy
              </h2>
              <p className="text-primary-foreground/80 body-large">
                How we approach mathematical education differently.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-serif font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    Understanding Before Techniques
                  </h3>
                  <p className="text-primary-foreground/80">
                    We never teach a technique without first explaining why it works. 
                    The "how" always follows the "why."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-serif font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    Building Intuition Through Examples
                  </h3>
                  <p className="text-primary-foreground/80">
                    Abstract concepts become concrete through carefully chosen examples 
                    that illuminate the underlying structure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-serif font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    Embracing Productive Struggle
                  </h3>
                  <p className="text-primary-foreground/80">
                    The best learning happens at the edge of understanding. We design challenges 
                    that stretch your abilities without overwhelming them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}