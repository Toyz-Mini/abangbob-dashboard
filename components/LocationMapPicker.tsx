'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Loader2, MapPin, Crosshair } from 'lucide-react';

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom animated marker with premium design
const customMarker = L.divIcon({
    className: 'custom-marker',
    html: `
    <div class="marker-pin">
      <div class="marker-pin-inner"></div>
      <div class="marker-shadow"></div>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

interface LocationMapPickerProps {
    latitude: number;
    longitude: number;
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
    const map = useMap();

    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
            // Smooth pan to clicked location
            map.flyTo(e.latlng, map.getZoom(), {
                duration: 0.5
            });
        },
    });
    return null;
}

export default function LocationMapPicker({
    latitude,
    longitude,
    radius,
    onLocationChange,
}: LocationMapPickerProps) {
    const [position, setPosition] = useState<[number, number]>([latitude || 4.9031, longitude || 114.9398]);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (latitude && longitude) {
            setPosition([latitude, longitude]);
        }
    }, [latitude, longitude]);

    const getCurrentLocation = () => {
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setPosition([lat, lng]);
                onLocationChange(lat, lng);

                // Smooth fly to new location
                if (mapRef.current) {
                    mapRef.current.flyTo([lat, lng], 17, {
                        duration: 1.5
                    });
                }
                setGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Gagal mendapatkan lokasi. Sila benarkan akses lokasi.');
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
            }
        );
    };

    const handleMarkerDrag = (e: L.DragEndEvent) => {
        const marker = e.target;
        const newPos = marker.getLatLng();
        setPosition([newPos.lat, newPos.lng]);
        onLocationChange(newPos.lat, newPos.lng);
    };

    const handleMapClick = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
    };

    return (
        <div className="relative h-full w-full">
            {!mapReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Loader2 className="animate-spin text-red-500" size={48} />
                            <div className="absolute inset-0 animate-ping">
                                <Loader2 className="text-red-500/30" size={48} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">Memuatkan map...</p>
                    </div>
                </div>
            )}

            <MapContainer
                center={position}
                zoom={16}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                whenCreated={(map) => {
                    mapRef.current = map;
                    setMapReady(true);
                }}
                zoomControl={false}
            >
                {/* Dark Modern Tiles - CartoDB Dark Matter */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    className="map-tiles"
                />

                {/* Map click handler */}
                <MapClickHandler onLocationChange={handleMapClick} />

                {/* Draggable marker with custom icon */}
                <Marker
                    position={position}
                    draggable={true}
                    eventHandlers={{
                        dragend: handleMarkerDrag,
                    }}
                    icon={customMarker}
                />

                {/* Radius circle with glow effect */}
                <Circle
                    center={position}
                    radius={radius}
                    pathOptions={{
                        color: '#ef4444',
                        fillColor: '#ef4444',
                        fillOpacity: 0.1,
                        weight: 2,
                        opacity: 0.8,
                    }}
                />
            </MapContainer>

            {/* Premium Glassmorphic Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-[1000]">
                {/* Current Location Button */}
                <button
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 text-white px-4 py-2.5 rounded-xl shadow-2xl hover:bg-white/20 dark:hover:bg-gray-800/60 transition-all duration-300 flex items-center gap-2 group disabled:opacity-50"
                    style={{
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                    }}
                >
                    {gettingLocation ? (
                        <>
                            <Loader2 className="animate-spin text-red-400" size={18} />
                            <span className="text-sm font-medium">Locating...</span>
                        </>
                    ) : (
                        <>
                            <Navigation className="text-red-400 group-hover:scale-110 transition-transform" size={18} />
                            <span className="text-sm font-medium">My Location</span>
                        </>
                    )}
                </button>
            </div>

            {/* Premium Info Box - Glassmorphism */}
            <div className="absolute bottom-4 left-4 bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 px-5 py-4 rounded-xl shadow-2xl z-[1000]"
                style={{
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <MapPin size={20} className="text-red-400" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white mb-1">Selected Location</div>
                        <div className="text-gray-300 font-mono text-xs bg-black/20 px-2 py-1 rounded">
                            {position[0].toFixed(6)}, {position[1].toFixed(6)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-400">Radius: {radius}m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crosshair Center Indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[999]">
                <Crosshair className="text-red-500/30" size={32} />
            </div>

            {/* Premium Styling */}
            <style jsx global>{`
        /* Map Container Dark Theme */
        .leaflet-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          font-family: inherit;
        }

        /* Hide default attribution for cleaner look */
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 2px 6px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .leaflet-control-attribution a {
          color: #ef4444 !important;
        }

        /* Custom Marker Animation */
        .custom-marker {
          position: relative;
        }

        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -15px;
          animation: bounce 2s infinite;
          box-shadow: 
            0 0 0 4px rgba(239, 68, 68, 0.2),
            0 4px 12px rgba(239, 68, 68, 0.4),
            0 0 20px rgba(239, 68, 68, 0.3);
        }

        .marker-pin-inner {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }

        .marker-shadow {
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(0,0,0,0.3) 0%, transparent 70%);
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          animation: shadowPulse 2s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: rotate(-45deg) translateY(0);
          }
          50% {
            transform: rotate(-45deg) translateY(-10px);
          }
        }

        @keyframes shadowPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scale(1.2);
            opacity: 0.1;
          }
        }

        /* Map tiles darker for better contrast */
        .map-tiles {
          filter: brightness(0.8) contrast(1.1);
        }

        /* Custom zoom controls - hidden for cleaner look */
        .leaflet-control-zoom {
          display: none;
        }

        /* Smooth transitions */
        .leaflet-marker-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Circle animation */
        .leaflet-interactive {
          filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.3));
        }
      `}</style>
        </div>
    );
}
