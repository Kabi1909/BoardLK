import { sriLankaDate } from './date.js';
export const money = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-LK');
export const date = (s) =>
  s
    ? new Date(s).toLocaleDateString('en-GB', {
        timeZone: 'Asia/Colombo',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
export const uid = () => crypto.randomUUID();
export const initials = (name) =>
  (name || 'Guest')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
export const today = () => sriLankaDate();
