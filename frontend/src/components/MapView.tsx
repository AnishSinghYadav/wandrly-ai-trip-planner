import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({
  coords,
  destination,
}: {
  coords: [number, number] | null
  destination: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!coords || !mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapRef.current, {
      center: coords,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    const customIcon = L.divIcon({
      html: `
        <div style="
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #C49A49, #E8C878, #C49A49);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(196,154,73,0.7), inset 0 1px 0 rgba(255,255,255,0.3);
          border: 1.5px solid rgba(255,255,255,0.25);
        ">
          <span style="transform: rotate(45deg); font-size: 15px; display: block; line-height: 1;">✈️</span>
        </div>
      `,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -44],
    })

    L.marker(coords, { icon: customIcon })
      .addTo(map)
      .bindPopup(
        `<div style="
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 0.9rem;
          color: #0a0f1e;
          padding: 4px 2px;
          letter-spacing: 0.04em;
        ">
          ✦ ${destination}
        </div>`
      )
      .openPopup()

    L.circle(coords, {
      radius: 5000,
      color: '#C49A49',
      fillColor: '#C49A49',
      fillOpacity: 0.06,
      weight: 1.5,
      opacity: 0.4,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [coords, destination])

  if (!coords) {
    return (
      <div
        className="lux-card"
        style={{ padding: '3rem', textAlign: 'center', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div>
          <div style={{ fontSize: '2rem', color: 'rgb(var(--gold))', marginBottom: '8px', opacity: 0.4 }}>◉</div>
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem' }}>Map coordinates not available.</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '480px',
        border: '1px solid rgba(196,154,73,0.2)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 30px rgba(196,154,73,0.05)',
      }}
    >
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </motion.div>
  )
}
