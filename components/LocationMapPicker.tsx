'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Loader2, MapPin } from 'lucide-react';

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapPickerProps {
    latitude: number;
    longitude: number;
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
}

// Custom marker icon (red)
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
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

                // Pan map to new location
                if (mapRef.current) {
                    mapRef.current.flyTo([lat, lng], 16);
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
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Memuatkan map...</p>
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
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Map click handler */}
                <MapClickHandler onLocationChange={handleMapClick} />

                {/* Draggable marker */}
                <Marker
                    position={position}
                    draggable={true}
                    eventHandlers={{
                        dragend: handleMarkerDrag,
                    }}
                    icon={redIcon}
                />

                {/* Radius circle */}
                <Circle
                    center={position}
                    radius={radius}
                    pathOptions={{
                        color: '#dc2626',
                        fillColor: '#dc2626',
                        fillOpacity: 0.15,
                        weight: 2,
                    }}
                />
            </MapContainer>

            {/* Current Location Button */}
            <button
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-[1000]"
            >
                {gettingLocation ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm">Getting...</span>
                    </>
                ) : (
                    <>
                        <Navigation size={18} />
                        <span className="text-sm">Lokasi Semasa</span>
                    </>
                )}
            </button>

            {/* Info Box */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg z-[1000]">
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-red-600" />
                    <div>
                        <div className="font-semibold">Koordinat Terpilih:</div>
                        <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {position[0].toFixed(6)}, {position[1].toFixed(6)}
                        </div>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ⭕ Radius: {radius}m
                </div>
            </div>

            {/* Leaflet CSS fix for dark mode */}
            <style jsx global>{`
        .leaflet-container {
          background: rgb(243, 244, 246);
        }
        
        .dark .leaflet-container {
          background: rgb(31, 41, 55);
        }

        .leaflet-marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        .leaflet-control-zoom a {
          color: #374151 !important;
          background-color: white !important;
        }

        .dark .leaflet-control-zoom a {
          color: #d1d5db !important;
          background-color: rgb(31, 41, 55) !important;
        }

        .leaflet-control-zoom a:hover {
          background-color: rgb(243, 244, 246) !important;
        }

        .dark .leaflet-control-zoom a:hover {
          background-color: rgb(55, 65, 81) !important;
        }
      `}</style>
        </div>
    );
}
