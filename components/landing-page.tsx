import Link from "next/link"
import { BookOpen, Lightbulb, Users, Search, ArrowRight, CirclePlay } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Search,
    title: "Discover Sessions",
    description:
      "Browse skill-sharing sessions posted by students on your campus. Filter by category or search by topic to find something that fits your schedule.",
  },
  {
    icon: Lightbulb,
    title: "Learn from Peers",
    description:
      "Enroll in sessions led by fellow students. Whether it's picking up a new language or learning to code, the instruction comes from someone who's been there.",
  },
  {
    icon: Users,
    title: "Teach What You Know",
    description:
      "Have a skill worth sharing? Create a session, set your schedule and capacity, and open it up to your campus community.",
  },
]

const steps = [
  {
    number: "01",
    title: "Create an account",
    description: "Sign up with your university email and set up a short profile.",
  },
  {
    number: "02",
    title: "Find or post a session",
    description: "Browse existing sessions or create your own with a title, time, location, and capacity.",
  },
  {
    number: "03",
    title: "Show up and connect",
    description: "Enroll in a session that interests you and meet the person running it.",
  },
]

const categories = [
  "Technology",
  "Design",
  "Languages",
  "Academics",
  "Wellness",
  "Creative",
  "Career",
  "Music",
  "Cooking",
  "Fitness",
]

export function LandingPage() {
  return (
    <div className="relative min-h-svh bg-background">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5" />
        <div className="absolute -bottom-48 -right-48 h-[32rem] w-[32rem] rounded-full bg-accent/40" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              SkillShare Local
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sessions">Browse Sessions</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Badge variant="secondary">Campus Skill-Sharing</Badge>
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Learn and teach skills with students on your campus
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            SkillShare Local connects university students who want to learn with those who want to teach.
            Sessions are created by students, for students — covering everything from tech to creative arts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11">
              <Link href="/sessions">
                <CirclePlay className="h-4 w-4" />
                Browse Sessions
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 bg-transparent">
              <Link href="/login">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="flex flex-col gap-6 py-12">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              What you can do
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Built around peer-to-peer learning
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Every session on the platform is created and led by a fellow student.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-6 py-12">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              How it works
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Get started in three steps
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="flex flex-col gap-3">
                <span className="font-heading text-4xl font-bold text-primary/20">{number}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="flex flex-col gap-6 py-12">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              Categories
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sessions across all kinds of skills
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Sessions are organized by category so you can quickly find what you&apos;re looking for.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category} variant="outline" className="px-3 py-1 text-sm">
                {category}
              </Badge>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="my-12 flex flex-col items-center gap-5 rounded-xl border border-border/60 bg-accent/30 px-6 py-14 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to get involved?
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Create an account to enroll in sessions or post your own.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11">
              <Link href="/login">
                Create an Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 bg-transparent">
              <Link href="/sessions">Browse First</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
          <p>A CSDS 393 Project — Case Western Reserve University</p>
        </footer>
      </div>
    </div>
  )
}
