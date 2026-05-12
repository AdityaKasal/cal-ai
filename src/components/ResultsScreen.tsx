import { ArrowLeft, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { MatchResult, Person } from '@/types';
import { ListingCard } from './ListingCard';

interface ResultsScreenProps {
  results: MatchResult[];
  people: Person[];
  error: string | null;
  usedAI: boolean;
  onBack: () => void;
  onRedo: () => void;
}

export function ResultsScreen({ results, people, error, usedAI, onBack, onRedo }: ResultsScreenProps) {
  const totalBudget = people.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Edit Group</span>
          </button>
          <button
            onClick={onRedo}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Search Again
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            {usedAI ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 bg-violet-500/15 px-3 py-1.5 rounded-full border border-violet-500/20">
                <Sparkles className="w-3 h-3" />
                AI-Powered Matching
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                Smart Matching
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {results.length > 0 ? `${results.length} Top Matches` : 'No Matches Found'}
          </h1>
          <p className="text-slate-400">
            For {people.map(p => p.name).join(', ')} · ${totalBudget.toLocaleString()}/mo combined
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-300 mb-1">AI matching unavailable</div>
              <div className="text-xs text-amber-400/70">{error}</div>
              <div className="text-xs text-amber-400/70 mt-1">Showing algorithmic results instead.</div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result, i) => (
              <ListingCard
                key={result.listing.id}
                result={result}
                rank={i + 1}
                memberCount={people.length}
              />
            ))}
          </div>
        ) : (
          <div className="text-center glass rounded-2xl p-12">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
            <p className="text-slate-400 mb-6">
              Try increasing budgets or relaxing preferences to find more options.
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              Adjust Preferences
            </button>
          </div>
        )}

        {/* Footer note */}
        {results.length > 0 && (
          <div className="mt-8 text-center text-xs text-slate-700">
            Listings are mock data for demonstration purposes
          </div>
        )}
      </div>
    </div>
  );
}
