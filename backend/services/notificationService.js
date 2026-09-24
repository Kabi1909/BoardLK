import Notification from '../models/Notification.js';
export async function notify(user, type, title, message, link, session) {
  const [notification] = await Notification.create([{ user, type, title, message, link }], {
    session,
  });
  return notification;
}
