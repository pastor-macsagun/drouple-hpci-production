import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen font-['Inter'] bg-surface">
      {/* Clean Navigation */}
      <nav className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
              <span className="text-surface text-lg font-bold">D</span>
            </div>
            <span className="text-2xl font-medium text-ink">drouple</span>
          </div>
          <Button 
            asChild 
            className="bg-ink text-surface hover:bg-ink/90 rounded-lg px-6 py-2 text-sm font-medium shadow-sm"
          >
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section - Clean & Minimal */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-ink leading-tight tracking-tight">
              Church management
              <br />
              <span className="text-ink-muted">made simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-ink-muted font-light max-w-2xl mx-auto leading-relaxed">
              Stop juggling spreadsheets, emails, and paper forms. Drouple brings all your church operations into one unified platform.
            </p>
          </div>
          
          <div className="pt-8">
            <Button 
              asChild 
              className="bg-ink text-surface hover:bg-ink/90 rounded-xl px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="px-6 py-20 bg-elevated">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6">
              Common church problems, solved
            </h2>
            <p className="text-xl text-ink-muted max-w-2xl mx-auto">
              We built Drouple to address the real challenges churches face every week
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            {[
              {
                problem: "Scattered attendance tracking",
                solution: "Sunday Check-In",
                description: "Stop using paper sign-in sheets or multiple systems. Members check themselves in, admins see real-time attendance data.",
                icon: "📱"
              },
              {
                problem: "LifeGroup chaos",
                solution: "LifeGroup Management",
                description: "No more email chains for group membership. Handle join requests, track attendance, and manage groups in one place.",
                icon: "👥"
              },
              {
                problem: "Event coordination headaches",
                solution: "Events & RSVP System",
                description: "Replace Facebook events and Google Forms. Create events, manage RSVPs, handle waitlists, and track payments seamlessly.",
                icon: "📅"
              },
              {
                problem: "Lost first-time visitors",
                solution: "VIP Team System",
                description: "Ensure no first-timer falls through the cracks. Track gospel conversations and discipleship progress from day one.",
                icon: "⭐"
              },
              {
                problem: "Member data scattered everywhere",
                solution: "Unified Member Directory",
                description: "One source of truth for all member information. Assign roles, manage permissions, and maintain accurate records.",
                icon: "👤"
              },
              {
                problem: "Discipleship tracking by memory",
                solution: "Pathway Management",
                description: "Stop relying on memory for discipleship progress. Track ROOTS, VINES, and RETREAT completion automatically.",
                icon: "📈"
              }
            ].map((item, i) => (
              <div key={i} className="bg-surface rounded-xl p-8 shadow-sm border border-border">
                <div className="text-4xl mb-6">{item.icon}</div>
                <div className="space-y-4">
                  <div className="text-sm text-red-600 font-medium">Problem: {item.problem}</div>
                  <h3 className="text-xl font-semibold text-ink">
                    {item.solution}
                  </h3>
                  <p className="text-ink-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Drouple */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-ink mb-6">
            Why we built Drouple
          </h2>
          <div className="space-y-6 text-xl text-ink-muted leading-relaxed">
            <p>
              Church staff spend countless hours managing spreadsheets, coordinating through emails, 
              and trying to keep track of member information across multiple platforms.
            </p>
            <p>
              We experienced this firsthand and knew there had to be a better way. Drouple consolidates 
              everything into one platform that actually works the way churches operate.
            </p>
            <p className="text-ink font-medium">
              Simple. Unified. Built specifically for churches.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specs - Clean Cards */}
      <section className="px-6 py-20 bg-elevated">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-ink mb-6">
              Built for developers
            </h2>
            <p className="text-xl text-ink-muted">
              Modern architecture, comprehensive testing, production-ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Frontend",
                items: ["Next.js 15.1.3", "React 19", "TypeScript", "Tailwind CSS"]
              },
              {
                title: "Backend", 
                items: ["Neon Postgres", "Prisma ORM", "NextAuth v5", "Zod validation"]
              },
              {
                title: "Testing",
                items: ["Vitest", "Playwright", "50% coverage", "GitHub Actions"]
              },
              {
                title: "Architecture",
                items: ["Multi-tenant", "RBAC", "Server Components", "Edge deployment"]
              }
            ].map((tech, i) => (
              <div key={i} className="bg-surface rounded-xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold text-ink mb-4">
                  {tech.title}
                </h3>
                <ul className="space-y-2">
                  {tech.items.map((item, j) => (
                    <li key={j} className="text-ink-muted text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* RBAC Roles */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-semibold text-ink mb-8">Role-Based Access Control</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {['SUPER_ADMIN', 'PASTOR', 'ADMIN', 'VIP', 'LEADER', 'MEMBER'].map((role, i) => (
                <div key={i} className="px-4 py-2 bg-surface border border-border rounded-lg text-ink font-mono text-sm shadow-sm">
                  {role}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean & Focused */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-surface rounded-3xl p-12 shadow-lg border border-border">
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6">
              Ready to simplify your church management?
            </h2>
            <p className="text-xl text-ink-muted mb-10 leading-relaxed">
              Stop juggling multiple systems and spreadsheets. See what Drouple can do for your church.
            </p>
            
            <Button 
              asChild 
              className="bg-ink text-surface hover:bg-ink/90 rounded-xl px-8 py-4 text-lg font-medium shadow-lg"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Clean & Minimal */}
      <footer className="px-6 py-16 bg-elevated">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
                  <span className="text-surface text-lg font-bold">D</span>
                </div>
                <span className="text-2xl font-medium text-ink">drouple</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Church management made simple. Beautiful tools for modern ministry.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-ink mb-4">Features</h4>
              <ul className="space-y-2 text-ink-muted">
                <li>Sunday Check-In</li>
                <li>LifeGroups</li>
                <li>Events & RSVP</li>
                <li>Member Management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-ink mb-4">Support</h4>
              <ul className="space-y-2 text-ink-muted">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Status</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-ink mb-4">Company</h4>
              <ul className="space-y-2 text-ink-muted">
                <li>About</li>
                <li>Blog</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
            <div className="text-ink-muted text-sm mb-4 md:mb-0">
              © 2025 Drouple. All rights reserved.
            </div>
            <div className="text-ink-muted text-sm">
              Built with care for ministry
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}