export const ROLES = ['renter', 'owner'];
export const DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];
export const PROPERTY_TYPES = [
  'Boarding House',
  'Annex',
  'Apartment',
  'Shared House',
  'Room',
  'Hostel',
];
export const ROOM_TYPES = ['Single', 'Shared', 'Double', 'Triple', 'Dormitory'];
export const GENDERS = ['Male Only', 'Female Only', 'Any'];
export const AVAILABILITY = [
  'Available',
  'Limited Availability',
  'Fully Occupied',
  'Temporarily Unavailable',
];
export const FACILITIES = [
  'wifi',
  'attachedBathroom',
  'sharedBathroom',
  'fan',
  'airConditioning',
  'furnished',
  'bed',
  'studyTable',
  'kitchen',
  'washingMachine',
  'parking',
  'cctv',
  'security',
  'drinkingWater',
  'hotWater',
  'electricityIncluded',
  'waterIncluded',
  'mealsAvailable',
];
export const BOOKING_STATUSES = ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'];
export const PUBLIC_USER_FIELDS = 'name role profileImage createdAt';
export const PUBLIC_FILTER = { isActive: true, isDraft: false, deletedAt: null };
export function availability(spaces, temporary = false) {
  return temporary
    ? 'Temporarily Unavailable'
    : spaces === 0
      ? 'Fully Occupied'
      : spaces === 1
        ? 'Limited Availability'
        : 'Available';
}
