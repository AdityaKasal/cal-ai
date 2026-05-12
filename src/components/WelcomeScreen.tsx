import { Users, Search, Star, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/25">
            <Search className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold mb-4 tracking-tight">
          <span className="text-white">Find Your</span>{' '}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Perfect Home
          </span>
        </h1>
        <p className="text-slate-400 text-xl mb-12 leading-relaxed">
          Input everyone's budget and preferences, and let AI find the rentals that work best for your whole group.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Users,
              title: 'Group Matching',
              desc: 'Up to 4 people with individual budgets and preferences',
            },
            {
              icon: Search,
              title: 'Smart Search',
              desc: 'AI analyzes every detail to find your ideal match',
            },
            {
              icon: Star,
              title: 'Ranked Results',
              desc: 'See listings ranked by fit score with detailed reasoning',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-5 text-left">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-200 shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-100"
        >
          Start Finding
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="mt-6 text-slate-600 text-sm">
          No account needed · Real listings across all 50 states · Powered by Claude AI
        </p>
      </div>
    </div>
  );
}
