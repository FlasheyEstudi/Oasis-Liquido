'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchPlaceByName, OSMSearchResult } from '@/lib/map/search-places';

interface MapSearchBoxProps {
  onSelectLocation: (lat: number, lng: number, displayName: string) => void;
  placeholder?: string;
  className?: string;
}

export function MapSearchBox({
  onSelectLocation,
  placeholder = 'Buscar farmacia, clínica, barrio...',
  className = '',
}: MapSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OSMSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search logic
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const osmResults = await searchPlaceByName(query);
        setResults(osmResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: OSMSearchResult) => {
    // Show only the short name in the input, but send full details
    const shortName = result.display_name.split(',')[0];
    setQuery(shortName);
    setShowDropdown(false);
    onSelectLocation(result.lat, result.lng, result.display_name);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 shrink-0">
          <Search className="size-4" />
        </span>
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 rounded-full glass-input h-11 text-sm bg-zinc-950/40 border-white/10 text-white placeholder-zinc-500 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {isLoading ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-emerald-500" />
          </span>
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[9999] mt-2 w-full bg-zinc-950/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 max-h-64 overflow-y-auto custom-scrollbar p-2">
          {results.map((result) => {
            const parts = result.display_name.split(',');
            const title = parts[0];
            const subtitle = parts.slice(1).join(',').trim();

            return (
              <button
                key={result.place_id}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 mt-0.5">
                  <MapPin className="size-4 text-emerald-500" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{title}</p>
                  {subtitle && (
                    <p className="text-[10px] text-zinc-400 truncate">{subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
