import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { roomTypes } from '../../data/locations';
export default function SearchBar({ initial = {}, compact = false }) {
  const [f, setF] = useState(initial);
  const navigate = useNavigate();
  const update = (k, v) => setF({ ...f, [k]: v });
  return (
    <form
      className={'search-bar ' + (compact ? 'compact' : '')}
      onSubmit={(e) => {
        e.preventDefault();
        navigate('/properties?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v)));
      }}
    >
      <div className="search-location">
        <label htmlFor={compact ? 'location-small' : 'location'}>
          <MapPin size={14} /> Location
        </label>
        <input
          id={compact ? 'location-small' : 'location'}
          placeholder="City, area or university"
          value={f.q || ''}
          onChange={(e) => update('q', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={compact ? 'min-small' : 'min'}>Min. rent</label>
        <input
          id={compact ? 'min-small' : 'min'}
          type="number"
          min="0"
          placeholder="Rs. Min"
          value={f.min || ''}
          onChange={(e) => update('min', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={compact ? 'max-small' : 'max'}>Max. rent</label>
        <input
          id={compact ? 'max-small' : 'max'}
          type="number"
          min={f.min || 0}
          placeholder="Rs. Max"
          value={f.max || ''}
          onChange={(e) => update('max', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={compact ? 'room-small' : 'room'}>Room type</label>
        <select
          id={compact ? 'room-small' : 'room'}
          value={f.roomType || ''}
          onChange={(e) => update('roomType', e.target.value)}
        >
          <option value="">Any room type</option>
          {roomTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <button className="btn" type="submit">
        <Search size={17} />
        Search
      </button>
    </form>
  );
}
