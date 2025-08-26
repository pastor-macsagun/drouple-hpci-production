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
        {/* CLEAN MINIMALIST HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          {/* Subtle geometric patterns */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+CjwvZz4KPC9nPgo8L3N2Zz4=')] bg-repeat"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Minimal badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800/30">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Introducing Drouple
            </div>

            {/* Clean typography */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
              Ministry without
              <br />
              <span className="text-blue-600 dark:text-blue-400">the mess</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The first church management platform that feels like it was designed by people who actually run churches.
            </p>

            {/* Simple CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                asChild 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signin">
                  Get Started
                </Link>
              </Button>
              
              <button className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-lg font-medium">
                See how it works →
              </button>
            </div>

            {/* Clean feature preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-75">
              {[
                { icon: "⚡", label: "Setup in minutes" },
                { icon: "🎯", label: "Built for churches" },
                { icon: "🔒", label: "Secure by design" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 justify-center">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION - CLEAN APPROACH */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
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
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">{problem}</p>
                  </div>
                ))}
              </div>

              {/* Visual element */}
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🤔</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Sound familiar?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You&apos;re spending more time managing your management system than actually doing ministry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE SOLUTION - DIRECT APPROACH */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-4">
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

        {/* FEATURES - FEATURE-FOCUSED */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
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
                <div key={feature.title} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING - PERSONAL APPROACH */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="max-w-4xl mx-auto px-4 text-center">
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
                className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href="/auth/signin">
                  Start Using Drouple
                </Link>
              </Button>
              
              <p className="text-gray-500 dark:text-gray-400">
                No setup fees • No long contracts • No complicated training
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}