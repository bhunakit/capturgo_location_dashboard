import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationData } from '../types';

// Use Mapbox access token from environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

if (!mapboxgl.accessToken) {
  console.error('Missing Mapbox token. Check your .env.local file.');
}

interface MapProps {
  locationData: LocationData[];
}

const Map: React.FC<MapProps> = ({ locationData }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Use dark mode for a more modern look
      center: [-74.5, 40], // Default center (will be updated when data loads)
      zoom: 2,
      attributionControl: false // Remove attribution for cleaner look
    });
    
    // Add minimal attribution in bottom right
    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }));

    map.current.on('load', () => {
      setLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!loaded || !map.current || locationData.length === 0) return;

    // Clear previous data
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    // Create points array for the line
    const points = locationData.map(loc => [loc.longitude, loc.latitude]);

    // Add the route source and layer
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points
        }
      }
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    // Add custom dot markers for each location
    locationData.forEach((location) => {
      // Create a simple popup with minimal info
      const popup = new mapboxgl.Popup({ offset: 5, closeButton: false })
        .setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 8px; font-size: 12px;">
            <p>${new Date(location.created_at).toLocaleString()}</p>
            <p>${location.speed.toFixed(1)} km/h</p>
          </div>
        `);

      // Create a custom dot marker element
      const el = document.createElement('div');
      el.className = 'dot-marker';
      el.style.width = '8px';
      el.style.height = '8px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid #ffffff';
      
      new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit the map to the route
    if (points.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach(point => bounds.extend(point as [number, number]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locationData, loaded]);

  return (
    <div ref={mapContainer} className="w-full h-[70vh] rounded-xl shadow-sm overflow-hidden" />
  );
};

export default Map;
