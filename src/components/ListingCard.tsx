import { useState } from 'react';
import {
  MapPin, BedDouble, Bath, Square, DollarSign,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  Wifi, Car, Shirt, PawPrint
} from 'lucide-react';
import { MatchResult } from '@/types';

interface ListingCardProps {
  result: MatchResult;
  rank: number;
  memberCount: number;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'from-emerald-500 to-teal-500' :
    score >= 60 ? 'from-violet-500 to-indigo-500' :
    'from-amber-500 to-orange-500';

  return (
    <div className={`flex items-center gap-1.5 bg-gradient-to-r ${color} px-3 py-1.5 rounded-xl`}>
      <span className="text-white font-bold text-sm">{score}</span>
      <span className="text-white/70 text-xs">/ 100</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles = [
    'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950',
    'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800',
    'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100',
  ];
  const labels = ['#1', '#2', '#3'];
  const style = rank <= 3 ? styles[rank - 1] : 'bg-white/10 text-slate-300';
  const label = rank <= 3 ? labels[rank - 1] : `#${rank}`;
  return (
    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

export function ListingCard({ result, rank, memberCount }: ListingCardProps) {
  const [expanded, setExpanded] = useState(rank <= 3);
  const { listing, score, matchSummary, perPersonBudgetShare, pros, cons } = result;

  return (
    <div className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${rank === 1 ? 'ring-1 ring-violet-500/40' : ''}`}>
      {rank === 1 && (
        <div className="bg-gradient-to-r from-violet-600/30 to-indigo-600/30 px-4 py-2 text-center text-xs font-semibold text-violet-300 tracking-widest uppercase border-b border-violet-500/20">
          ✦ Best Match for Your Group ✦
        </div>
      )}

      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Image */}
          <div className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <RankBadge rank={rank} />
                <h3 className="font-bold text-white text-base leading-tight">{listing.title}</h3>
              </div>
              <ScoreBadge score={score} />
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{listing.neighborhood}, {listing.city}</span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <div className="flex items-center gap-1 text-white font-semibold">
                <DollarSign className="w-3.5 h-3.5 text-violet-400" />
                {listing.price.toLocaleString()}/mo
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1 text-slate-300">
                <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                {listing.bedrooms} bd
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Bath className="w-3.5 h-3.5 text-slate-500" />
                {listing.bathrooms} ba
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Square className="w-3.5 h-3.5 text-slate-500" />
                {listing.sqft.toLocaleString()} sqft
              </div>
            </div>

            {/* Per person */}
            {memberCount > 1 && (
              <div className="mt-2">
                <span className="text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">
                  ~${perPersonBudgetShare.toLocaleString()}/person
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick icons */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
          <span className={`flex items-center gap-1.5 text-xs ${listing.petFriendly ? 'text-emerald-400' : 'text-slate-600'}`}>
            <PawPrint className="w-3.5 h-3.5" />
            {listing.petFriendly ? 'Pet friendly' : 'No pets'}
          </span>
          <span className={`flex items-center gap-1.5 text-xs ${listing.parking ? 'text-emerald-400' : 'text-slate-600'}`}>
            <Car className="w-3.5 h-3.5" />
            {listing.parking ? 'Parking' : 'No parking'}
          </span>
          <span className={`flex items-center gap-1.5 text-xs ${listing.laundry !== 'none' ? 'text-emerald-400' : 'text-slate-600'}`}>
            <Shirt className="w-3.5 h-3.5" />
            {listing.laundry === 'in-unit' ? 'In-unit laundry' : listing.laundry === 'shared' ? 'Shared laundry' : 'No laundry'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
            <Wifi className="w-3.5 h-3.5" />
            {listing.type}
          </span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Less details</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> More details</>
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
          {/* AI summary */}
          <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-4">
            <p className="text-sm text-slate-300 leading-relaxed">{matchSummary}</p>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Why it works</div>
              <ul className="space-y-1.5">
                {pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            {cons.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Consider this</div>
                <ul className="space-y-1.5">
                  {cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amenities</div>
              <div className="flex flex-wrap gap-1.5">
                {listing.amenities.map(amenity => (
                  <span key={amenity} className="px-2.5 py-1 bg-white/5 text-slate-400 rounded-lg text-xs">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed">{listing.description}</p>

          {/* Available date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Available {new Date(listing.available).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
              Contact →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
