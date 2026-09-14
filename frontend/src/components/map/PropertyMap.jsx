import {MapContainer,TileLayer,Marker,Popup,useMap} from 'react-leaflet';
import L from 'leaflet';
import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {money} from '../../utils/format';
import 'leaflet/dist/leaflet.css';
const marker=L.divIcon({className:'boardlk-map-marker',html:'<span>⌂</span>',iconSize:[34,34],iconAnchor:[17,34],popupAnchor:[0,-30]});
function Fit({properties,focus}){const map=useMap();useEffect(()=>{if(focus&&properties.length)map.setView([properties[0].lat,properties[0].lng],14);else map.setView([7.8731,80.7718],7);},[focus,properties,map]);return null;}
export default function PropertyMap({properties,focus=false}){const valid=properties.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng)));return <MapContainer center={[7.8731,80.7718]} zoom={7} scrollWheelZoom={false} className="property-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Fit properties={properties} focus={focus}/>{valid.map(p=><Marker key={p.id} position={[Number(p.lat),Number(p.lng)]} icon={marker}><Popup><div className="map-popup"><img src={p.images[0]} alt={p.title}/><h3>{p.title}</h3><p>{money(p.rent)} / month<br/>{p.city}, {p.district}</p><Link to={'/properties/'+p.id}>View details →</Link></div></Popup></Marker>)}</MapContainer>;}
