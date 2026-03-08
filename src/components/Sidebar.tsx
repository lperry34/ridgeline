import { useEffect, useRef, useState } from 'react';
import '../App.css'
import type { ViewerApi, RouteApi, RouteStats } from './Terrain'
import type { GeocoderService } from 'cesium'

interface SidebarProps {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  viewerApiRef: React.RefObject<ViewerApi | null>;
  routeApiRef: React.RefObject<RouteApi | null>;
  hasWaypoints: boolean;
  routeStats: RouteStats | null;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function Sidebar({
  isDrawing,
  setIsDrawing,
  viewerApiRef,
  routeApiRef,
  hasWaypoints,
  routeStats
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocoderService.Result[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [controlsExpanded, setControlsExpanded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const skipNextDropdownOpenRef = useRef(false);

  useEffect(() => {
    if (isDrawing) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = 'default';
    }
  }, [isDrawing]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const api = viewerApiRef.current;
      if (!api) return;
      setSearchLoading(true);
      api.geocode(searchQuery)
        .then((results) => {
          setSearchResults(results);
          if (!skipNextDropdownOpenRef.current) setShowDropdown(true);
          skipNextDropdownOpenRef.current = false;
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, viewerApiRef]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }

  function handleSelectResult(result: GeocoderService.Result) {
    viewerApiRef.current?.flyTo(result.destination);
    skipNextDropdownOpenRef.current = true;
    setShowDropdown(false);
    setSearchQuery(result.displayName);
    closeSidebarOnMobile();
  }

  function handleClearSearch() {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  }

  return (
    <>
      <header className="app-header fixed top-0 left-0 right-0 h-14 z-50 flex items-center border-b border-white/15 bg-[#181818] min-[769px]:hidden">
        <button type="button" className="p-3 shrink-0 text-white/80 cursor-pointer" onClick={() => setSidebarOpen((o) => !o)}>
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
        {sidebarOpen && (
          <div
            className="fixed top-14 left-80 right-0 bottom-0 z-30 hidden max-[768px]:block"
            onClick={closeSidebarOnMobile}
          />
        )}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold inline-flex items-center justify-center gap-0.5 text-white">
          <img src="/mountain.svg" className="h-[1.2rem] w-auto inline-block align-baseline bring-up-1" />
          Ridgeline
        </h1>
      </header>

      <div 
        className="
        side-panel 
        cursor-pointer 
        w-15 
        min-h-100 
        border-r 
        border-white/15 
        flex 
        items-center 
        justify-center 
        min-[1200px]:hidden 
        max-[768px]:hidden" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <button type="button" className="p-2 hover:bg-white/10 rounded-lg cursor-pointer" onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}>
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </div>
      <div
        className={sidebarOpen
          ? `
          sidebar 
          flex 
          flex-col 
          bg-[#0f0f0f] 
          border-r 
          border-white/15
          min-[768px]:max-w-100 
          min-[768px]:min-w-85 
          min-[768px]:shrink-0 
          min-[768px]:h-screen
          min-[768px]:max-[1400px]:min-w-80 
          min-[768px]:max-[1450px]:w-80
          max-[768px]:fixed 
          max-[768px]:left-0 
          max-[768px]:top-14 
          max-[768px]:z-40 
          max-[768px]:w-80 
          max-[768px]:h-[calc(100vh-3.5rem)]
          `
          : `
          sidebar 
          flex 
          flex-col 
          bg-[#0f0f0f] 
          border-r 
          border-white/15
          min-[768px]:max-w-100 
          min-[768px]:min-w-85 
          min-[768px]:shrink-0 
          min-[768px]:h-screen
          min-[768px]:max-[1400px]:min-w-80 
          min-[768px]:max-[1450px]:w-80
          max-[768px]:fixed 
          max-[768px]:left-0 
          max-[768px]:top-14 
          max-[768px]:z-40 
          max-[768px]:w-80 
          max-[768px]:h-[calc(100vh-3.5rem)]
          max-[1200px]:hidden
          max-[768px]:hidden
          `
        }
      >
        <div className="sidebar-top shrink-0 h-14 flex items-center justify-center max-[768px]:hidden relative z-20">
          <h1 className="text-2xl font-bold inline-flex items-center justify-center gap-0.5 text-white">
            R
            <img src="/mountain.svg" alt="" className="h-[0.9em] w-auto inline-block align-baseline" aria-hidden />
            dgeline
          </h1>
        </div>
        <div className="sidebar-content flex-1 flex flex-col min-h-0 overflow-auto">
          <div ref={searchContainerRef} className="relative" aria-label="Search">
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Search</label>
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Address or place..."
                className="
                w-full 
                pl-3 
                pr-8 
                py-2 
                text-sm 
                rounded 
                border 
                border-white/25 
                bg-white/5 
                text-white 
                placeholder:text-white/40 
                focus:outline-none 
                focus:border-white/40 
                focus:bg-white/[0.07]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="
                  cursor-pointer 
                  absolute 
                  right-2 
                  top-1/2 
                  -translate-y-1/2 
                  w-5 h-5 
                  flex 
                  items-center 
                  justify-center 
                  rounded text-white/60 
                  hover:text-white 
                  hover:bg-white/10 
                  transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              {searchLoading && (
                <span className={searchQuery ? 'absolute top-1/2 -translate-y-1/2 text-white/50 text-xs right-8' : 'absolute top-1/2 -translate-y-1/2 text-white/50 text-xs right-3'}>Searching...</span>
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <ul
                className="absolute 
                z-50 
                w-full 
                mt-1 
                py-1 
                rounded-md 
                border 
                border-white/30 
                bg-black/90 
                text-white 
                text-sm 
                shadow-lg 
                max-h-60 
                overflow-auto"
              >
                {searchResults.map((result, i) => (
                  <li
                    key={i}
                    className="px-3 py-2 cursor-pointer hover:bg-white/10 truncate"
                    onClick={() => handleSelectResult(result)}
                  >
                    {result.displayName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6" aria-label="Route">
            <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Route</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={isDrawing
                  ? `
                  cursor-crosshair
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  text-white/90
                  rounded-md
                  bg-white/[0.06]
                  hover:bg-white/10
                  transition-colors
                  flex-1
                  min-w-0
                  justify-center`
                  : `
                  cursor-pointer
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  text-white/90
                  rounded-md
                  bg-white/[0.06]
                  hover:bg-white/10
                  transition-colors
                  flex-1
                  min-w-0
                  justify-center`
                }
                onClick={() => {
                  setIsDrawing(!isDrawing);
                  closeSidebarOnMobile();
                }}
              >
                {isDrawing ? 'Exit route mode' : 'Create your route'}
              </button>
              {hasWaypoints && (
                <button
                  type="button"
                  className="
                  cursor-pointer 
                  inline-flex 
                  items-center 
                  px-3 
                  py-2 
                  text-sm 
                  text-white/70 
                  hover:text-white/90 
                  rounded-md 
                  hover:bg-white/5 
                  transition-colors 
                  shrink-0"
                  onClick={() => {
                  routeApiRef.current?.clearRoute();
                  closeSidebarOnMobile();
                  setIsDrawing(false);
                }}
                >
                  Clear route
                </button>
              )}
            </div>
            <p className="text-xs text-white/45 min-w-0 mt-2">Click on the map to add waypoints; they connect automatically.</p>
            
            {routeStats && (
              <dl className="mt-3 pt-3 border-t border-white/15 space-y-1.5 text-xs">
                <h2 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Route Statistics</h2>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Distance</dt>
                  <dd className="text-white/90 tabular-nums">{routeStats.distanceKm < 1 ? `${(routeStats.distanceKm * 1000).toFixed(0)} m` : `${routeStats.distanceKm.toFixed(2)} km`}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Elevation gain</dt>
                  <dd className="text-white/90 tabular-nums">{routeStats.elevationGainM < 1000 ? `${Math.round(routeStats.elevationGainM)} m` : `${(routeStats.elevationGainM / 1000).toFixed(2)} km`}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
        <div className="sidebar-bottom shrink-0 pt-4 pb-4 px-4 border-t border-white/15">
          <button
            type="button"
            className="cursor-pointer gap-2 py-2 text-sm text-white/70 mb-2 hover:underline w-full text-left"
            onClick={() => {
              if (typeof viewerApiRef.current?.flyHome === 'function') viewerApiRef.current.flyHome();
              closeSidebarOnMobile();
            }}
          >
            Zoom out to global
          </button>
          <div className="border-t border-white/15 pt-2 -mx-4 px-4">
            <button
              type="button"
              className="
              cursor-pointer 
              text-sm w-full 
              flex 
              items-center 
              justify-between 
              gap-2 
              py-2 
              font-medium 
              text-white/60 
              hover:text-white/80 
              transition-colors"
              onClick={() => setControlsExpanded((e) => !e)}
            >
              <span>Controls</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={controlsExpanded ? 'transition-transform rotate-180' : 'transition-transform'}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {controlsExpanded && (
              <div className="space-y-3 text-xs text-white/50 pt-1">
                <div>
                  <h3 className="text-white/60 font-medium mb-1.5">Mouse controls</h3>
                  <dl className="space-y-1">
                    <div><dt className="inline text-white/60">Pan view:</dt> <dd className="inline">Left click + drag</dd></div>
                    <div><dt className="inline text-white/60">Zoom:</dt> <dd className="inline">Right click + drag, or scroll</dd></div>
                    <div><dt className="inline text-white/60">Rotate:</dt> <dd className="inline">Middle click + drag, or Ctrl + left click + drag</dd></div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-white/60 font-medium mb-1.5">Touch controls</h3>
                  <dl className="space-y-1">
                    <div><dt className="inline text-white/60">Pan view:</dt> <dd className="inline">One finger drag</dd></div>
                    <div><dt className="inline text-white/60">Zoom:</dt> <dd className="inline">Two finger pinch</dd></div>
                    <div><dt className="inline text-white/60">Tilt:</dt> <dd className="inline">Two finger drag same direction</dd></div>
                    <div><dt className="inline text-white/60">Rotate:</dt> <dd className="inline">Two finger drag opposite direction</dd></div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}