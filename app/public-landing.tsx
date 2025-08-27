import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drouple - Church Management Software | Ministry Made Simple",
  description: "Professional church management platform for Sunday services, LifeGroups, events, and discipleship tracking. Built by pastors for pastors. Free trial available.",
  keywords: [
    "church management software",
    "church management system", 
    "church administration",
    "ministry management",
    "church database",
    "church check-in system",
    "life groups management",
    "church events management",
    "discipleship tracking",
    "church CRM",
    "church software Philippines",
    "Filipino church management"
  ],
  authors: [{ name: "Drouple Team" }],
  creator: "Drouple",
  publisher: "Drouple",
  openGraph: {
    title: "Drouple - Church Management Software | Ministry Made Simple",
    description: "Professional church management platform for Sunday services, LifeGroups, events, and discipleship tracking. Built by pastors for pastors.",
    url: "https://drouple.com",
    siteName: "Drouple",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Drouple Church Management Software"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Drouple - Church Management Software | Ministry Made Simple", 
    description: "Professional church management platform for Sunday services, LifeGroups, events, and discipleship tracking. Built by pastors for pastors.",
    images: ["/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://drouple.com"
  }
};

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Drouple",
    "alternateName": "Drouple Church Management Software",
    "description": "Professional church management platform for Sunday services, LifeGroups, events, and discipleship tracking. Built by pastors for pastors.",
    "url": "https://drouple.com",
    "logo": "https://drouple.com/logo.png",
    "screenshot": "https://drouple.com/screenshot.jpg",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "name": "Free Trial"
    },
    "creator": {
      "@type": "Organization", 
      "name": "Drouple Team",
      "url": "https://drouple.com",
      "description": "Made by a Pastor for Pastors and Church Leaders around the world. Proudly Filipino Made."
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "1"
    },
    "features": [
      "Sunday Service Check-In System",
      "LifeGroups Management", 
      "Events & RSVP Management",
      "Discipleship Pathways Tracking",
      "VIP First-Timer Care",
      "Member Directory & Profiles",
      "Analytics & Reports",
      "Multi-Church Architecture"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <main className="min-h-screen bg-[color:rgb(var(--color-bg))]">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-[color:rgb(var(--color-bg))]/95 backdrop-blur-md border-b border-[color:rgb(var(--color-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-[color:rgb(var(--color-accent))]">Drouple</span>
            </div>
            <Button asChild className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 rounded-xl px-6 py-2 font-semibold shadow-md transition-all duration-200 hover:shadow-lg">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-40" itemScope itemType="https://schema.org/SoftwareApplication">
        {/* Clean background with subtle brand accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:rgb(var(--color-bg))] to-[color:rgb(var(--color-surface))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:rgba(var(--color-accent),0.02)] to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Professional Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <Badge className="bg-[color:rgb(var(--color-accent))]/10 text-[color:rgb(var(--color-accent))] border-[color:rgb(var(--color-accent))]/20 px-4 py-2 text-sm font-semibold shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Church Management System
              </Badge>
            </div>

            {/* Clean, Professional Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8" itemProp="name">
              <span className="block text-[color:rgb(var(--color-ink))] mb-3">
                Ministry made
              </span>
              <span className="block bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent">
                simple
              </span>
            </h1>

            {/* Clear, Readable Subtitle */}
            <p className="text-xl md:text-2xl text-[color:rgb(var(--color-ink-muted))] max-w-4xl mx-auto mb-12 leading-relaxed font-medium" itemProp="description">
              Stop wrestling with spreadsheets and disconnected tools.<br className="hidden md:block" />
              Drouple brings your entire church ecosystem into one <span className="text-[color:rgb(var(--color-ink))] font-semibold">beautifully simple platform</span>.
            </p>

            {/* Professional Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent))] rounded-full shadow-sm" />
                Member Directory
              </div>
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent-secondary))] rounded-full shadow-sm" />
                Sunday Check-ins
              </div>
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent))] rounded-full shadow-sm" />
                VIP First-Timer Tracking
              </div>
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent-secondary))] rounded-full shadow-sm" />
                LifeGroups Management
              </div>
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent))] rounded-full shadow-sm" />
                Discipleship Pathways
              </div>
              <div className="inline-flex items-center gap-3 bg-[color:rgb(var(--color-surface))] px-5 py-3 rounded-2xl text-sm font-semibold text-[color:rgb(var(--color-ink))] shadow-sm border border-[color:rgb(var(--color-border))] hover:shadow-md transition-shadow">
                <div className="w-3 h-3 bg-[color:rgb(var(--color-accent-secondary))] rounded-full shadow-sm" />
                Events & RSVP
              </div>
            </div>

            {/* Professional CTA */}
            <div className="flex flex-col items-center mb-16">
              <Button asChild size="lg" className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl px-12 py-4 text-lg font-bold transition-all duration-200 shadow-md mb-4">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <p className="text-base text-[color:rgb(var(--color-ink-muted))] font-medium">
                New to Drouple? Contact your church administrator for access
              </p>
            </div>

            {/* Subtle scroll indicator */}
            <div className="flex justify-center pt-8">
              <div className="animate-bounce">
                <svg className="w-5 h-5 text-[color:rgb(var(--color-ink-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-24 md:py-32">
        {/* Clean background with subtle tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:rgb(var(--color-surface))] to-[color:rgb(var(--color-elevated))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-50 text-amber-800 border-amber-200 px-4 py-2 text-sm font-semibold mb-8">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Common Challenges
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[color:rgb(var(--color-ink))] mb-6 max-w-4xl mx-auto leading-tight">
              The Ministry Management <span className="text-amber-600">Struggle</span> Is Real
            </h2>
            <p className="text-xl md:text-2xl text-[color:rgb(var(--color-ink-muted))] max-w-4xl mx-auto leading-relaxed font-medium">
              Churches everywhere are drowning in disconnected tools and manual processes.<br className="hidden md:block" />
              Sound familiar?
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-16 h-16 bg-[color:rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-7.5v0a1.5 1.5 0 01-3 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Paper & Spreadsheet Chaos</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed text-lg">
                Volunteers shuffle paper forms, manually update spreadsheets, and send endless emails just to track basic attendance. 
                First-time visitors slip through cracks because follow-up depends on sticky notes and good intentions.
              </p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-16 h-16 bg-[color:rgb(var(--color-accent-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Lost Data & Relationships</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed text-lg">
                LifeGroup rosters live in text messages. Discipleship progress sits in personal notebooks. 
                When staff changes happen, years of relationship data and ministry momentum walks out the door.
              </p>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-16 h-16 bg-[color:rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Administrative Overload</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed text-lg">
                Event coordination becomes a full-time job of managing Facebook groups, Google Forms, and email threads. 
                Admin teams spend more time wrestling with systems than actually caring for people.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-24 md:py-32">
        {/* Clean background */}
        <div className="absolute inset-0 bg-[color:rgb(var(--color-bg))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:rgba(var(--color-accent),0.02)] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="bg-[color:rgb(var(--color-accent))]/10 text-[color:rgb(var(--color-accent))] border-[color:rgb(var(--color-accent))]/20 px-4 py-2 text-sm font-semibold mb-8">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              The Solution
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[color:rgb(var(--color-ink))] mb-6 max-w-4xl mx-auto leading-tight">
              Built for Ministry,<br />
              <span className="bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent font-bold">
                Not Corporate Boxes
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[color:rgb(var(--color-ink-muted))] max-w-4xl mx-auto leading-relaxed font-medium">
              Drouple isn't another business CRM trying to squeeze church life into corporate templates.<br className="hidden md:block" />
              It's purpose-built for ministry by people who understand the unique rhythms of church community.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-8">
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))] rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[color:rgb(var(--color-ink))] mb-3">One Unified Platform</h3>
                    <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                      Track members, coordinate LifeGroups, manage events, and guide discipleship pathways -
                      all in one place that actually makes sense for how churches operate.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[color:rgb(var(--color-accent-secondary))] rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3.708-8.968A3.375 3.375 0 0119.5 4.5h.75a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 18.75V6.75a2.25 2.25 0 012.25-2.25h.75a3.375 3.375 0 017.5 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[color:rgb(var(--color-ink))] mb-3">Security You Can Trust</h3>
                    <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                      Multi-tenant architecture keeps each church's data completely isolated. 
                      Enterprise-grade security protects your community's sensitive information.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))] rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[color:rgb(var(--color-ink))] mb-3">Focus on People</h3>
                    <p className="text-[color:rgb(var(--color-ink-muted))] leading-relaxed">
                      Create margin so pastors, leaders, and teams spend less time on administrative work 
                      and more time doing what they're called to do: caring for people and building God's kingdom.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="lg:pl-8">
              <Card className="p-10 bg-gradient-to-br from-[color:rgb(var(--color-surface))] to-[color:rgb(var(--color-elevated))] border-[color:rgb(var(--color-border))] shadow-lg">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[color:rgb(var(--color-accent))] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <span className="text-white font-bold text-2xl">D</span>
                  </div>
                </div>
                <blockquote className="text-xl italic text-[color:rgb(var(--color-ink-muted))] mb-8 text-center leading-relaxed font-medium">
                  "This isn't about efficiency for efficiency's sake. It's about creating margin for what matters most."
                </blockquote>
                <div className="text-center">
                  <div className="font-bold text-lg text-[color:rgb(var(--color-ink))] mb-1">Drouple Team</div>
                  <div className="text-[color:rgb(var(--color-ink-muted))] font-medium">Built by church leaders, for church leaders</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Features Section */}
      <section className="relative py-24 md:py-32">
        {/* Clean background with subtle elevation */}
        <div className="absolute inset-0 bg-gradient-to-br from-[color:rgb(var(--color-surface))] to-[color:rgb(var(--color-elevated))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[color:rgb(var(--color-ink))] mb-8 max-w-4xl mx-auto leading-tight">
              Everything You Need for <span className="bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent">Ministry Management</span>
            </h2>
            <p className="text-xl md:text-2xl text-[color:rgb(var(--color-ink-muted))] max-w-4xl mx-auto leading-relaxed font-medium">
              From Sunday services to discipleship journeys, Drouple provides comprehensive tools designed specifically for church ministry.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Member Directory */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Member Directory & Profiles</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                Complete member management with secure directories, detailed profiles, and granular privacy controls. 
                Role-based access ensures members see only what they're authorized to view.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Searchable member directory with privacy settings
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Complete profile management with contact info
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Role-based access control and CSV exports
                </li>
              </ul>
            </Card>
            
            {/* Sunday Services */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Sunday Service Check-In</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                Digital attendance tracking that works. Members check themselves in, administrators get real-time 
                counts, and you get comprehensive attendance reports.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Self-service member check-in
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Real-time attendance dashboard
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Service management with historical data
                </li>
              </ul>
            </Card>
            
            {/* VIP First-Timer Tracking */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">VIP First-Timer Tracking</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                Revolutionary first-timer management system. Immediate account creation for visitors, VIP team assignments, 
                gospel conversation tracking, and automatic ROOTS pathway enrollment for new believers.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Instant visitor account creation and tracking
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Believer status management (Active/Inactive/Completed)
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  VIP team dashboard with follow-up assignments
                </li>
              </ul>
            </Card>
            
            {/* LifeGroups */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">LifeGroups Management</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                Streamline small group coordination. Manage rosters, track attendance, handle join requests, 
                and give leaders the tools they need to focus on community building.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Group creation with capacity management
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Join request approval workflow
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Session-based attendance tracking
                </li>
              </ul>
            </Card>
            
            {/* Events */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V10.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Events & RSVP Management</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                End the Facebook group chaos. Create events, manage RSVPs, handle waitlists automatically, 
                and track payments - all without leaving the platform.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Event creation with capacity & fees
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Automatic waitlist management
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent))] rounded-full mr-3 flex-shrink-0"></div>
                  Payment tracking and reporting
                </li>
              </ul>
            </Card>
            
            {/* Discipleship Pathways */}
            <Card className="p-8 text-center hover:shadow-lg transition-all duration-200 border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-bg))]">
              <div className="w-14 h-14 bg-[color:rgb(var(--color-accent-secondary))] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[color:rgb(var(--color-ink))] mb-4">Discipleship Pathways</h3>
              <p className="text-[color:rgb(var(--color-ink-muted))] mb-6 text-lg leading-relaxed">
                Structured spiritual growth system with three pathway types: ROOTS (foundations), VINES (growth), 
                and RETREAT (intensive experiences). Progress tracking with leader notes and automatic completion.
              </p>
              <ul className="text-[color:rgb(var(--color-ink-muted))] space-y-3 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Three pathway types with auto-enrollment
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Visual progress bars and step completion
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-[color:rgb(var(--color-accent-secondary))] rounded-full mr-3 flex-shrink-0"></div>
                  Leader notes and pathway management
                </li>
              </ul>
            </Card>
          </div>
          
          {/* Revolutionary Mobile App Coming Soon */}
          <div className="mt-20">
            <Card className="p-12 text-center bg-gradient-to-br from-[color:rgb(var(--color-surface))] to-[color:rgb(var(--color-elevated))] border-[color:rgb(var(--color-border))] shadow-lg">
              <Badge className="bg-[color:rgb(var(--color-accent))] text-white px-6 py-3 text-sm font-bold mb-8 shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3v-.5z" />
                </svg>
                MOBILE APP COMING SOON
              </Badge>
              
              <h3 className="text-3xl md:text-4xl font-bold text-[color:rgb(var(--color-ink))] mb-6 max-w-3xl mx-auto leading-tight">
                The Future of Church Mobile Apps <span className="bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent">Is Coming Soon</span>
              </h3>
              
              <p className="text-lg md:text-xl text-[color:rgb(var(--color-ink-muted))] max-w-4xl mx-auto leading-relaxed mb-12 font-medium">
                We're not just building another church app. We're creating the <span className="font-bold text-[color:rgb(var(--color-ink))]">most intuitive, powerful, and beautiful</span> mobile church experience ever designed. 
                Imagine your entire church ecosystem in your pocket with stunning design and lightning-fast performance.
              </p>

              {/* Feature highlights */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                <div className="bg-[color:rgb(var(--color-bg))] rounded-2xl p-6 border border-[color:rgb(var(--color-border))] shadow-sm">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3v-.5z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-[color:rgb(var(--color-ink))] mb-2">Lightning Fast Check-ins</h4>
                  <p className="text-sm text-[color:rgb(var(--color-ink-muted))]">One-tap Sunday service check-ins with real-time sync</p>
                </div>
                
                <div className="bg-[color:rgb(var(--color-bg))] rounded-2xl p-6 border border-[color:rgb(var(--color-border))] shadow-sm">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent-secondary))] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-[color:rgb(var(--color-ink))] mb-2">Seamless Connection</h4>
                  <p className="text-sm text-[color:rgb(var(--color-ink-muted))]">Instantly connect with members, browse directory, join LifeGroups</p>
                </div>
                
                <div className="bg-[color:rgb(var(--color-bg))] rounded-2xl p-6 border border-[color:rgb(var(--color-border))] shadow-sm">
                  <div className="w-12 h-12 bg-[color:rgb(var(--color-accent))] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-[color:rgb(var(--color-ink))] mb-2">Smart Notifications</h4>
                  <p className="text-sm text-[color:rgb(var(--color-ink-muted))]">Intelligent alerts for events, announcements, and discipleship</p>
                </div>
              </div>
              
              {/* Coming to both platforms */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-8">
                <div className="flex items-center gap-4 bg-[color:rgb(var(--color-bg))] px-6 py-4 rounded-2xl border border-[color:rgb(var(--color-border))] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[color:rgb(var(--color-ink))]">iOS App Store</div>
                    <div className="text-sm text-[color:rgb(var(--color-ink-muted))]">iPhone & iPad</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-[color:rgb(var(--color-bg))] px-6 py-4 rounded-2xl border border-[color:rgb(var(--color-border))] shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[color:rgb(var(--color-ink))]">Google Play</div>
                    <div className="text-sm text-[color:rgb(var(--color-ink-muted))]">Android Devices</div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[color:rgb(var(--color-ink-muted))] font-medium">
                Currently in development • Expected launch Q4 2025 • Built with modern native frameworks for optimal performance
              </p>
            </Card>
          </div>

          {/* Multi-Church Architecture */}
          <div className="mt-16 text-center max-w-4xl mx-auto">
            <Badge className="bg-[color:rgb(var(--color-accent))]/10 text-[color:rgb(var(--color-accent))] border-[color:rgb(var(--color-accent))]/20 px-4 py-2 text-sm font-semibold mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3.708-8.968A3.375 3.375 0 0119.5 4.5h.75a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H2.25A2.25 2.25 0 010 18.75V6.75a2.25 2.25 0 012.25-2.25h.75a3.375 3.375 0 017.5 0z" />
              </svg>
              Enterprise Multi-Church Architecture
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-[color:rgb(var(--color-ink))] mb-6">
              Designed for Church Networks & Denominations
            </h3>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] leading-relaxed font-medium">
              One secure platform serves multiple local churches while keeping data completely isolated. 
              Each community maintains full autonomy while benefiting from shared infrastructure, 
              enterprise-grade security, and centralized oversight when needed.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32">
        {/* Clean background */}
        <div className="absolute inset-0 bg-[color:rgb(var(--color-bg))]" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[color:rgba(var(--color-accent),0.02)] to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[color:rgb(var(--color-ink))] mb-8 max-w-4xl mx-auto leading-tight">
              Ready to Focus on <span className="bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent">Ministry?</span>
            </h2>
            <p className="text-xl md:text-2xl text-[color:rgb(var(--color-ink-muted))] leading-relaxed max-w-4xl mx-auto mb-12 font-medium">
              Drouple exists to serve the church. Built with simplicity, security, and ministry in mind,
              because your calling is too important to get bogged down in administrative complexity.
            </p>
            <div className="flex flex-col items-center">
              <Button asChild size="lg" className="bg-[color:rgb(var(--color-accent))] text-[color:rgb(var(--color-accent-ink))] hover:bg-[color:rgb(var(--color-accent))]/90 hover:shadow-lg hover:-translate-y-0.5 rounded-2xl px-12 py-6 text-xl font-bold transition-all duration-200 shadow-md mb-6">
                <Link href="/auth/signin">Sign In to Your Church</Link>
              </Button>
              <p className="text-base text-[color:rgb(var(--color-ink-muted))] font-medium">
                Built with enterprise-grade security • Ready for early adopters
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative py-16 bg-gradient-to-br from-[color:rgb(var(--color-surface))] to-[color:rgb(var(--color-elevated))] border-t border-[color:rgb(var(--color-border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[color:rgb(var(--color-accent))] to-[color:rgb(var(--color-accent-secondary))] bg-clip-text text-transparent mb-6">Drouple</div>
            <p className="text-lg text-[color:rgb(var(--color-ink-muted))] mb-12 leading-relaxed font-medium">
              Church management made simple. Beautiful tools for modern ministry.
            </p>
            <Card className="p-6 bg-[color:rgb(var(--color-bg))] border-[color:rgb(var(--color-border))] shadow-sm inline-block">
              <p className="text-[color:rgb(var(--color-ink-muted))] font-medium">
                © 2025 Drouple. Made by a Pastor for Pastors and Church Leaders around the world.<br />
                Proudly Filipino Made 🇵🇭
              </p>
            </Card>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}