import './App.css'
import Terrain from './components/Terrain'
import Sidebar from './components/Sidebar'
import { useRef, useState } from 'react'
import type { ViewerApi, RouteApi, RouteStats } from './components/Terrain'

function App() {
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasWaypoints, setHasWaypoints] = useState(false)
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null)
  const viewerApiRef = useRef<ViewerApi | null>(null)
  const routeApiRef = useRef<RouteApi | null>(null)

  return (
    <>
    <div className="relative flex min-h-screen">
      <header
        className="
        app-top-bar 
        pointer-events-none 
        hidden min-[1200px]:block 
        absolute 
        top-0 
        left-0 
        right-0 
        h-14 z-10 
        border-b 
        border-white/15 
        bg-[#0f0f0f]"
      />
      <Sidebar 
        isDrawing={isDrawing} 
        setIsDrawing={setIsDrawing} 
        viewerApiRef={viewerApiRef} 
        routeApiRef={routeApiRef} 
        hasWaypoints={hasWaypoints} 
        routeStats={routeStats} 
      />
      <div className="relative min-h-screen flex-1 max-[768px]:pt-14">
        <Terrain 
          isDrawing={isDrawing} 
          viewerApiRef={viewerApiRef} 
          routeApiRef={routeApiRef} 
          onHasWaypointsChange={setHasWaypoints} 
          onRouteStatsChange={setRouteStats} 
        />
      </div>
    </div>
    </>
  )
}

export default App
