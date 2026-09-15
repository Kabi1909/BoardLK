import SafeImage from '../../components/common/SafeImage.jsx';
import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload, Trash2, ImagePlus, Save, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { collection } from '../../services/store';
import { uid, money } from '../../utils/format';
import { validateProperty } from '../../utils/validation';
import { readImage } from '../../utils/images';
import {
  districts,
  cities,
  propertyTypes,
  roomTypes,
  genders,
  facilities,
} from '../../data/locations';
import { FormInput, FormSelect, FormTextarea, Checkbox } from '../../components/forms/Fields';
import { EmptyState } from '../../components/common/UI';
const steps = [
  'Basic information',
  'Location',
  'Room information',
  'Pricing',
  'Facilities',
  'House rules',
  'Photos',
  'Review & publish',
];
const empty = {
  title: '',
  description: '',
  type: 'Boarding House',
  district: '',
  city: '',
  address: '',
  landmark: '',
  lat: '',
  lng: '',
  nearby: '',
  roomType: 'Single',
  rooms: 1,
  capacity: 1,
  spaces: 1,
  gender: 'Any',
  rent: '',
  deposit: 0,
  utilities: 0,
  advance: 1,
  facilities: [],
  smoking: false,
  pets: false,
  visitors: true,
  curfew: '',
  rules: '',
  images: [],
  status: 'Draft',
};
export default function PropertyForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const s = useStore();
  const navigate = useNavigate();
  const existing = s.properties.find((p) => p.id === id && p.ownerId === user.id);
  const [f, setF] = useState(
    existing
      ? { ...existing, images: [...existing.images], facilities: [...existing.facilities] }
      : empty,
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (id && !existing)
    return (
      <EmptyState
        title="Property not found"
        description="You can only edit your own properties."
        action={
          <Link className="btn" to="/owner/properties">
            Back to properties
          </Link>
        }
      />
    );
  const set = (k, v) =>
    setF((prev) => ({ ...prev, [k]: v, ...(k === 'district' ? { city: '' } : {}) }));
  const field = (k, label, type = 'text', hint) => (
    <FormInput
      label={label}
      type={type}
      value={f[k]}
      onChange={(e) => set(k, e.target.value)}
      error={errors[k]}
      hint={hint}
      min={type === 'number' ? 0 : undefined}
    />
  );
  const select = (k, label, options) => (
    <FormSelect
      label={label}
      options={options}
      value={f[k]}
      onChange={(e) => set(k, e.target.value)}
      error={errors[k]}
    />
  );
  function next() {
    const errs = validateProperty(f, step);
    setErrors(errs);
    if (!Object.keys(errs).length) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  }
  function save(status) {
    setError('');
    if (status !== 'Draft') {
      for (let i = 0; i < 7; i++) {
        const errs = validateProperty(f, i);
        if (Object.keys(errs).length) {
          setErrors(errs);
          setStep(i);
          setError('Please complete the highlighted fields before publishing.');
          return;
        }
      }
    } else if (f.title.trim().length < 5) {
      setStep(0);
      setErrors({ title: 'Enter a title of at least 5 characters to save a draft.' });
      return;
    }
    try {
      const numeric = [
        'lat',
        'lng',
        'rooms',
        'capacity',
        'spaces',
        'rent',
        'deposit',
        'utilities',
        'advance',
      ];
      const property = {
        ...f,
        ...Object.fromEntries(numeric.map((k) => [k, Number(f[k])])),
        status,
        id: existing?.id || uid(),
        ownerId: user.id,
        views: existing?.views || 0,
        rating: existing?.rating || 0,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      if (existing) collection('properties').update(existing.id, property);
      else collection('properties').add(property);
      navigate('/owner/properties');
    } catch (e) {
      setError(e.message);
    }
  }
  async function upload(event) {
    const files = Array.from(event.target.files || []);
    if (f.images.length + files.length > 8) {
      setError('You can add up to 8 photos per property.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const images = [];
      for (const file of files) images.push(await readImage(file));
      setF((prev) => ({ ...prev, images: [...prev.images, ...images] }));
      setErrors({});
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }
  return (
    <>
      <div className="page-heading">
        <Link className="text-link" to="/owner/properties">
          <ArrowLeft size={14} />
          My properties
        </Link>
        <h1>{existing ? 'Edit your property' : 'Make room for a new beginning.'}</h1>
        <p>
          {existing
            ? 'Keep your listing accurate and inviting.'
            : 'Tell renters what makes your place feel like home.'}
        </p>
      </div>
      <div className="wizard">
        <aside className="wizard-steps">
          {steps.map((label, i) => (
            <div className={i === step ? 'active' : i < step ? 'complete' : ''} key={label}>
              <span>{i < step ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</span>
              <div>
                <small>STEP {i + 1}</small>
                <strong>{label}</strong>
              </div>
            </div>
          ))}
        </aside>
        <section className="wizard-body panel">
          <div className="wizard-progress">
            <span>Step {step + 1} of 8</span>
            <progress max="8" value={step + 1} />
          </div>
          <h2>{steps[step]}</h2>
          <p className="wizard-intro">
            {
              [
                'Start with the essentials. A clear description helps the right renters find you.',
                'Help renters picture their everyday commute.',
                'Give renters a clear picture of the space available.',
                'Clear pricing makes planning a little easier.',
                'The everyday comforts that make a difference.',
                'Set expectations for a comfortable shared experience.',
                'Bright, clear photos help renters imagine their new home.',
                'Take a final look before sharing your space.',
              ][step]
            }
          </p>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          {step === 0 && (
            <>
              {field('title', 'Property title')}
              <FormTextarea
                label="Description"
                rows={6}
                value={f.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description}
                placeholder="Describe your space, the neighbourhood, and who it would suit…"
              />
              {select('type', 'Property type', propertyTypes)}
            </>
          )}
          {step === 1 && (
            <>
              <div className="grid-2">
                {select('district', 'District', districts)}
                {select('city', 'City', cities[f.district] || [])}
              </div>
              {field('address', 'Street address')}
              {field('landmark', 'Nearby landmark')}
              <div className="grid-2">
                {field('lat', 'Latitude', 'number', 'Example: 8.7542 for Vavuniya')}
                {field('lng', 'Longitude', 'number', 'Example: 80.4982 for Vavuniya')}
              </div>
              {field('nearby', 'Nearby university / workplace')}
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid-2">
                {select('roomType', 'Room type', roomTypes)}
                {select('gender', 'Gender preference', genders)}
                {field('rooms', 'Number of rooms', 'number')}
                {field('capacity', 'Maximum occupants', 'number')}
                {field('spaces', 'Available spaces', 'number')}
              </div>
              <p className="fine-print">
                Available spaces cannot exceed the maximum number of occupants.
              </p>
            </>
          )}
          {step === 3 && (
            <div className="grid-2">
              {field('rent', 'Monthly rent (Rs.)', 'number')}
              {field('deposit', 'Security deposit (Rs.)', 'number')}
              {field('utilities', 'Monthly utility charges (Rs.)', 'number')}
              {field('advance', 'Advance payment (months)', 'number')}
            </div>
          )}
          {step === 4 && (
            <div className="facilities-form">
              {facilities.map((facility) => (
                <Checkbox
                  key={facility}
                  label={facility}
                  checked={f.facilities.includes(facility)}
                  onChange={(e) =>
                    set(
                      'facilities',
                      e.target.checked
                        ? [...f.facilities, facility]
                        : f.facilities.filter((x) => x !== facility),
                    )
                  }
                />
              ))}
            </div>
          )}
          {step === 5 && (
            <>
              <div className="grid-3">
                {[
                  ['smoking', 'Smoking allowed'],
                  ['pets', 'Pets allowed'],
                  ['visitors', 'Visitors allowed'],
                ].map(([key, label]) => (
                  <Checkbox
                    key={key}
                    label={label}
                    checked={f[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                ))}
              </div>
              {field(
                'curfew',
                'Curfew (optional)',
                'text',
                'Example: 10:00 PM, or leave empty for no curfew',
              )}
              <FormTextarea
                label="Other house rules"
                value={f.rules}
                onChange={(e) => set('rules', e.target.value)}
              />
            </>
          )}
          {step === 6 && (
            <>
              <label className="image-upload">
                <ImagePlus size={35} />
                <strong>{busy ? 'Preparing your photos…' : 'Add photos of your property'}</strong>
                <span>JPG, PNG or WebP · up to 5 MB each · maximum 8 photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={upload}
                  disabled={busy}
                />
              </label>
              {errors.images && <p className="error">{errors.images}</p>}
              <div className="upload-grid">
                {f.images.map((image, i) => (
                  <div key={i}>
                    <SafeImage src={image} alt={'Property photo ' + (i + 1)} />
                    <button
                      className={'cover-select ' + (i === 0 ? 'active' : '')}
                      onClick={() => set('images', [image, ...f.images.filter((_, j) => j !== i)])}
                    >
                      {i === 0 ? '✓ Cover photo' : 'Set as cover'}
                    </button>
                    <button
                      className="remove-image"
                      aria-label={'Remove photo ' + (i + 1)}
                      onClick={() =>
                        set(
                          'images',
                          f.images.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {step === 7 && (
            <div className="publish-preview">
              {f.images[0] && (
                <SafeImage className="preview-cover" src={f.images[0]} alt={f.title} />
              )}
              <h2>{f.title}</h2>
              <p>
                {f.address}, {f.city}, {f.district}
              </p>
              <strong className="rent">{money(f.rent)} / month</strong>
              <p>{f.description}</p>
              <div className="property-facts">
                {[
                  ['Type', f.type],
                  ['Room', f.roomType],
                  ['Rooms', f.rooms],
                  ['Capacity', f.capacity],
                  ['Spaces', f.spaces],
                  ['Preference', f.gender],
                  ['Deposit', money(f.deposit)],
                  ['Utilities', money(f.utilities)],
                  ['Advance', f.advance + ' months'],
                  ['Latitude', f.lat],
                  ['Longitude', f.lng],
                  ['Nearby', f.nearby || '—'],
                  ['Landmark', f.landmark || '—'],
                  ['Smoking', f.smoking ? 'Allowed' : 'Not allowed'],
                  ['Pets', f.pets ? 'Allowed' : 'Not allowed'],
                  ['Visitors', f.visitors ? 'Allowed' : 'Not allowed'],
                  ['Curfew', f.curfew || 'None'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <h3>Facilities</h3>
              <p>{f.facilities.join(' · ') || 'No facilities selected'}</p>
              <h3>House rules</h3>
              <p>{f.rules || 'No additional rules'}</p>
              <div className="preview-thumbnails">
                {f.images.map((img, i) => (
                  <SafeImage key={i} src={img} alt={'Preview photo ' + (i + 1)} />
                ))}
              </div>
              {existing && select('status', 'Listing status', ['Published', 'Disabled', 'Draft'])}
            </div>
          )}
          <div className="wizard-actions">
            <button
              className="btn secondary"
              disabled={step === 0 || busy}
              onClick={() => {
                setStep(step - 1);
                setErrors({});
              }}
            >
              Previous
            </button>
            <button className="text-link" disabled={busy} onClick={() => save('Draft')}>
              <Save size={14} />
              Save draft
            </button>
            {step < 7 ? (
              <button className="btn" disabled={busy} onClick={next}>
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  save(existing ? (f.status === 'Draft' ? 'Published' : f.status) : 'Published')
                }
              >
                <Send size={14} />
                {existing ? 'Save property' : 'Publish property'}
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
