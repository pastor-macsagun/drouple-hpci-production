import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import LazySection from "./components/LazySection";
import ScrollIndicator from "./components/ScrollIndicator";
import { BRAND_CONFIG } from "@/config/brand";

export const metadata: Metadata = {
  title: BRAND_CONFIG.name,
  description: BRAND_CONFIG.description,
  openGraph: {
    title: BRAND_CONFIG.name,
    description: BRAND_CONFIG.description,
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Apple iPhone-style Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md" role="navigation" aria-label="Main navigation">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex justify-between items-center h-11">
            <div className="text-xl font-semibold text-gray-900 tracking-tight">
              {BRAND_CONFIG.name}
            </div>
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl touch-target" aria-label={`Sign in to ${BRAND_CONFIG.name}`}>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Layered Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-black to-gray-800 text-white">
        {/* Interactive technology background - Desktop only for performance */}
        <div className="absolute inset-0 tech-background hidden md:block">
          {/* Base dark background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-800"></div>
          
          {/* Circuit board pattern */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 24px, rgba(0,255,255,0.3) 25px, rgba(0,255,255,0.3) 26px, transparent 27px, transparent 49px, rgba(0,255,255,0.3) 50px, rgba(0,255,255,0.3) 51px, transparent 52px),
                linear-gradient(0deg, transparent 24px, rgba(0,255,255,0.3) 25px, rgba(0,255,255,0.3) 26px, transparent 27px, transparent 49px, rgba(0,255,255,0.3) 50px, rgba(0,255,255,0.3) 51px, transparent 52px)
              `,
              backgroundSize: '75px 75px'
            }}></div>
          </div>
          
          {/* Interactive hover zones */}
          <div className="absolute inset-0">
            {/* Top-left zone */}
            <div className="absolute top-0 left-0 w-1/3 h-1/3 group cursor-pointer">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/20 transition-all duration-300"></div>
              <div className="absolute top-10 left-10 w-16 h-16 border border-blue-400/30 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-400/20 transition-all duration-300 transform group-hover:rotate-90">
                <div className="absolute inset-2 border border-blue-400/50 group-hover:border-blue-400 transition-all duration-300"></div>
              </div>
              <div className="absolute top-32 left-20 w-8 h-1 bg-blue-400/40 group-hover:bg-blue-400 group-hover:shadow-sm group-hover:shadow-blue-400/50 transition-all duration-300"></div>
              <div className="absolute top-28 left-12 w-1 h-12 bg-blue-400/40 group-hover:bg-blue-400 transition-all duration-300"></div>
            </div>
            
            {/* Top-right zone */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 group cursor-pointer">
              <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/20 transition-all duration-300"></div>
              <div className="absolute top-16 right-16 w-12 h-12 group cursor-pointer">
                <div className="w-3 h-3 bg-cyan-400 rounded-full absolute top-0 left-0 group-hover:animate-ping"></div>
                <div className="w-3 h-3 bg-cyan-400 rounded-full absolute top-0 right-0 group-hover:animate-ping" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-cyan-400 rounded-full absolute bottom-0 left-0 group-hover:animate-ping" style={{animationDelay: '0.4s'}}></div>
                <div className="w-3 h-3 bg-cyan-400 rounded-full absolute bottom-0 right-0 group-hover:animate-ping" style={{animationDelay: '0.6s'}}></div>
              </div>
              <div className="absolute top-8 right-8 w-24 h-0.5 bg-gradient-to-l from-cyan-400 to-transparent opacity-60 group-hover:opacity-100 group-hover:shadow-sm group-hover:shadow-cyan-400/50 transition-all duration-300"></div>
            </div>
            
            {/* Bottom-left zone */}
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 group cursor-pointer">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
              <div className="absolute bottom-20 left-16 w-20 h-20 group cursor-pointer">
                {/* Hexagon shape */}
                <div className="absolute inset-0 transform group-hover:rotate-180 transition-transform duration-500">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400/30 to-transparent" style={{
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                  }}></div>
                </div>
                <div className="absolute inset-2 transform group-hover:-rotate-180 transition-transform duration-700">
                  <div className="w-full h-full bg-emerald-400/50 group-hover:bg-emerald-400 transition-colors duration-300" style={{
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                  }}></div>
                </div>
              </div>
            </div>
            
            {/* Bottom-right zone */}
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 group cursor-pointer">
              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/20 transition-all duration-300"></div>
              <div className="absolute bottom-16 right-20 w-16 h-4 group cursor-pointer">
                <div className="flex gap-1 h-full">
                  <div className="flex-1 bg-purple-400/40 group-hover:bg-purple-400 group-hover:animate-pulse transition-all duration-300"></div>
                  <div className="flex-1 bg-purple-400/40 group-hover:bg-purple-400 group-hover:animate-pulse transition-all duration-300" style={{animationDelay: '0.1s'}}></div>
                  <div className="flex-1 bg-purple-400/40 group-hover:bg-purple-400 group-hover:animate-pulse transition-all duration-300" style={{animationDelay: '0.2s'}}></div>
                  <div className="flex-1 bg-purple-400/40 group-hover:bg-purple-400 group-hover:animate-pulse transition-all duration-300" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
              <div className="absolute bottom-8 right-8 w-0.5 h-16 bg-gradient-to-t from-purple-400 to-transparent opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
            </div>
            
          </div>
          
          {/* Data stream lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-30 animate-data-stream"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-data-stream-reverse"></div>
            <div className="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-35 animate-data-stream" style={{animationDelay: '1s'}}></div>
          </div>
          
          {/* Random moving elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Geometric shapes moving randomly */}
            <div className="absolute top-16 left-10 w-3 h-3 bg-blue-400 opacity-70 animate-random-move-1"></div>
            <div className="absolute top-32 right-20 w-2 h-6 bg-cyan-400 opacity-60 animate-random-move-2"></div>
            <div className="absolute top-48 left-1/4 w-4 h-1 bg-emerald-400 opacity-80 animate-random-move-3"></div>
            <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-purple-400 rounded-full opacity-65 animate-random-move-4"></div>
            <div className="absolute top-64 right-40 w-1 h-8 bg-teal-400 opacity-75 animate-random-move-5"></div>
            <div className="absolute bottom-60 left-1/2 w-5 h-1 bg-indigo-400 opacity-55 animate-random-move-6"></div>
            <div className="absolute top-1/3 left-16 w-1 h-1 bg-pink-400 rounded-full opacity-90 animate-random-move-7"></div>
            <div className="absolute bottom-1/4 right-16 w-3 h-2 bg-yellow-400 opacity-70 animate-random-move-8"></div>
            <div className="absolute top-80 left-2/3 w-2 h-3 bg-red-400 opacity-60 animate-random-move-9"></div>
            <div className="absolute bottom-80 left-20 w-6 h-0.5 bg-green-400 opacity-85 animate-random-move-10"></div>
            <div className="absolute top-1/2 right-60 w-1 h-4 bg-blue-300 opacity-65 animate-random-move-11"></div>
            <div className="absolute bottom-1/3 left-1/3 w-3 h-1 bg-purple-300 opacity-75 animate-random-move-12"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-cyan-300 rounded-full opacity-80 animate-random-move-13"></div>
            <div className="absolute bottom-16 right-1/2 w-4 h-2 bg-emerald-300 opacity-70 animate-random-move-14"></div>
            <div className="absolute top-96 left-1/4 w-1 h-5 bg-indigo-300 opacity-55 animate-random-move-15"></div>
            
            {/* Moving lines */}
            <div className="absolute top-24 left-1/3 w-16 h-0.5 bg-gradient-to-r from-blue-400 to-transparent opacity-60 animate-line-move-1"></div>
            <div className="absolute bottom-48 right-1/4 w-20 h-0.5 bg-gradient-to-l from-purple-400 to-transparent opacity-70 animate-line-move-2"></div>
            <div className="absolute top-2/3 left-8 w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent opacity-50 animate-line-move-3"></div>
            <div className="absolute bottom-32 left-3/4 w-24 h-0.5 bg-gradient-to-l from-emerald-400 to-transparent opacity-65 animate-line-move-4"></div>
            
            {/* Orbiting elements */}
            <div className="absolute top-1/3 left-1/2 w-32 h-32">
              <div className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full opacity-80 animate-orbit-1 origin-center"></div>
              <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-70 animate-orbit-2 origin-center"></div>
              <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-orbit-3 origin-center"></div>
              <div className="absolute top-1/2 right-0 w-2 h-2 bg-emerald-400 rounded-full opacity-75 animate-orbit-4 origin-center"></div>
            </div>
            
            {/* Diagonal moving elements */}
            <div className="absolute top-12 left-12 w-2 h-12 bg-gradient-to-b from-teal-400 to-transparent opacity-60 transform rotate-45 animate-diagonal-move-1"></div>
            <div className="absolute bottom-24 right-24 w-16 h-1 bg-gradient-to-r from-indigo-400 to-transparent opacity-70 transform -rotate-30 animate-diagonal-move-2"></div>
            <div className="absolute top-1/2 left-4 w-8 h-2 bg-gradient-to-r from-pink-400 to-transparent opacity-55 transform rotate-60 animate-diagonal-move-3"></div>
          </div>
        </div>
        
        {/* Mobile-friendly simplified background */}
        <div className="absolute inset-0 md:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-800"></div>
          {/* Simple subtle pattern for mobile */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgb(var(--color-accent)) 0px, transparent 50px),
                               radial-gradient(circle at 80% 80%, rgb(var(--color-accent-secondary)) 0px, transparent 50px),
                               radial-gradient(circle at 40% 60%, rgb(var(--color-accent)) 0px, transparent 30px)`,
              backgroundSize: '200px 200px'
            }}></div>
          </div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 hover:text-accent-secondary transition-colors duration-500 cursor-default">
            {BRAND_CONFIG.name}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-medium mb-4 text-gray-100 tracking-tight">
            {BRAND_CONFIG.tagline}
          </p>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            The most thoughtfully designed church management platform for growing communities worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl touch-target" 
                    aria-label={`Sign in to ${BRAND_CONFIG.name}`}>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <p className="text-sm text-accent-secondary font-semibold" 
               aria-live="polite">
              {BRAND_CONFIG.mobileAppRelease}
            </p>
          </div>
        </div>
        
        {/* Subtle scroll indicator */}
        <ScrollIndicator 
          targetId="member-directory" 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        />
      </section>

      {/* Member Directory - iPhone Style Feature */}
      <section id="member-directory" className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden py-16 sm:py-32" aria-labelledby="member-directory-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="member-directory-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-6">
              Member Directory
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              Secure profiles. Smart search. Complete privacy controls.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-20 border border-gray-200">
              <div className="space-y-12">
                {/* Header with search bar */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent to-accent-secondary rounded-2xl shadow-lg" role="search" aria-label="Member search">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <div className="h-8 bg-white/20 rounded-lg flex-1 backdrop-blur-sm" aria-label="Search input placeholder"></div>
                  <div className="text-white text-sm font-medium" aria-live="polite">247 Members</div>
                </div>
                
                {/* Member Directory Layout */}
                <div className="space-y-6">
                  {/* Member Cards */}
                  <div className="space-y-4">
                    {/* Member 1 - Pastor */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200" role="listitem" aria-label="Pastor - Online">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-secondary rounded-full flex items-center justify-center shadow-md" aria-hidden="true">
                        <span className="text-white font-semibold text-sm">PS</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-32 mb-2" aria-label="Pastor name placeholder"></div>
                        <div className="h-3 bg-accent rounded w-16 text-xs" aria-label="Pastor role badge"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full" aria-label="Online status indicator"></div>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                    
                    {/* Member 2 - Leader */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl" role="listitem" aria-label="Ministry Leader - Last seen 2 hours ago">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md" aria-hidden="true">
                        <span className="text-white font-semibold text-sm">ML</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-28 mb-2" aria-label="Leader name placeholder"></div>
                        <div className="h-3 bg-purple-500 rounded w-14 text-xs" aria-label="Leader role badge"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-400 rounded-full" aria-label="Offline status indicator"></div>
                        <span className="text-xs text-gray-500">2h ago</span>
                      </div>
                    </div>
                    
                    {/* Member 3 - Member */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl" role="listitem" aria-label="Active Member - Online">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md" aria-hidden="true">
                        <span className="text-white font-semibold text-sm">AS</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-36 mb-2" aria-label="Member name placeholder"></div>
                        <div className="h-3 bg-green-500 rounded w-12 text-xs" aria-label="Member role badge"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full" aria-label="Online status indicator"></div>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4" role="group" aria-label="Membership statistics">
                    <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl">
                      <div className="text-2xl font-bold text-accent">47</div>
                      <div className="text-xs text-gray-600">Pastors</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">89</div>
                      <div className="text-xs text-gray-600">Leaders</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">156</div>
                      <div className="text-xs text-gray-600">Active</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">23</div>
                      <div className="text-xs text-gray-600">New</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Profiles</h3>
                <p className="text-gray-600">Detailed member information with contact details, roles, and church assignments.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Privacy</h3>
                <p className="text-gray-600">Role-based access ensures members see only what they&apos;re authorized to view.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Church</h3>
                <p className="text-gray-600">Enterprise architecture supporting multiple local churches with data isolation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sunday Check-ins - iPhone Style Feature */}
      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-b from-white via-accent/5 to-white flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-200 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-accent/5 to-white overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="checkins-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="checkins-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-6">
              Sunday Check-ins
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              One tap. Real-time tracking. No more paper forms.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl p-20 border border-green-100">
              <div className="space-y-12">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-accent-secondary to-accent-secondary/80 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" aria-hidden="true">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-bold text-gray-900">247</div>
                    <div className="text-xl text-gray-600 font-medium tracking-tight">checked in today</div>
                  </div>
                </div>
                
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
                    <div className="w-16 h-16 bg-blue-500 rounded-full"></div>
                    <div className="flex-1 ml-6">
                      <div className="h-6 bg-gray-300 rounded-lg w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
                    </div>
                    <div className="text-green-600 text-2xl font-bold">✓</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
                    <div className="w-16 h-16 bg-purple-500 rounded-full"></div>
                    <div className="flex-1 ml-6">
                      <div className="h-6 bg-gray-300 rounded-lg w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded mt-2 w-1/3"></div>
                    </div>
                    <div className="text-green-600 text-2xl font-bold">✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Self-Service</h3>
                <p className="text-gray-600">Members check themselves in with a simple tap, reducing volunteer workload.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time</h3>
                <p className="text-gray-600">Live attendance dashboard with automatic updates and instant reporting.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Historical Data</h3>
                <p className="text-gray-600">Track attendance patterns and generate comprehensive reports over time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      {/* VIP First-Timer Care - iPhone Style Feature */}
      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-b from-gray-900 via-accent/20 to-gray-900 flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-700 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-700 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-accent/20 to-gray-900 text-white overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="vip-care-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="vip-care-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              VIP First-Timer Care
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              Revolutionary visitor tracking. Never miss a first-time guest.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-accent/50 to-accent/70 rounded-3xl shadow-2xl p-8 sm:p-20 border border-accent/30 backdrop-blur-sm">
              <div className="space-y-12">
                <div className="flex items-center justify-center">
                  <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center shadow-2xl" aria-hidden="true">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="p-8 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl font-semibold text-white">Maria Santos</div>
                      <div className="text-sm text-purple-300 font-semibold bg-purple-500/30 px-3 py-1 rounded-full">ACTIVE</div>
                    </div>
                    <div className="text-gray-300 font-medium tracking-tight">Assigned to VIP Team • First Visit: Jan 28, 2025</div>
                    <div className="mt-4 text-sm text-green-300">✓ Gospel shared • ✓ ROOTS enrolled</div>
                  </div>
                  
                  <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xl font-semibold text-white">John Dela Cruz</div>
                      <div className="text-sm text-green-300 font-semibold bg-green-500/30 px-3 py-1 rounded-full">ENROLLED</div>
                    </div>
                    <div className="text-gray-300 font-medium tracking-tight">ROOTS Pathway • 60% Complete</div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-3/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Instant Tracking</h3>
                <p className="text-gray-300">Automatically create accounts for first-time visitors and assign VIP team members.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Smart Assignment</h3>
                <p className="text-gray-300">Intelligent VIP team dashboard with follow-up assignments and status tracking.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">ROOTS Integration</h3>
                <p className="text-gray-300">Automatic enrollment in discipleship pathways for new believers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      {/* LifeGroups - iPhone Style Feature */}
      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-b from-blue-50 to-accent/5 flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-200 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-accent/5 overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="lifegroups-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="lifegroups-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-6">
              LifeGroups
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              Small group coordination made effortless.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-20 border border-accent/10 hover:border-accent/20 transition-all duration-300">
              <div className="space-y-12">
                <div className="flex items-center justify-center">
                  <div className="w-32 h-32 bg-accent rounded-3xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" aria-hidden="true">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 hover:border-accent/30 transition-all duration-300 hover:shadow-md">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Roster Management</h4>
                    <div className="space-y-3" role="list" aria-label="Example member roster">
                      <div className="flex items-center gap-3" role="listitem">
                        <div className="w-10 h-10 bg-accent rounded-full" aria-hidden="true"></div>
                        <div className="h-4 bg-gray-300 rounded flex-1" aria-label="Member name placeholder"></div>
                      </div>
                      <div className="flex items-center gap-3" role="listitem">
                        <div className="w-10 h-10 bg-green-500 rounded-full" aria-hidden="true"></div>
                        <div className="h-4 bg-gray-300 rounded flex-1" aria-label="Member name placeholder"></div>
                      </div>
                      <div className="flex items-center gap-3" role="listitem">
                        <div className="w-10 h-10 bg-purple-500 rounded-full" aria-hidden="true"></div>
                        <div className="h-4 bg-gray-300 rounded flex-1" aria-label="Member name placeholder"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-green-50 rounded-3xl border border-green-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Join Requests</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-2xl border border-green-200 flex items-center justify-between">
                        <span className="text-sm font-medium">Sarah Kim</span>
                        <div className="flex gap-2">
                          <button className="w-6 h-6 bg-green-500 rounded-full text-white text-xs">✓</button>
                          <button className="w-6 h-6 bg-gray-300 rounded-full text-white text-xs">✕</button>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-green-200 flex items-center justify-between">
                        <span className="text-sm font-medium">Mike Chen</span>
                        <div className="flex gap-2">
                          <button className="w-6 h-6 bg-green-500 rounded-full text-white text-xs">✓</button>
                          <button className="w-6 h-6 bg-gray-300 rounded-full text-white text-xs">✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-orange-50 rounded-3xl border border-orange-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h4>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">85%</div>
                        <div className="text-sm text-gray-600">This Week</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Capacity Management</h3>
                <p className="text-gray-600">Set group limits and automatically handle join requests with capacity checking.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Session Tracking</h3>
                <p className="text-gray-600">Track attendance by session with detailed notes and historical data.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Leader Tools</h3>
                <p className="text-gray-600">Comprehensive dashboard for leaders to manage their groups effectively.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-200 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="events-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="events-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-6">
              Events & RSVP
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              End the Facebook group chaos. Professional event management.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-accent/5 rounded-3xl shadow-2xl p-8 sm:p-20 border border-gray-100 hover:border-accent/20 transition-all duration-300">
              <div className="space-y-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="text-left">
                    <div className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-secondary to-accent-secondary/80 rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105" aria-hidden="true">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V10.5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">Youth Retreat 2025</h4>
                          <p className="text-gray-600">March 15-17, 2025</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-4 bg-gray-50 rounded-2xl">
                          <div className="text-2xl font-bold text-accent-secondary">45</div>
                          <div className="text-sm text-gray-600">Registered</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-2xl">
                          <div className="text-2xl font-bold text-orange-600">5</div>
                          <div className="text-sm text-gray-600">Waitlist</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Registration Fee</span>
                          <span className="font-semibold text-gray-900">₱2,500</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Paid</span>
                          <span className="font-semibold text-green-600">38 of 45</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-100">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Recent RSVPs</h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1e7ce8] rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2 mt-1"></div>
                          </div>
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/3 mt-1"></div>
                          </div>
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Waitlist</h5>
                      <p className="text-gray-600 text-sm mb-3">5 people waiting • Auto-promote when spots open</p>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatic Waitlists</h3>
                <p className="text-gray-600">Smart capacity management with automatic promotion when spots become available.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Tracking</h3>
                <p className="text-gray-600">Track payments and fees with comprehensive reporting and CSV exports.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Role-Based Access</h3>
                <p className="text-gray-600">Control event visibility and access based on member roles and permissions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      {/* Discipleship Pathways - iPhone Style Feature */}
      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-br from-accent via-accent/80 to-accent/90 flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-700 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-700 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-accent/80 to-accent/90 text-white overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="pathways-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 id="pathways-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              Discipleship Pathways
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              Structured spiritual growth from foundations to maturity.
            </p>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl p-20 border border-white/20">
              <div className="space-y-12">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-accent-secondary to-accent-secondary/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" aria-hidden="true">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-4-8h8" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-semibold text-white mb-4 hover:text-accent-secondary transition-colors duration-300 cursor-default">ROOTS</h4>
                    <p className="text-gray-200 mb-6">Foundation pathway for new believers with automatic enrollment</p>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl font-bold text-accent-secondary">127</div>
                      <div className="text-gray-300 text-sm">Active Members</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                        <div className="bg-gradient-to-r from-accent-secondary to-accent-secondary/80 h-2 rounded-full w-3/4"></div>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">75% Average Completion</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-semibold text-white mb-4 hover:text-accent-secondary transition-colors duration-300 cursor-default">VINES</h4>
                    <p className="text-gray-200 mb-6">Growth pathway for maturing believers with opt-in enrollment</p>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl font-bold text-purple-400">89</div>
                      <div className="text-gray-300 text-sm">Active Members</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full w-3/5"></div>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">60% Average Completion</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-semibold text-white mb-4 hover:text-accent-secondary transition-colors duration-300 cursor-default">RETREAT</h4>
                    <p className="text-gray-200 mb-6">Intensive experiences with schedule and attendance tracking</p>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl font-bold text-orange-400">34</div>
                      <div className="text-gray-300 text-sm">Participants</div>
                      <div className="text-xs text-gray-300 mt-3">Next: Leadership Retreat</div>
                      <div className="text-xs text-gray-400">March 22-24, 2025</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                  <h5 className="text-xl font-semibold text-white mb-6">Progress Tracking</h5>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200">Step 1: Foundation</span>
                        <span className="text-green-400">✓ Complete</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200">Step 2: Baptism</span>
                        <span className="text-green-400">✓ Complete</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-200">Step 3: Community</span>
                        <span className="text-orange-400">In Progress</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">67%</div>
                        <div className="text-gray-300 text-sm">Overall Progress</div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-green-500 to-orange-400 h-3 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Auto-Enrollment</h3>
                <p className="text-gray-200">New believers are automatically enrolled in ROOTS pathway during first check-in.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Leader Notes</h3>
                <p className="text-gray-200">Track progress with detailed leader notes and step completion timestamps.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Visual Progress</h3>
                <p className="text-gray-200">Beautiful progress bars and completion tracking for members and leaders.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </LazySection>

      {/* Mobile App - iPhone Style Coming Soon */}
      <LazySection 
        fallback={<div className="min-h-screen bg-gradient-to-b from-black via-accent/10 to-black flex items-center justify-center"><div className="animate-pulse text-center"><div className="h-16 bg-gray-700 rounded-lg w-64 mx-auto mb-4"></div><div className="h-4 bg-gray-700 rounded w-48 mx-auto"></div></div></div>}
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-accent/10 to-black text-white overflow-hidden py-16 sm:py-32"
      >
      <section aria-labelledby="mobile-app-title">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-20">
            <p className="text-lg font-medium text-gray-400 mb-4 tracking-tight">Coming Soon</p>
            <h2 id="mobile-app-title" className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              {BRAND_CONFIG.name} goes mobile
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-medium max-w-4xl mx-auto leading-relaxed tracking-tight">
              Your entire church ecosystem in your pocket. Beautiful, fast, intuitive.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto mb-20">
            <div className="flex flex-col items-center justify-center">
              
              {/* iPhone 14 Pro with realistic frame */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  {/* iPhone Frame with proper dimensions */}
                  <div className="w-80 h-[42rem] bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900 rounded-[3.5rem] p-2 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                    {/* Screen bezel */}
                    <div className="w-full h-full bg-black rounded-[3rem] p-1">
                      {/* Actual screen */}
                      <div className="w-full h-full bg-white rounded-[2.8rem] relative overflow-hidden">
                        <div className="p-6 h-full flex flex-col items-center justify-center">
                          {/* Simple App Logo */}
                          <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center shadow-xl mb-8" aria-hidden="true">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                            </svg>
                          </div>
                          
                          {/* App Title */}
                          <div className="text-center mb-12">
                            <h3 className="text-3xl font-bold text-gray-800 mb-2">{BRAND_CONFIG.name}</h3>
                            <p className="text-gray-500">Church Management System</p>
                          </div>
                          
                          {/* Simple Feature Icons */}
                          <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <div className="w-4 h-4 bg-accent rounded-full" aria-hidden="true"></div>
                              </div>
                              <span className="text-gray-600 text-sm">Check-In</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <div className="w-4 h-4 bg-accent-secondary rounded-full" aria-hidden="true"></div>
                              </div>
                              <span className="text-gray-600 text-sm">Directory</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                              </div>
                              <span className="text-gray-600 text-sm">Events</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              </div>
                              <span className="text-gray-600 text-sm">Groups</span>
                            </div>
                          </div>
                        </div>                      </div>
                    </div>
                  </div>
                  
                </div>
                
                {/* App Store Badges - Both iOS and Android */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
                  <div className="bg-black rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-white">
                      <div className="text-xs opacity-90">Download on the</div>
                      <div className="font-bold text-lg leading-none">App Store</div>
                    </div>
                  </div>
                  
                  <div className="bg-black rounded-xl px-6 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-white">
                      <div className="text-xs opacity-90">Get it on</div>
                      <div className="font-bold text-lg leading-none">Google Play</div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-left mb-12">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-300">One-tap check-ins, instant sync, and real-time updates across all devices.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Complete Access</h3>
                <p className="text-gray-300">Full member directory, LifeGroup management, and event RSVPs on the go.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Smart Notifications</h3>
                <p className="text-gray-300">Intelligent alerts for events, announcements, and ministry opportunities.</p>
              </div>
            </div>
            
            <p className="text-base font-medium text-gray-400 tracking-tight">Expected Q4 2025 • iOS and Android</p>
          </div>
        </div>
      </section>
      </LazySection>

      {/* Footer - Apple minimalist style */}
      <footer className="bg-black text-white py-16" role="contentinfo">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300 mb-2 tracking-tight">
              {BRAND_CONFIG.copyright}
            </p>
            <p className="text-xs font-medium text-gray-400 tracking-tight">
              {BRAND_CONFIG.footerTag}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}