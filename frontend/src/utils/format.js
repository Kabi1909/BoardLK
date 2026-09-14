export const money = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-LK');
export const date = (s) =>
  s
    ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
export const uid = () => crypto.randomUUID();
export const initials = (name) =>
  (name || 'Guest')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
export const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
