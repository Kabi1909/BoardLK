import { z } from 'zod';
import {
  ROLES,
  DISTRICTS,
  PROPERTY_TYPES,
  ROOM_TYPES,
  GENDERS,
  FACILITIES,
  AVAILABILITY,
} from '../utils/constants.js';
export const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');
const text = (max = 200) => z.string().trim().max(max);
const amount = z.number().finite().nonnegative().max(100000000);
const positive = z.number().int().min(1).max(10000);
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[0-9]/, 'Include a number.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be 72 bytes or fewer.');
export const phone = z.string().regex(/^(?:\+94|0)[1-9]\d{8}$/, 'Enter a Sri Lankan phone number.');
export const register = z
  .strictObject({
    name: text(100).min(3),
    email,
    phone,
    password,
    confirmPassword: z.string(),
    role: z.enum(ROLES),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });
export const login = z.strictObject({ email, password: z.string().min(1).max(72) });
export const changePassword = z
  .strictObject({
    currentPassword: z.string().max(72),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });
export const resetPassword = z
  .strictObject({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });
export const profile = z.strictObject({
  name: text(100).min(3).optional(),
  email: email.optional(),
  phone: phone.optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say', '']).optional(),
  dateOfBirth: z.iso
    .date()
    .refine((v) => new Date(v) <= new Date(), 'Birth date cannot be in the future.')
    .optional(),
  universityOrWorkplace: text().optional(),
  preferredDistrict: z.enum([...DISTRICTS, '']).optional(),
  preferredCity: text().optional(),
  monthlyBudget: amount.optional(),
  preferredRoomType: z.enum([...ROOM_TYPES, '']).optional(),
  bio: text(2000).optional(),
  nic: z
    .string()
    .regex(/^(?:\d{9}[VvXx]|\d{12})?$/)
    .optional(),
  address: text(500).optional(),
});
export const property = z.strictObject({
  title: text(150).min(5),
  description: text(10000).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  district: z.enum(DISTRICTS).optional(),
  city: text(100).optional(),
  address: text(500).optional(),
  nearbyLandmark: text().optional(),
  nearbyUniversityOrWorkplace: text(500).optional(),
  latitude: z.number().min(5).max(10).optional(),
  longitude: z.number().min(79).max(82).optional(),
  publicLocationEnabled: z.boolean().optional(),
  roomType: z.enum(ROOM_TYPES).optional(),
  numberOfRooms: positive.optional(),
  maximumOccupants: positive.optional(),
  availableSpaces: z.number().int().min(0).max(10000).optional(),
  genderPreference: z.enum(GENDERS).optional(),
  monthlyRent: amount.optional(),
  securityDeposit: amount.optional(),
  utilityCharges: amount.optional(),
  advancePayment: amount.optional(),
  facilities: z
    .strictObject(Object.fromEntries(FACILITIES.map((k) => [k, z.boolean().optional()])))
    .optional(),
  houseRules: z
    .strictObject({
      smokingAllowed: z.boolean().optional(),
      petsAllowed: z.boolean().optional(),
      visitorsAllowed: z.boolean().optional(),
      curfew: text(50).optional(),
      otherRules: text(2000).optional(),
    })
    .optional(),
  isDraft: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const propertyPatch = property.partial();
export const listingStatus = z
  .strictObject({
    isActive: z.boolean().optional(),
    isDraft: z.boolean().optional(),
    availabilityStatus: z.enum(AVAILABILITY).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Choose a status.');
export const booking = z
  .strictObject({
    propertyId: id,
    moveInDate: z.iso
      .date()
      .refine(
        (v) => v >= new Date().toISOString().slice(0, 10),
        'Move-in date must be today or later.',
      ),
    numberOfOccupants: positive,
    stayDuration: z.enum(['1 month', '3 months', '6 months', '1 year', 'Long term', 'Custom']),
    customStayDuration: text(200).optional(),
    renterMessage: text(2000).optional(),
  })
  .refine((v) => v.stayDuration !== 'Custom' || v.customStayDuration?.length > 0, {
    path: ['customStayDuration'],
    message: 'Describe the stay duration.',
  });
export const bookingStatus = z.strictObject({
  status: z.enum(['Accepted', 'Rejected', 'Completed']),
  ownerResponse: text(2000).optional(),
});
export const conversation = z.strictObject({ propertyId: id, renterId: id.optional() });
export const message = z.strictObject({ conversationId: id, content: text(4000).min(1) });
export const review = z.strictObject({
  propertyId: id,
  bookingId: id,
  rating: z.number().int().min(1).max(5),
  reviewText: text(2000).min(5),
});
export const reviewPatch = review.pick({ rating: true, reviewText: true });
export const reply = z.strictObject({ reply: text(2000).min(1) });
