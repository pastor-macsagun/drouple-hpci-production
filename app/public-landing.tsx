import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[color:rgb(var(--color-bg))] text-[color:rgb(var(--color-ink))]">
      {/* Hero Section */}
      <section className="bg-[radial-gradient(40rem_40rem_at_50%_-10%,rgba(37,99,235,0.08),transparent)] mx-auto max-w-content px-4 sm:px-6 py-12">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[color:rgb(var(--color-ink))]">
            Drouple — Built for the Church
          </h1>
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
              Churches struggle with disconnected tools, scattered spreadsheets, and complex systems that pull focus away from ministry.
            </p>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
              Drouple provides one secure, ministry-first platform that brings everything together so you can focus on what matters most — people.
            </p>
          </div>
          <div className="pt-4">
            <Button asChild className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 rounded-xl px-8 py-3 text-lg font-medium shadow-md">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="mx-auto max-w-content px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">The Challenges We See</h2>
          <div className="space-y-6 text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
            <p>
              Every Sunday, dedicated volunteers shuffle through stacks of paper, updating spreadsheets by hand, 
              and sending countless emails just to track who showed up. First-time visitors slip through the cracks 
              because follow-up happens through sticky notes and good intentions.
            </p>
            <p>
              LifeGroup leaders juggle group rosters through text messages, while discipleship progress gets tracked 
              in personal notebooks that only one person can read. When staff changes happen, years of relationship 
              data walks out the door.
            </p>
            <p>
              Event coordination becomes a full-time job of managing Facebook groups, Google Forms, and email threads. 
              Meanwhile, admin teams spend more time wrestling with systems than actually caring for people.
            </p>
            <p>
              Sound familiar? We&apos;ve been there too.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-[color:rgb(var(--color-surface))] mx-auto max-w-content px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Where Drouple Fits</h2>
          <div className="space-y-6 text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
            <p>
              Drouple is not another business CRM trying to fit church life into corporate boxes. 
              It&apos;s a tool built from the ground up for ministry — designed by people who understand 
              the unique rhythms of church community.
            </p>
            <p>
              We help you track members, coordinate LifeGroups, manage events, and guide discipleship 
              pathways — all in one place that actually makes sense for how churches operate. No more 
              juggling five different platforms or losing information in the handoff.
            </p>
            <p>
              This isn&apos;t about efficiency for efficiency&apos;s sake. It&apos;s about creating margin so pastors, 
              leaders, and teams can spend less time on administrative work and more time doing what 
              they&apos;re called to do — caring for people and building God&apos;s kingdom.
            </p>
          </div>
        </div>
      </section>

      {/* Features Snapshot Section */}
      <section className="mx-auto max-w-content px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-12 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4 rounded-xl shadow-md bg-[color:rgb(var(--color-surface))]">
              <h3 className="text-lg font-medium">Member Care</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                Keep secure member directories, manage profiles with privacy controls, and maintain 
                one source of truth for all your people data.
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 rounded-xl shadow-md bg-[color:rgb(var(--color-surface))]">
              <h3 className="text-lg font-medium">VIP Team</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                Never lose track of first-timers again. Track gospel conversations, follow up systematically, 
                and guide new believers through ROOTS discipleship.
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 rounded-xl shadow-md bg-[color:rgb(var(--color-surface))]">
              <h3 className="text-lg font-medium">Discipleship Pathways</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                Guide members through ROOTS foundations, VINES growth groups, and RETREAT experiences 
                with clear progress tracking and automatic enrollment.
              </p>
            </Card>
            
            <Card className="p-6 space-y-4 rounded-xl shadow-md bg-[color:rgb(var(--color-surface))]">
              <h3 className="text-lg font-medium">Multi-Church Ready</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                One secure platform serves multiple local churches while keeping data completely isolated 
                and giving each community full autonomy.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Closing Section */}
      <section className="bg-[color:rgb(var(--color-surface))] mx-auto max-w-content px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-lg text-[color:rgb(var(--color-ink-muted))] leading-relaxed max-w-2xl mx-auto">
            Drouple exists to serve the church. Built with simplicity, security, and ministry in mind — 
            because your calling is too important to get bogged down in administrative complexity.
          </p>
          <Button asChild className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 rounded-xl px-8 py-3 text-lg font-medium shadow-md">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}