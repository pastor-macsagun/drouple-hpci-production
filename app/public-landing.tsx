import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[color:rgb(var(--color-bg))] via-[color:rgb(var(--color-bg))] to-[color:rgba(var(--color-accent),0.03)]">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-[color:rgb(var(--color-bg))]/80 border-b border-[color:rgb(var(--color-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <span className="text-xl font-semibold text-[color:rgb(var(--color-ink))]">Drouple</span>
            </div>
            <Button asChild className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 rounded-lg px-6 py-2 font-medium">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:rgb(var(--color-bg))] via-[color:rgb(var(--color-bg))] to-[color:rgba(var(--color-accent),0.05)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(37,99,235,0.12),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.12),transparent_50%),radial-gradient(circle_at_40%_40%,rgba(16,185,129,0.12),transparent_50%)]" />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-transparent opacity-20 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-purple-400 to-transparent opacity-20 rounded-full blur-lg animate-bounce" style={{animationDelay: '1s'}} />
          <div className="absolute bottom-40 left-32 w-20 h-20 bg-gradient-to-r from-emerald-400 to-transparent opacity-20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}} />
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-[color:rgb(var(--color-accent-secondary))] to-transparent opacity-20 rounded-full blur-xl animate-bounce" style={{animationDelay: '0.5s'}} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <Badge className="bg-[color:rgb(var(--color-accent))]/10 text-[color:rgb(var(--color-accent))] border-[color:rgb(var(--color-accent))]/20 px-4 py-2 text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Church Management System
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="block text-[color:rgb(var(--color-ink))] mb-2">
                Ministry made
              </span>
              <span className="block text-[color:rgb(var(--color-accent))] text-5xl md:text-7xl lg:text-8xl">
                simple
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-[color:rgb(var(--color-ink-muted))] max-w-3xl mx-auto mb-10 leading-relaxed">
              Stop wrestling with spreadsheets and disconnected tools. <br className="hidden md:block" />
              Drouple brings your entire church ecosystem into one <span className="font-semibold text-[color:rgb(var(--color-ink))]">beautifully simple platform</span>.
            </p>

            {/* Key Features */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <span className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-surface))] px-4 py-2 rounded-full text-sm font-medium text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))]">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Member Management
              </span>
              <span className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-surface))] px-4 py-2 rounded-full text-sm font-medium text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))]">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Service Check-ins
              </span>
              <span className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-surface))] px-4 py-2 rounded-full text-sm font-medium text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))]">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                LifeGroups
              </span>
              <span className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-surface))] px-4 py-2 rounded-full text-sm font-medium text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))]">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Events & RSVP
              </span>
              <span className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-surface))] px-4 py-2 rounded-full text-sm font-medium text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))]">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                Discipleship Tracking
              </span>
            </div>

            {/* Single CTA */}
            <div className="flex flex-col items-center mb-20">
              <Button asChild size="lg" className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 hover:shadow-xl hover:scale-105 rounded-xl px-12 py-4 text-lg font-bold transition-all duration-300 shadow-lg mb-4">
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <p className="text-sm text-[color:rgb(var(--color-ink-muted))] text-center">
                New to Drouple? Contact your church administrator for access
              </p>
            </div>

            {/* Scroll indicator */}
            <div className="animate-bounce mt-20">
              <svg className="w-6 h-6 mx-auto text-[color:rgb(var(--color-ink-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

      </section>

      {/* Problem Section */}
      <section className="py-20 bg-[color:rgb(var(--color-surface))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:rgb(var(--color-ink))] mb-6">
              The Ministry Management Struggle Is Real
            </h2>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] max-w-3xl mx-auto">
              Churches everywhere are drowning in disconnected tools and manual processes. Sound familiar?
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Paper & Spreadsheet Chaos</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                Volunteers shuffle paper forms, manually update spreadsheets, and send endless emails just to track basic attendance. 
                First-time visitors slip through cracks because follow-up depends on sticky notes and good intentions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Lost Data & Relationships</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                LifeGroup rosters live in text messages. Discipleship progress sits in personal notebooks. 
                When staff changes happen, years of relationship data and ministry momentum walks out the door.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Administrative Overload</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                Event coordination becomes a full-time job of managing Facebook groups, Google Forms, and email threads. 
                Admin teams spend more time wrestling with systems than actually caring for people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:rgb(var(--color-ink))] mb-6">
              Built for Ministry, Not Corporate Boxes
            </h2>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] max-w-3xl mx-auto leading-relaxed">
              Drouple isn&apos;t another business CRM trying to squeeze church life into corporate templates. 
              It&apos;s purpose-built for ministry by people who understand the unique rhythms of church community.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-2">One Unified Platform</h3>
                  <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                    Track members, coordinate LifeGroups, manage events, and guide discipleship pathways — 
                    all in one place that actually makes sense for how churches operate.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-2">Security You Can Trust</h3>
                  <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                    Multi-tenant architecture keeps each church&apos;s data completely isolated. 
                    Enterprise-grade security protects your community&apos;s sensitive information.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[color:rgb(var(--color-accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-2">Focus on People</h3>
                  <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                    Create margin so pastors, leaders, and teams spend less time on administrative work 
                    and more time doing what they&apos;re called to do — caring for people and building God&apos;s kingdom.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-[color:rgb(var(--color-accent))]/5 to-[color:rgb(var(--color-accent-secondary))]/5 rounded-2xl p-8 border border-[color:rgb(var(--color-border))]">
                <blockquote className="text-lg italic text-[color:rgb(var(--color-ink-muted))] mb-6">
                  &ldquo;This isn&apos;t about efficiency for efficiency&apos;s sake. It&apos;s about creating margin for what matters most.&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))] rounded-full flex items-center justify-center">
                    <span className="text-[color:rgb(var(--color-accent-ink))] font-semibold">D</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[color:rgb(var(--color-ink))]">Drouple Team</div>
                    <div className="text-sm text-[color:rgb(var(--color-ink-muted))]">Built by church leaders, for church leaders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Features Section */}
      <section className="py-20 bg-[color:rgb(var(--color-surface))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:rgb(var(--color-ink))] mb-6">
              Everything You Need for Ministry Management
            </h2>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] max-w-3xl mx-auto">
              From Sunday services to discipleship journeys, Drouple provides comprehensive tools designed specifically for church ministry.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Member Management */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197v1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Member Care & Directory</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                Secure member directories with role-based access. Track contact information, family relationships, 
                and ministry involvement all in one protected space.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Member profiles with privacy controls
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Role-based access (Pastor, Admin, Leader, Member)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  CSV export for reports and communication
                </li>
              </ul>
            </Card>
            
            {/* Sunday Services */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Sunday Service Check-In</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                Digital attendance tracking that works. Members check themselves in, administrators get real-time 
                counts, and you get comprehensive attendance reports.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Self-service member check-in
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Real-time attendance dashboard
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Service management with historical data
                </li>
              </ul>
            </Card>
            
            {/* VIP Team & First Timers */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">VIP Team & First Timers</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                Never lose track of visitors again. Systematic follow-up for first-time guests, gospel conversation 
                tracking, and seamless integration with discipleship pathways.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  First-timer tracking and follow-up
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Gospel conversation logging
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Auto-enrollment in ROOTS pathway
                </li>
              </ul>
            </Card>
            
            {/* LifeGroups */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">LifeGroups Management</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                Streamline small group coordination. Manage rosters, track attendance, handle join requests, 
                and give leaders the tools they need to focus on community building.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Group creation with capacity management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Join request approval workflow
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Session-based attendance tracking
                </li>
              </ul>
            </Card>
            
            {/* Events */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Events & RSVP Management</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                End the Facebook group chaos. Create events, manage RSVPs, handle waitlists automatically, 
                and track payments — all without leaving the platform.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Event creation with capacity & fees
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Automatic waitlist management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Payment tracking and reporting
                </li>
              </ul>
            </Card>
            
            {/* Discipleship Pathways */}
            <Card className="p-8 rounded-2xl shadow-sm border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))] hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Discipleship Pathways</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed mb-6">
                Guide spiritual growth systematically. ROOTS foundations, VINES growth groups, and RETREAT experiences 
                with progress tracking and automatic enrollment for new believers.
              </p>
              <ul className="space-y-2 text-sm text-[color:rgb(var(--color-ink-muted))]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Three pathway types (ROOTS, VINES, RETREAT)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Step-by-step progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[color:rgb(var(--color-accent))] rounded-full" />
                  Auto-enroll new believers in ROOTS
                </li>
              </ul>
            </Card>
          </div>
          
          {/* Multi-Church Architecture */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 bg-[color:rgb(var(--color-accent))]/10 text-[color:rgb(var(--color-accent))] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Enterprise Multi-Church Architecture
            </div>
            <h3 className="text-2xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">
              Designed for Church Networks & Denominations
            </h3>
            <p className="text-[color:rgb(var(--color-ink-muted))] max-w-3xl mx-auto leading-relaxed">
              One secure platform serves multiple local churches while keeping data completely isolated. 
              Each community maintains full autonomy while benefiting from shared infrastructure, 
              enterprise-grade security, and centralized oversight when needed.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:rgb(var(--color-ink))]">
              Ready to Focus on Ministry?
            </h2>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] leading-relaxed max-w-3xl mx-auto">
              Drouple exists to serve the church. Built with simplicity, security, and ministry in mind — 
              because your calling is too important to get bogged down in administrative complexity.
            </p>
            <div className="pt-4">
              <Button asChild size="lg" className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 rounded-xl px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <Link href="/auth/signin">Sign In to Your Church</Link>
              </Button>
              <p className="text-sm text-[color:rgb(var(--color-ink-muted))] mt-4">
                Built with enterprise-grade security • Ready for early adopters
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-[color:rgb(var(--color-surface))] py-12 border-t border-[color:rgb(var(--color-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-semibold text-[color:rgb(var(--color-ink))] mb-4">Drouple</div>
            <p className="text-[color:rgb(var(--color-ink-muted))] mb-8 max-w-md mx-auto">
              Church management made simple. Beautiful tools for modern ministry.
            </p>
            <div className="text-sm text-[color:rgb(var(--color-ink-muted))]">
              © 2025 Drouple. Made by a Pastor for Pastors and Church Leaders around the world. Proudly Filipino Made 🇵🇭
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}