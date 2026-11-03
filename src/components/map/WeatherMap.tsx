import { useEffect } from 'react'
import L from 'leaflet'
import { AttributionControl, MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export type LatLon = { lat: number; lon: number }
export type FlyTarget = LatLon & { id: number }

type WeatherMapProps = {
    marker: LatLon | null
    flyTarget: FlyTarget | null
    onPick: (point: LatLon) => void
}

const DEFAULT_CENTER: [number, number] = [50, 20]
const DEFAULT_ZOOM = 4
const FOCUS_ZOOM = 9
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const pinIcon = L.divIcon({
    className: 'map-pin',
    html: '<span class="map-pin-body"></span><span class="map-pin-pulse"></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
})

function ClickHandler({ onPick }: Pick<WeatherMapProps, 'onPick'>) {
    useMapEvents({
        click(event) {
            onPick({ lat: event.latlng.lat, lon: L.Util.wrapNum(event.latlng.lng, [-180, 180], true) })
        },
    })

    return null
}

function FlyController({ target }: { target: FlyTarget | null }) {
    const map = useMap()

    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 1.2 })
        }
    }, [map, target])

    return null
}

export default function WeatherMap({ marker, flyTarget, onPick }: WeatherMapProps) {
    const initialCenter: [number, number] = flyTarget ? [flyTarget.lat, flyTarget.lon] : DEFAULT_CENTER

    return (
        <MapContainer
            className="weather-map"
            center={initialCenter}
            zoom={flyTarget ? FOCUS_ZOOM : DEFAULT_ZOOM}
            minZoom={2}
            worldCopyJump
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
            <ZoomControl position="bottomleft" />
            <AttributionControl position="bottomleft" prefix={false} />
            <ClickHandler onPick={onPick} />
            <FlyController target={flyTarget} />
            {marker && <Marker position={[marker.lat, marker.lon]} icon={pinIcon} interactive={false} />}
        </MapContainer>
    )
}
