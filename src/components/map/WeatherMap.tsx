import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { Theme } from '../../hooks/useTheme'

export type LatLon = { lat: number; lon: number }
export type FlyTarget = LatLon & { id: number }

type WeatherMapProps = {
    marker: LatLon | null
    flyTarget: FlyTarget | null
    theme: Theme
    onPick: (point: LatLon) => void
}

const STYLES: Record<Theme, string> = {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/dark',
}

maplibregl.setWorkerUrl(workerUrl)

const DEFAULT_CENTER: [number, number] = [20, 50]
const DEFAULT_ZOOM = 3.5
const FOCUS_ZOOM = 9

function createPinElement() {
    const element = document.createElement('div')
    element.className = 'map-pin'
    element.innerHTML = '<span class="map-pin-body"></span><span class="map-pin-pulse"></span>'
    return element
}

export default function WeatherMap({ marker, flyTarget, theme, onPick }: WeatherMapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)
    const appliedThemeRef = useRef<Theme | null>(null)
    const onPickRef = useRef(onPick)
    const initialRef = useRef({ theme, flyTarget })

    useEffect(() => {
        onPickRef.current = onPick
    }, [onPick])

    useEffect(() => {
        const { theme: initialTheme, flyTarget: initialTarget } = initialRef.current

        const map = new maplibregl.Map({
            container: containerRef.current!,
            style: STYLES[initialTheme],
            center: initialTarget ? [initialTarget.lon, initialTarget.lat] : DEFAULT_CENTER,
            zoom: initialTarget ? FOCUS_ZOOM : DEFAULT_ZOOM,
            minZoom: 1.5,
            dragRotate: false,
            pitchWithRotate: false,
            attributionControl: false,
        })

        map.touchZoomRotate.disableRotation()
        map.keyboard.disableRotation()
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
        map.on('click', (event) => {
            onPickRef.current({ lat: event.lngLat.lat, lon: event.lngLat.wrap().lng })
        })

        mapRef.current = map
        appliedThemeRef.current = initialTheme

        return () => {
            map.remove()
            mapRef.current = null
            markerRef.current = null
        }
    }, [])

    useEffect(() => {
        const map = mapRef.current

        if (map && appliedThemeRef.current !== theme) {
            map.setStyle(STYLES[theme])
            appliedThemeRef.current = theme
        }
    }, [theme])

    useEffect(() => {
        const map = mapRef.current

        if (!map) return

        if (!marker) {
            markerRef.current?.remove()
            markerRef.current = null
            return
        }

        if (!markerRef.current) {
            markerRef.current = new maplibregl.Marker({ element: createPinElement(), anchor: 'bottom' })
                .setLngLat([marker.lon, marker.lat])
                .addTo(map)
        } else {
            markerRef.current.setLngLat([marker.lon, marker.lat])
        }
    }, [marker])

    useEffect(() => {
        const map = mapRef.current

        if (map && flyTarget) {
            map.flyTo({
                center: [flyTarget.lon, flyTarget.lat],
                zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
                speed: 1.4,
                essential: true,
            })
        }
    }, [flyTarget])

    return <div ref={containerRef} className="weather-map" />
}
