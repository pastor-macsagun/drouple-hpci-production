import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Drouple – Ministry Without the Mess",
  description:
    "The only church management platform that feels like it was made by people who actually run churches. Clean, intuitive, powerful.",
  openGraph: {
    title: "Drouple – Ministry Without the Mess",
    description:
      "Clean, intuitive church management that just works. Built for real ministry.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Skip to content
      </a>

      <main id="main" className="min-h-screen bg-white dark:bg-gray-950">
        {/* ENHANCED HERO WITH ANIMATED BACKGROUNDS */}
        <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50/30 dark:from-blue-950 dark:via-gray-900 dark:to-green-950/30">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {/* Floating gradient orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse [animation-duration:4s]"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-green-200/15 to-emerald-200/15 dark:from-green-600/8 dark:to-emerald-600/8 rounded-full blur-3xl animate-pulse [animation-duration:6s] [animation-delay:1s]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/10 to-green-200/10 dark:from-blue-600/5 dark:to-green-600/5 rounded-full blur-3xl animate-spin [animation-duration:20s]"></div>
            
            {/* Moving geometric shapes */}
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce [animation-duration:3s]"></div>
            <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-green-400/40 rounded-full animate-ping [animation-duration:4s]"></div>
            <div className="absolute top-1/3 left-3/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse [animation-duration:5s]"></div>
          </div>
          
          {/* Subtle geometric grid */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+CjwvZz4KPC9nPgo8L3N2Zz4=')] bg-repeat animate-pulse [animation-duration:8s]"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Minimal badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200/50 dark:border-blue-700/30">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
              Introducing Drouple
            </div>

            {/* Clean typography */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Ministry without
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">the mess</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The first church management platform that feels like it was designed by people who actually run churches.
            </p>

            {/* Simple CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                asChild 
                size="lg" 
                className="group relative px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <Link href="/auth/signin">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <div className="w-2 h-2 bg-white/80 rounded-full group-hover:animate-ping"></div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>
                </Link>
              </Button>
              
              <button className="text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-600 hover:to-green-600 hover:bg-clip-text hover:text-transparent transition-all duration-300 text-lg font-medium">
                See how it works →
              </button>
            </div>

            {/* Enhanced feature preview with cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: "⚡", label: "Setup in minutes", desc: "Get your church online in under 30 minutes" },
                { icon: "🎯", label: "Built for churches", desc: "Designed specifically for ministry workflows" },
                { icon: "🔒", label: "Secure by design", desc: "Enterprise-grade security for your data" },
              ].map((item, index) => (
                <div key={item.label} className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                     style={{ animationDelay: `${index * 200}ms` }}>
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION - ENHANCED WITH SUBTLE ANIMATION */}
        <section className="relative py-24 bg-gradient-to-b from-blue-50/30 to-white dark:from-blue-900/20 dark:to-gray-800 overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100/20 to-cyan-100/20 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-full blur-3xl animate-pulse [animation-duration:7s]"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-100/15 to-emerald-100/15 dark:from-green-900/8 dark:to-emerald-900/8 rounded-full blur-3xl animate-pulse [animation-duration:5s] [animation-delay:2s]"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Why church software is broken
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Most platforms are generic tools forcing churches to adapt. 
                We flipped that around.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Problems list */}
              <div className="space-y-6">
                {[
                  "Complicated interfaces that need training manuals",
                  "One-size-fits-all features that don't fit churches", 
                  "Expensive monthly fees that keep growing",
                  "Data scattered across multiple platforms",
                  "No mobile-first design for busy volunteers"
                ].map((problem, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">{problem}</p>
                  </div>
                ))}
              </div>

              {/* Enhanced visual element with animation */}
              <div className="relative">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                  <div className="text-center relative">
                    {/* Animated icon */}
                    <div className="relative inline-block mb-6">
                      <div className="text-7xl animate-bounce [animation-duration:3s]">🤔</div>
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400/60 rounded-full animate-ping [animation-duration:2s]"></div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-700 dark:from-blue-300 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
                      Sound familiar?
                    </h3>
                    
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                      You&apos;re spending more time managing your management system than actually doing ministry.
                    </p>
                    
                    {/* Subtle indicators */}
                    <div className="flex justify-center gap-2 mt-6">
                      <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse [animation-delay:0s]"></div>
                      <div className="w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse [animation-delay:0.5s]"></div>
                      <div className="w-2 h-2 bg-green-400/60 rounded-full animate-pulse [animation-delay:1s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE SOLUTION - ENHANCED WITH MOVEMENT */}
        <section className="relative py-24 bg-gradient-to-b from-white to-green-50/30 dark:from-gray-950 dark:to-green-900/20 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-56 h-56 bg-gradient-to-r from-green-200/20 to-emerald-200/20 dark:from-green-800/10 dark:to-emerald-800/10 rounded-full blur-3xl animate-pulse [animation-duration:6s]"></div>
            <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-200/15 to-cyan-200/15 dark:from-blue-800/8 dark:to-cyan-800/8 rounded-full blur-3xl animate-pulse [animation-duration:8s] [animation-delay:1.5s]"></div>
            
            {/* Floating particles */}
            <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-green-500/40 rounded-full animate-ping [animation-duration:6s]"></div>
            <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce [animation-duration:4s] [animation-delay:1s]"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Here&apos;s our approach
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Instead of making churches adapt to software, we made software that adapts to churches.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🏗️",
                  title: "Built by church people",
                  desc: "Our team includes pastors, worship leaders, and ministry directors who understand your daily challenges."
                },
                {
                  icon: "🎯", 
                  title: "Church-first design",
                  desc: "Every feature starts with real church workflows. Sunday services, life groups, discipleship—it all just makes sense."
                },
                {
                  icon: "⚡",
                  title: "Actually simple",
                  desc: "No complex setup. No training required. Your volunteers will figure it out in minutes, not months."
                }
              ].map((solution) => (
                <div key={solution.title} className="text-center">
                  <div className="text-5xl mb-6">{solution.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{solution.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{solution.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES - WITH DYNAMIC BACKGROUNDS */}
        <section className="relative py-24 bg-gradient-to-b from-blue-50/40 to-green-50/30 dark:from-blue-950/20 dark:to-green-950/20 overflow-hidden">
          {/* Dynamic background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 right-20 w-80 h-80 bg-gradient-to-bl from-blue-200/20 to-green-200/20 dark:from-blue-800/10 dark:to-green-800/10 rounded-full blur-3xl animate-spin [animation-duration:25s]"></div>
            <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-cyan-200/15 to-emerald-200/15 dark:from-cyan-800/8 dark:to-emerald-800/8 rounded-full blur-3xl animate-pulse [animation-duration:9s]"></div>
            
            {/* Grid overlay with animation */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24px,rgba(59,130,246,0.1)_25px,rgba(59,130,246,0.1)_26px,transparent_27px),linear-gradient(-45deg,transparent_24px,rgba(34,197,94,0.1)_25px,rgba(34,197,94,0.1)_26px,transparent_27px)] bg-[length:50px_50px] animate-pulse [animation-duration:12s]"></div>
            </div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                What you get with Drouple
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Everything a church needs, nothing it doesn&apos;t. Each feature solves a real ministry problem.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "✅",
                  title: "Sunday Check-In",
                  desc: "Digital check-in that actually works. No more clipboards, no more counting by hand."
                },
                {
                  icon: "👥",
                  title: "LifeGroups",
                  desc: "Track capacity, attendance, and member care. Leaders get simple dashboards to focus on people."
                },
                {
                  icon: "🎉", 
                  title: "Events",
                  desc: "RSVP management with automatic waitlists. Handle capacity and payments without the headaches."
                },
                {
                  icon: "🌱",
                  title: "Discipleship",
                  desc: "Track people through ROOTS, VINES, and retreats. See progress, not just participation."
                },
                {
                  icon: "⭐",
                  title: "First-Timer Care",
                  desc: "Log visitors, track conversations, and make sure no one falls through the cracks."
                },
                {
                  icon: "📋",
                  title: "Member Directory",
                  desc: "Everyone sees what they need to see. Privacy controls that actually make sense for churches."
                }
              ].map((feature) => (
                <div key={feature.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:scale-[1.02]">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING - WITH ELEGANT ANIMATION */}
        <section className="relative py-24 bg-gradient-to-b from-white via-blue-50/30 to-green-50/20 dark:from-gray-950 dark:via-blue-900/20 dark:to-green-950/20 overflow-hidden">
          {/* Elegant closing animation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/10 via-cyan-100/5 to-green-100/10 dark:from-blue-900/5 dark:via-cyan-900/3 dark:to-green-900/5 rounded-full blur-3xl animate-spin [animation-duration:30s]"></div>
            
            {/* Success indicators */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500/40 rounded-full animate-ping [animation-duration:8s]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-pulse [animation-duration:6s]"></div>
            <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-cyan-500/50 rounded-full animate-bounce [animation-duration:5s] [animation-delay:2s]"></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              Get back to ministry
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              You became a church leader to serve people and build God&apos;s kingdom. 
              Not to wrestle with complicated software every Sunday.
            </p>


            <div className="space-y-6">
              <Button 
                asChild 
                size="lg" 
                className="group relative px-10 py-5 text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <Link href="/auth/signin">
                  <span className="relative z-10 flex items-center gap-3">
                    Start Using Drouple
                    <div className="w-3 h-3 bg-white/90 rounded-full group-hover:animate-bounce"></div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                </Link>
              </Button>
              
              <p className="text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  No setup fees
                </span>
                •
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.5s]"></span>
                  No long contracts
                </span>
                •
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse [animation-delay:1s]"></span>
                  No complicated training
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}