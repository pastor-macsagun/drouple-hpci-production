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
        {/* HERO SECTION WITH PHOTOGRAPHY */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')] bg-cover bg-center bg-no-repeat opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-blue-900/60 to-indigo-900/80"></div>
          </div>

          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>

          {/* Floating Geometric Shapes */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-full animate-spin [animation-duration:20s]"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-lg rotate-45 animate-bounce [animation-duration:4s]"></div>
            <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-green-400/30 rotate-45 animate-spin [animation-duration:15s]"></div>
            <div className="absolute bottom-1/3 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full animate-pulse [animation-duration:3s]"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-white space-y-8">
                <div className="space-y-2 animate-in fade-in slide-in-from-left duration-1000">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <span className="text-sm font-medium">Trusted by 1000+ Churches</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                    <span className="block">Ministry</span>
                    <span className="block bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                      Simplified
                    </span>
                  </h1>
                </div>
                
                <p className="text-xl md:text-2xl text-gray-200 leading-relaxed animate-in fade-in slide-in-from-left duration-1000 delay-200">
                  Transform your church operations with Drouple - the platform that understands ministry and makes administration effortless.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left duration-1000 delay-400">
                  <Button 
                    asChild 
                    size="lg"
                    className="group relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 overflow-hidden"
                  >
                    <Link href="/auth/signin">
                      <span className="relative z-10 flex items-center gap-2">
                        Start Free Trial
                        <div className="w-2 h-2 bg-white rounded-full group-hover:animate-ping"></div>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Link>
                  </Button>
                  
                  <button className="group px-8 py-6 text-lg font-semibold text-white border-2 border-white/30 rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                    <span className="flex items-center gap-2">
                      Watch Demo
                      <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent group-hover:scale-110 transition-transform duration-300"></div>
                    </span>
                  </button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-6 pt-8 animate-in fade-in slide-in-from-left duration-1000 delay-600">
                  <div className="text-center">
                    <div className="text-3xl font-black text-green-400">1000+</div>
                    <div className="text-sm text-gray-300">Active Churches</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-blue-400">50k+</div>
                    <div className="text-sm text-gray-300">Members Managed</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-cyan-400">99.9%</div>
                    <div className="text-sm text-gray-300">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Animated Mockup */}
              <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-300">
                <div className="relative">
                  {/* Main Dashboard Mockup */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform duration-700">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-32 h-6 bg-gradient-to-r from-blue-400/50 to-green-400/50 rounded-full animate-pulse"></div>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-red-400/50 rounded-full animate-pulse"></div>
                          <div className="w-3 h-3 bg-yellow-400/50 rounded-full animate-pulse [animation-delay:0.5s]"></div>
                          <div className="w-3 h-3 bg-green-400/50 rounded-full animate-pulse [animation-delay:1s]"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-4 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s`, width: `${60 + i * 15}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating Cards */}
                  <div className="absolute -top-8 -left-8 bg-green-500/20 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30 animate-bounce [animation-duration:3s]">
                    <div className="text-2xl">✅</div>
                    <div className="text-xs text-white/80 mt-1">New Member</div>
                  </div>

                  <div className="absolute -bottom-6 -right-6 bg-blue-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30 animate-pulse [animation-duration:2s]">
                    <div className="text-2xl">📊</div>
                    <div className="text-xs text-white/80 mt-1">Live Stats</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SHOWCASE WITH PHOTOS */}
        <section className="py-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom duration-1000">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
                Built for <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Real Churches</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Every feature designed with actual ministry workflows in mind
              </p>
            </div>

            <div className="grid gap-20">
              {/* Feature 1 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 animate-in fade-in slide-in-from-left duration-1000">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">Sunday Operations</span>
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                    Seamless Sunday Check-ins
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Transform chaotic Sunday mornings into smooth operations. Digital check-ins, automated counting, and real-time dashboards that keep your team informed.
                  </p>
                  <ul className="space-y-3">
                    {['QR code check-ins', 'Automated headcount', 'Real-time dashboards', 'Mobile-first design'].map((feature, i) => (
                      <li key={feature} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-700">
                    <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438032005730-c779502df39b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-60"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="text-3xl font-black">2,847</div>
                        <div className="text-sm opacity-80">People checked in today</div>
                      </div>
                    </div>
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-bounce [animation-duration:3s]">
                    <div className="text-2xl">📱</div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="relative lg:order-1 animate-in fade-in slide-in-from-left duration-1000 delay-200">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-700">
                    <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-60"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="text-3xl font-black">24</div>
                        <div className="text-sm opacity-80">Active LifeGroups</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-pulse [animation-duration:2s]">
                    <div className="text-2xl">👥</div>
                  </div>
                </div>
                <div className="space-y-6 lg:order-2 animate-in fade-in slide-in-from-right duration-1000">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 dark:text-green-300 text-sm font-medium">Community Building</span>
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                    LifeGroups Made Simple
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Manage small groups with ease. Track attendance, facilitate connections, and help your community grow stronger together.
                  </p>
                  <ul className="space-y-3">
                    {['Group management', 'Attendance tracking', 'Member connections', 'Growth analytics'].map((feature, i) => (
                      <li key={feature} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 animate-in fade-in slide-in-from-left duration-1000">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Spiritual Growth</span>
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                    Discipleship Pathways
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    Guide your members through their spiritual journey with structured pathways, progress tracking, and personalized next steps.
                  </p>
                  <ul className="space-y-3">
                    {['ROOTS pathway', 'Progress tracking', 'Automated enrollment', 'Personal dashboards'].map((feature, i) => (
                      <li key={feature} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-700">
                    <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-green-100 dark:from-purple-900 dark:to-green-900">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-60"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="text-3xl font-black">156</div>
                        <div className="text-sm opacity-80">On discipleship journey</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-spin [animation-duration:8s]">
                    <div className="text-2xl">🌱</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS WITH REAL PHOTOS */}
        <section className="py-32 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438032005730-c779502df39b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-1000">
              <h2 className="text-5xl font-black text-white mb-6">
                Loved by Church Leaders
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                See how Drouple is transforming churches around the world
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Pastor Sarah Johnson",
                  role: "Lead Pastor, Grace Community",
                  image: "https://images.unsplash.com/photo-1494790108755-2616b612b5e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                  quote: "Drouple transformed our Sunday mornings from chaos to clarity. Our volunteers love how simple it is.",
                  delay: "0s"
                },
                {
                  name: "Mark Rodriguez",
                  role: "Operations Director",
                  image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                  quote: "Finally, a system that understands how churches actually work. Setup took 15 minutes, not 15 hours.",
                  delay: "0.2s"
                },
                {
                  name: "Lisa Chen",
                  role: "Children's Director",
                  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                  quote: "The mobile check-ins for kids have been a game-changer. Parents and volunteers both love the simplicity.",
                  delay: "0.4s"
                }
              ].map((testimonial, _i) => (
                <div 
                  key={testimonial.name}
                  className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: testimonial.delay, animationDuration: "1000ms" }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{testimonial.name}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA WITH DRAMATIC VISUALS */}
        <section className="relative py-32 bg-gradient-to-br from-slate-900 to-blue-900 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-blue-900/80 to-slate-900"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-green-400/10 rounded-full blur-3xl animate-pulse [animation-duration:4s]"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse [animation-duration:6s] [animation-delay:1s]"></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-1000">
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">
                Ready to Transform
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                  Your Ministry?
                </span>
              </h2>
              
              <p className="text-2xl text-white/80 max-w-3xl mx-auto">
                Join thousands of churches already using Drouple to simplify their operations and focus on what matters most.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                <Button 
                  asChild 
                  size="lg"
                  className="group relative px-12 py-8 text-xl font-black bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-500 overflow-hidden"
                >
                  <Link href="/auth/signin">
                    <span className="relative z-10 flex items-center gap-3">
                      Start Your Free Trial
                      <div className="w-3 h-3 bg-white rounded-full group-hover:animate-ping"></div>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Link>
                </Button>
                
                <div className="text-white/60 text-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    30-day free trial
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.5s]"></div>
                    No credit card required
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-black text-green-400 animate-pulse">1000+</div>
                  <div className="text-white/60 text-sm mt-2">Churches Trust Us</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-blue-400 animate-pulse [animation-delay:0.5s]">99.9%</div>
                  <div className="text-white/60 text-sm mt-2">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-cyan-400 animate-pulse [animation-delay:1s]">24/7</div>
                  <div className="text-white/60 text-sm mt-2">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}