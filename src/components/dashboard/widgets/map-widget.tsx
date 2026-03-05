
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, ZoomIn, ZoomOut, Target } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { useMediaStore } from "@/lib/store";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const FALLBACK_LOCATION = { lat: 17.067330, lng: 54.160190 };

export function MapWidget() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const carOverlayRef = useRef<google.maps.WebGLOverlayView | null>(null);
  const scriptLoadedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);

  const { mapSettings, updateMapSettings } = useMediaStore();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  // Elite 3D Navigation Config
  const tuner = {
    zoom: 20.0,
    tilt: 65,
    scale: 1.02
  };

  const [carState, setCarState] = useState({
    location: FALLBACK_LOCATION,
    heading: 0
  });

  const carStateRef = useRef(carState);
  useEffect(() => { carStateRef.current = carState; }, [carState]);

  const setup3DMarker = useCallback((map: google.maps.Map) => {
    if (carOverlayRef.current) return;

    const overlay = new google.maps.WebGLOverlayView();
    carOverlayRef.current = overlay;

    overlay.onAdd = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      
      // Ultra-Gloss Automotive Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 5.5));
      const sun = new THREE.DirectionalLight(0xffffff, 4.4);
      sun.position.set(10, 25, 10);
      scene.add(sun);

      const loader = new GLTFLoader();
      loader.load('https://dmusera.netlify.app/E350E.gltf', (gltf) => {
        const model = gltf.scene;
        model.traverse(node => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.metalness = 0.95;
              mat.roughness = 0.1;
              mat.envMapIntensity = 2.0;
              mat.needsUpdate = true;
            }
          }
        });
        model.rotation.x = Math.PI / 2;
        scene.add(model);
        (overlay as any).carModel = model;
      }, undefined, (error) => {
        console.warn("3D Model Load Failed, Rendering Cyber-Disk");
        const geometry = new THREE.CylinderGeometry(5, 5, 1, 32);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x0088ff, 
          metalness: 0.9, 
          roughness: 0.1, 
          transparent: true, 
          opacity: 0.8,
          emissive: 0x0044ff,
          emissiveIntensity: 0.5
        });
        const disk = new THREE.Mesh(geometry, material);
        disk.rotation.x = Math.PI / 2;
        scene.add(disk);
        (overlay as any).carModel = disk;
      });

      (overlay as any).scene = scene;
      (overlay as any).camera = camera;
    };

    overlay.onContextRestored = ({ gl }) => {
      (overlay as any).renderer = new THREE.WebGLRenderer({ 
        canvas: gl.canvas, context: gl, antialias: true, alpha: true 
      });
      (overlay as any).renderer.autoClear = false;
    };

    overlay.onDraw = ({ transformer }) => {
      const { renderer, scene, camera, carModel } = (overlay as any);
      if (!renderer || !scene || !mapInstanceRef.current) return;

      renderer.resetState();
      const zoom = mapInstanceRef.current.getZoom() || tuner.zoom;
      const pos = carStateRef.current.location;
      const heading = carStateRef.current.heading;

      // Project car at absolute center with fixed elevation
      const matrix = transformer.fromLatLngAltitude({ lat: pos.lat, lng: pos.lng, altitude: 3.5 });
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
      
      if (carModel) {
        const finalScale = tuner.scale * Math.pow(2, 20 - zoom);
        carModel.scale.set(finalScale, finalScale, finalScale);
        // Sync car orientation with its heading
        carModel.rotation.y = -(heading * Math.PI) / 180 + Math.PI;
      }

      renderer.render(scene, camera);
      overlay.requestRedraw(); 
    };

    overlay.setMap(map);
  }, []);

  const startLiveTracking = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const heading = pos.coords.heading || 0;
          
          setCarState({ location: newLoc, heading });
          
          // CRITICAL: Absolute Centering & Auto-Rotation (Heading Sync)
          if (!isInteractingRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newLoc);
            // Rotate map to match driving direction
            mapInstanceRef.current.setHeading(heading);
          }
        },
        (err) => console.error("GPS Signal Error:", err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }
  }, []);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      try {
        const map = new google.maps.Map(mapRef.current, {
          center: carState.location,
          zoom: tuner.zoom,
          tilt: tuner.tilt,
          heading: 0,
          mapId: '6c6951a9289b612a97923702', 
          disableDefaultUI: true,
          styles: DARK_MAP_STYLE,
          gestureHandling: "greedy",
          renderingType: google.maps.RenderingType.VECTOR
        });

        map.addListener('dragstart', () => { isInteractingRef.current = true; });
        
        mapInstanceRef.current = map;
        setup3DMarker(map);
        startLiveTracking();
        setIsLoading(false);
      } catch (e) {
        setApiError(true);
        setIsLoading(false);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      (window as any).initMap = initMap;
      document.head.appendChild(script);
    }

    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [setup3DMarker, startLiveTracking]);

  return (
    <Card className="h-full w-full overflow-hidden border-none bg-black relative group rounded-[2.5rem] shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      )}
      {apiError ? (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-8 bg-zinc-900/50">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <h3 className="text-xl font-bold text-white mt-4">GPS Offline</h3>
        </div>
      ) : (
        <div ref={mapRef} className="absolute inset-0 z-0" />
      )}
      
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
        <div className="flex flex-col bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <Button size="icon" variant="ghost" onClick={() => { isInteractingRef.current = true; mapInstanceRef.current?.setZoom(Math.min(21, (mapInstanceRef.current.getZoom() || 20) + 0.5)); }} className="h-10 w-10 text-primary focusable"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { isInteractingRef.current = true; mapInstanceRef.current?.setZoom(Math.max(15, (mapInstanceRef.current.getZoom() || 20) - 0.5)); }} className="h-10 w-10 text-primary focusable"><ZoomOut className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20">
        <Button 
          className="w-16 h-16 rounded-full bg-blue-600 shadow-2xl hover:bg-blue-500 focusable" 
          onClick={() => { 
            isInteractingRef.current = false; 
            navigator.geolocation.getCurrentPosition((p) => { 
              const pos = { lat: p.coords.latitude, lng: p.coords.longitude }; 
              mapInstanceRef.current?.setCenter(pos); 
              mapInstanceRef.current?.setZoom(tuner.zoom); 
              mapInstanceRef.current?.setTilt(tuner.tilt); 
              mapInstanceRef.current?.setHeading(p.coords.heading || 0);
            }); 
          }}
        >
          <Target className="w-7 h-7 text-white" />
        </Button>
      </div>
    </Card>
  );
}
