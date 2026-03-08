import { Viewer, CameraFlyTo, ScreenSpaceEvent, Entity, PolylineGraphics, ScreenSpaceEventHandler, PointGraphics } from 'resium'
import { Cartesian3, Color, createWorldTerrainAsync, ScreenSpaceEventType, Rectangle, Ellipsoid, EllipsoidGeodesic } from "cesium";
import { useEffect, useRef, useState } from 'react';
import { Viewer as CesiumViewer, IonGeocoderService } from 'cesium'
import type { GeocoderService } from 'cesium'
import '../App.css'

export interface RouteStats {
  distanceKm: number;
  elevationGainM: number;
}

function computeRouteStats(waypoints: Cartesian3[]): RouteStats | null {
  if (waypoints.length < 2) return null;
  const ellipsoid = Ellipsoid.WGS84;
  const geodesic = new EllipsoidGeodesic();
  let distanceM = 0;
  let elevationGainM = 0;
  let prevCartographic = ellipsoid.cartesianToCartographic(waypoints[0]);
  for (let i = 1; i < waypoints.length; i++) {
    const cartographic = ellipsoid.cartesianToCartographic(waypoints[i]);
    geodesic.setEndPoints(prevCartographic, cartographic);
    distanceM += geodesic.surfaceDistance;
    const climb = cartographic.height - prevCartographic.height;
    if (climb > 0) elevationGainM += climb;
    prevCartographic = cartographic;
  }
  return { distanceKm: distanceM / 1000, elevationGainM };
}

export interface ViewerApi {
  geocode: (query: string) => Promise<GeocoderService.Result[]>;
  flyTo: (destination: Rectangle | Cartesian3) => void;
  flyHome: () => void;
}

export interface RouteApi {
  clearRoute: () => void;
}

export interface TerrainProps {
  isDrawing: boolean;
  viewerApiRef?: React.MutableRefObject<ViewerApi | null>;
  routeApiRef?: React.MutableRefObject<RouteApi | null>;
  onHasWaypointsChange?: (hasWaypoints: boolean) => void;
  onRouteStatsChange?: (stats: RouteStats | null) => void;
}

export default function Terrain({
  isDrawing,
  viewerApiRef,
  routeApiRef,
  onHasWaypointsChange,
  onRouteStatsChange
}: TerrainProps) {
  const terrainProvider = createWorldTerrainAsync();
  const viewerRef = useRef<{ cesiumElement: CesiumViewer }>(null);
  const geocoderRef = useRef<IonGeocoderService | null>(null);
  const [waypoints, setWaypoints] = useState<Cartesian3[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onHasWaypointsChange?.(waypoints.length > 0);
  }, [waypoints, onHasWaypointsChange]);

  useEffect(() => {
    const stats = computeRouteStats(waypoints);
    onRouteStatsChange?.(stats);
  }, [waypoints, onRouteStatsChange]);

  useEffect(() => {
    if (routeApiRef) {
      routeApiRef.current = { clearRoute: () => setWaypoints([]) };
      return () => {
        routeApiRef.current = null;
      };
    }
  }, [routeApiRef]);

  useEffect(() => {
    const id = setTimeout(() => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return;
      (window as any).viewer = viewer;
      geocoderRef.current = new IonGeocoderService({ scene: viewer.scene });
      if (viewerApiRef) {
        const camera = viewer.scene?.camera ?? viewer.camera;
        viewerApiRef.current = {
          geocode: (query: string) => geocoderRef.current!.geocode(query),
          flyTo: (destination) => camera.flyTo({ destination, duration: 1.5 }),
          flyHome: () => { if (typeof camera.flyHome === 'function') camera.flyHome(1.5); }
        };
      }
    }, 1500);
    return () => {
      clearTimeout(id);
      if (viewerApiRef) viewerApiRef.current = null;
    };
  }, [viewerApiRef]);

  useEffect(() => {
    const canvas = viewerRef.current?.cesiumElement?.canvas;
    if (!canvas) return;
    canvas.style.cursor = isDrawing ? 'crosshair' : 'default';
  }, [isDrawing]);

  useEffect(() => {
    const id = setInterval(() => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer?.scene) return;
      clearInterval(id);
      const remove = viewer.scene.postRender.addEventListener(() => {
        remove();
        setIsReady(true);
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-full">
      {!isReady && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#0f0f0f]"
        >
          <div className="terrain-loader" />
          <span className="text-sm text-white/60">Loading map…</span>
        </div>
      )}
    <Viewer 
      full
      terrainProvider={terrainProvider}
      ref={viewerRef}
      timeline={false}
      animation={false}
      sceneModePicker={false}
      infoBox={false}
      projectionPicker={false}
      baseLayerPicker={false}
      geocoder={false}
      homeButton={false}
      navigationHelpButton={false}
    >
      <CameraFlyTo 
        destination={Cartesian3.fromDegrees(-110.677462579855, 43.70590037055092, 3468.985505525682)} 
        duration={3} 
        orientation={{
          heading: 5.047448444886122,
          pitch: -0.09812921167794131,
          roll: 0
        }}
        once={true}
      />
      <ScreenSpaceEventHandler>
        <ScreenSpaceEvent
          type={ScreenSpaceEventType.LEFT_CLICK}
          action={(e: any) => {
            if (!isDrawing) return;
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) return;

            const position = viewer.scene.pickPosition(e.position);
            if (!position) return;

            setWaypoints(prev => [...prev, position]);
          }}
        />
      </ScreenSpaceEventHandler>
      {waypoints.map((position, index) => (
        <Entity key={index} position={position}>
          <PointGraphics
            pixelSize={10}
            color={Color.ORANGE}
            outlineColor={Color.WHITE}
            outlineWidth={2}
          />
        </Entity>
      ))}
      {waypoints.length > 1 && (
        <Entity>
          <PolylineGraphics
            positions={waypoints}
            width={3}
            material={Color.ORANGE}
            clampToGround={true}
          />
        </Entity>
      )}
    </Viewer>
    </div>
  )
}
