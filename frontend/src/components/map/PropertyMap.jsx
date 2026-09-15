import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import SafeImage from '../common/SafeImage';
import { money } from '../../utils/format';
import 'leaflet/dist/leaflet.css';

const marker = L.divIcon({
  className: 'boardlk-map-marker',
  html: '<span aria-hidden="true">⌂</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

function MapViewport({ focus, latitude, longitude }) {
  const map = useMap();
  useEffect(() => {
    if (focus && latitude != null && longitude != null) map.setView([latitude, longitude], 14);
    else map.setView([7.8731, 80.7718], 7);
  }, [map, focus, latitude, longitude]);

  useEffect(() => {
    // Leaflet needs a size update when the mobile list/map switch reveals it.
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function PropertyMap({ properties, focus = false }) {
  const [tileError, setTileError] = useState(false);
  const valid = properties.filter(
    (property) =>
      Number.isFinite(Number(property.lat)) &&
      Number(property.lat) >= 5 &&
      Number(property.lat) <= 10 &&
      Number.isFinite(Number(property.lng)) &&
      Number(property.lng) >= 79 &&
      Number(property.lng) <= 82,
  );
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        scrollWheelZoom={false}
        className="property-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileError(true), load: () => setTileError(false) }}
        />
        <MapViewport focus={focus} latitude={valid[0]?.lat} longitude={valid[0]?.lng} />
        {valid.map((property) => (
          <Marker
            key={property.id}
            position={[Number(property.lat), Number(property.lng)]}
            icon={marker}
            title={property.title}
            alt={property.title}
          >
            <Popup>
              <div className="map-popup">
                <SafeImage src={property.images[0]} alt={property.title} />
                <h3>{property.title}</h3>
                <p>
                  {money(property.rent)} / month
                  <br />
                  {property.city}, {property.district}
                </p>
                <Link to={'/properties/' + property.id}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {tileError && (
        <p
          role="status"
          style={{
            position: 'absolute',
            bottom: 28,
            left: 10,
            right: 10,
            zIndex: 2,
            background: 'white',
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          Map tiles are unavailable. Property details are still available in the list.
        </p>
      )}
    </div>
  );
}
