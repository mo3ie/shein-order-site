"use client";
import { useEffect, useRef } from "react";

// Leaflet loaded dynamically to avoid SSR issues
export default function MapPicker({ lat, lng, onSelect }) {
  const mapRef    = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);

  const defaultLat = lat || 32.9;
  const defaultLng = lng || 13.1;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inject leaflet CSS if not already there
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id    = "leaflet-css";
      link.rel   = "stylesheet";
      link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      leafletRef.current = L.default || L;
      const Lf = leafletRef.current;

      // Fix default icon path issue in Next.js
      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current && !mapRef.current._leaflet_id) {
        const map = Lf.map(mapRef.current).setView([defaultLat, defaultLng], 12);
        Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // Initial marker if coords provided
        if (lat && lng) {
          markerRef.current = Lf.marker([lat, lng]).addTo(map);
        }

        map.on("click", (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            markerRef.current = Lf.marker([clickLat, clickLng]).addTo(map);
          }
          onSelect({ lat: clickLat, lng: clickLng });
        });
      }
    });

    return () => {
      if (mapRef.current?._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }
    };
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ height: 240, borderRadius: 12, border: "1.5px solid #e5e7eb", overflow: "hidden" }} />
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6, textAlign: "center" }}>
        🗺️ انقر على الخريطة لتحديد موقعك
      </p>
    </div>
  );
}
