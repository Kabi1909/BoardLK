import { today } from './format.js';

export function validateBooking(form, availableSpaces) {
  const errors = {};
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.moveIn || '') ||
    Number.isNaN(Date.parse(form.moveIn)) ||
    form.moveIn < today()
  ) {
    errors.moveIn = 'Choose today or a future move-in date.';
  }
  const occupants = Number(form.occupants);
  if (!Number.isInteger(occupants) || occupants < 1 || occupants > availableSpaces) {
    errors.occupants = 'Choose between 1 and ' + availableSpaces + ' occupants.';
  }
  if (!String(form.duration || '').trim()) errors.duration = 'Choose a stay duration.';
  if (String(form.message || '').trim().length < 10)
    errors.message = 'Write at least 10 characters for the owner.';
  return errors;
}
