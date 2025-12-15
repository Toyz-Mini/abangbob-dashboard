'use client';

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, Loader2, Navigation } from 'lucide-react';

interface LocationMapPickerProps {
    latitude: number;
    longitude: number;
    radius: number;
    onLocationChange: (lat: number, lng: number) => void;
    onRadiusChange?: (radius: number) => void;
}

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
};

const mapOptions: google.maps.MapOptions = {
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    styles: [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
        },
    ],
};

export default function LocationMapPicker({
    latitude,
    longitude,
    radius,
    onLocationChange,
    onRadiusChange,
}: LocationMapPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState({ lat: latitude, lng: longitude });
    const [markerPosition, setMarkerPosition] = useState({ lat: latitude, lng: longitude });
    const [gettingLocation, setGettingLocation] = useState(false);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            onLocationChange(lat, lng);
        }
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            onLocationChange(lat, lng);
        }
    };

    const getCurrentLocation = () => {
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCenter({ lat, lng });
                setMarkerPosition({ lat, lng });
                onLocationChange(lat, lng);
                map?.panTo({ lat, lng });
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

    const circleOptions: google.maps.CircleOptions = {
        strokeColor: '#dc2626',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#dc2626',
        fillOpacity: 0.15,
        clickable: false,
        draggable: false,
        editable: false,
        visible: true,
        radius: radius,
        zIndex: 1,
    };

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">Gagal memuatkan Google Maps</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sila pastikan API key configured dengan betul
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Memuatkan map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={16}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={mapOptions}
            >
                {/* Marker */}
                <Marker
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#dc2626',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    }}
                />

                {/* Radius Circle */}
                <Circle
                    center={markerPosition}
                    options={circleOptions}
                />
            </GoogleMap>

            {/* Current Location Button */}
            <button
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                style={{ zIndex: 1000 }}
            >
                {gettingLocation ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        <span className="text-sm">Getting location...</span>
                    </>
                ) : (
                    <>
                        <Navigation size={18} />
                        <span className="text-sm">Lokasi Semasa</span>
                    </>
                )}
            </button>

            {/* Info Box */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg" style={{ zIndex: 1000 }}>
                <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-red-600" />
                    <div>
                        <div className="font-semibold">Koordinat Terpilih:</div>
                        <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                        </div>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ⭕ Radius: {radius}m
                </div>
            </div>
        </div>
    );
}
