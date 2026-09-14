import { useState } from 'react';
import { Camera, Pencil, Check, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { authService } from '../../services/authService';
import { FormInput, FormSelect, FormTextarea } from './Fields';
import { Avatar, Modal } from '../common/UI';
import { districts, cities, roomTypes } from '../../data/locations';
import { emailValid, phoneValid, passwordValid } from '../../utils/validation';
import { readImage } from '../../utils/images';
import { date, today } from '../../utils/format';
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const s = useStore();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ ...user });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', password: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [busy, setBusy] = useState(false);
  const owner = user.role === 'owner';
  const set = (k, v) =>
    setF({ ...f, [k]: v, ...(k === 'preferredDistrict' ? { preferredCity: '' } : {}) });
  const field = (k, label, type = 'text') => (
    <FormInput
      label={label}
      type={type}
      value={f[k] || ''}
      disabled={!editing}
      error={errors[k]}
      onChange={(e) => set(k, e.target.value)}
      {...(type === 'date' ? { max: today() } : {})}
    />
  );
  function save(e) {
    e.preventDefault();
    const errors = {};
    if ((f.name || '').trim().length < 3) errors.name = 'Enter your full name.';
    if (!emailValid(f.email)) errors.email = 'Enter a valid email.';
    if (s.users.some((u) => u.id !== user.id && u.email.toLowerCase() === f.email.toLowerCase()))
      errors.email = 'This email is already in use.';
    if (!phoneValid(f.phone)) errors.phone = 'Enter a valid Sri Lankan phone number.';
    if (f.budget && Number(f.budget) < 0) errors.budget = 'Budget cannot be negative.';
    if (f.dob && f.dob > today()) errors.dob = 'Birth date cannot be in the future.';
    if (owner && f.nic && !/^(?:[0-9]{9}[VvXx]|[0-9]{12})$/.test(f.nic))
      errors.nic = 'Enter a valid NIC format.';
    setErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const { id, role, ...patch } = f;
      updateUser(patch);
      setEditing(false);
      setMessage('Your profile has been updated.');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>My profile</h1>
          <p>Keep your details up to date and help people get to know you.</p>
        </div>
        {!editing && (
          <button
            className="btn"
            onClick={() => {
              setF({ ...user });
              setEditing(true);
              setMessage('');
            }}
          >
            <Pencil size={15} />
            Edit profile
          </button>
        )}
      </div>
      <form className="profile-panel panel" onSubmit={save} noValidate>
        <div className="profile-header">
          <Avatar user={f} />
          <div>
            <h2>{user.name}</h2>
            <p>{owner ? 'Boarding Owner' : 'Renter / Student'}</p>
            {editing && (
              <label className="text-link upload-label">
                <Camera size={14} />
                Change photo
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    try {
                      if (e.target.files[0]) set('photo', await readImage(e.target.files[0]));
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
        {message && (
          <div className="success" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        <h3>Personal information</h3>
        <div className="grid-2 profile-fields">
          {field('name', 'Full name')}
          {field('email', 'Email address', 'email')}
          {field('phone', 'Phone number', 'tel')}
          {owner ? (
            field('nic', 'NIC / Identification number')
          ) : (
            <FormSelect
              label="Gender"
              options={['Male', 'Female', 'Prefer not to say']}
              value={f.gender || ''}
              disabled={!editing}
              onChange={(e) => set('gender', e.target.value)}
            />
          )}
        </div>
        {owner ? (
          <>
            <FormTextarea
              label="Address"
              value={f.address || ''}
              disabled={!editing}
              onChange={(e) => set('address', e.target.value)}
            />
            <div className="property-facts">
              <div>
                <small>Number of properties</small>
                <strong>{s.properties.filter((p) => p.ownerId === user.id).length}</strong>
              </div>
              <div>
                <small>Joined BoardLK</small>
                <strong>{date(user.joined)}</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid-2">
              {field('dob', 'Date of birth', 'date')}
              {field('workplace', 'University / workplace')}
            </div>
            <div className="divider" />
            <h3>Your boarding preferences</h3>
            <div className="grid-2 profile-fields">
              <FormSelect
                label="Preferred district"
                options={districts}
                value={f.preferredDistrict || ''}
                disabled={!editing}
                onChange={(e) => set('preferredDistrict', e.target.value)}
              />
              <FormSelect
                label="Preferred city"
                options={cities[f.preferredDistrict] || []}
                value={f.preferredCity || ''}
                disabled={!editing}
                onChange={(e) => set('preferredCity', e.target.value)}
              />
              {field('budget', 'Monthly budget (Rs.)', 'number')}
              <FormSelect
                label="Preferred room type"
                options={roomTypes}
                value={f.preferredRoomType || ''}
                disabled={!editing}
                onChange={(e) => set('preferredRoomType', e.target.value)}
              />
            </div>
            <FormTextarea
              label="A little about you"
              value={f.bio || ''}
              disabled={!editing}
              onChange={(e) => set('bio', e.target.value)}
            />
          </>
        )}
        {editing && (
          <div className="actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setEditing(false);
                setF({ ...user });
                setErrors({});
                setError('');
              }}
            >
              Cancel
            </button>
            <button className="btn">
              <Check size={15} />
              Save changes
            </button>
          </div>
        )}
      </form>
      <div className="panel profile-security">
        <div>
          <h3>Account security</h3>
          <p>Choose a strong password to keep your account secure.</p>
        </div>
        <button
          className="btn secondary"
          onClick={() => {
            setPasswordModal(true);
            setPasswordError('');
            setPasswords({ current: '', password: '', confirm: '' });
          }}
        >
          <LockKeyhole size={16} />
          Change password
        </button>
      </div>
      {passwordModal && (
        <Modal title="Change password" onClose={() => setPasswordModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!passwordValid(passwords.password)) {
                setPasswordError('Use 8+ characters with uppercase, lowercase and a number.');
                return;
              }
              if (passwords.password !== passwords.confirm) {
                setPasswordError('New passwords do not match.');
                return;
              }
              setBusy(true);
              try {
                await authService.changePassword(user.id, passwords.current, passwords.password);
                setPasswordModal(false);
                setMessage('Password changed successfully.');
              } catch (e) {
                setPasswordError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {[
              ['current', 'Current password'],
              ['password', 'New password'],
              ['confirm', 'Confirm new password'],
            ].map(([key, label]) => (
              <FormInput
                key={key}
                label={label}
                type="password"
                required
                value={passwords[key]}
                onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
              />
            ))}
            {passwordError && (
              <p className="error-box" role="alert">
                {passwordError}
              </p>
            )}
            <button className="btn full-width" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
