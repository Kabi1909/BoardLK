export const idOf = (value) => value?._id || value?.id || value;
export const facilityNames = {
  wifi: 'Wi-Fi',
  attachedBathroom: 'Attached Bathroom',
  sharedBathroom: 'Shared Bathroom',
  fan: 'Fan',
  airConditioning: 'Air Conditioning',
  furnished: 'Furnished',
  bed: 'Bed',
  studyTable: 'Study Table',
  kitchen: 'Kitchen',
  washingMachine: 'Washing Machine',
  parking: 'Parking',
  cctv: 'CCTV',
  security: 'Security',
  drinkingWater: 'Drinking Water',
  hotWater: 'Hot Water',
  electricityIncluded: 'Electricity Included',
  waterIncluded: 'Water Included',
  mealsAvailable: 'Meals Available',
};
export function userFromApi(u) {
  return { ...u, id: idOf(u), photo: u.profileImage?.url, joined: u.createdAt };
}
export function profileFromApi(p) {
  return {
    ...userFromApi(p.user),
    ...p,
    id: idOf(p.user),
    dob: p.dateOfBirth?.slice(0, 10) || '',
    workplace: p.universityOrWorkplace || '',
    budget: p.monthlyBudget || '',
    roomType: p.preferredRoomType || '',
  };
}
export function propertyFromApi(p) {
  const images = (p.images || []).map((x) => x.url);
  if (p.coverImage && images.includes(p.coverImage))
    (images.splice(images.indexOf(p.coverImage), 1), images.unshift(p.coverImage));
  return {
    ...p,
    id: idOf(p),
    ownerId: idOf(p.owner),
    type: p.propertyType,
    lat: p.latitude,
    lng: p.longitude,
    landmark: p.nearbyLandmark,
    nearby: p.nearbyUniversityOrWorkplace,
    rooms: p.numberOfRooms,
    capacity: p.maximumOccupants,
    spaces: p.availableSpaces,
    gender: p.genderPreference,
    rent: p.monthlyRent,
    deposit: p.securityDeposit,
    utilities: p.utilityCharges,
    advance: p.advancePayment,
    facilities: Object.entries(p.facilities || {})
      .filter(([, v]) => v)
      .map(([k]) => facilityNames[k])
      .filter(Boolean),
    ...{
      smoking: p.houseRules?.smokingAllowed,
      pets: p.houseRules?.petsAllowed,
      visitors: p.houseRules?.visitorsAllowed,
      curfew: p.houseRules?.curfew || '',
      rules: p.houseRules?.otherRules || '',
    },
    images,
    imageRecords: p.images || [],
    status: p.isDraft ? 'Draft' : p.isActive ? 'Published' : 'Disabled',
    rating: p.averageRating || 0,
  };
}
export function propertyToApi(p) {
  const data = {
    title: p.title,
    description: p.description,
    propertyType: p.type,
    district: p.district,
    city: p.city,
    address: p.address,
    nearbyLandmark: p.landmark,
    nearbyUniversityOrWorkplace: p.nearby,
    roomType: p.roomType,
    genderPreference: p.gender,
    facilities: Object.fromEntries(
      Object.entries(facilityNames).map(([key, label]) => [key, p.facilities.includes(label)]),
    ),
    houseRules: {
      smokingAllowed: p.smoking,
      petsAllowed: p.pets,
      visitorsAllowed: p.visitors,
      curfew: p.curfew,
      otherRules: p.rules,
    },
    publicLocationEnabled: !!p.publicLocationEnabled,
  };
  for (const [from, to] of Object.entries({
    lat: 'latitude',
    lng: 'longitude',
    rooms: 'numberOfRooms',
    capacity: 'maximumOccupants',
    spaces: 'availableSpaces',
    rent: 'monthlyRent',
    deposit: 'securityDeposit',
    utilities: 'utilityCharges',
    advance: 'advancePayment',
  })) {
    if (
      p[from] !== '' &&
      p[from] !== undefined &&
      !(Number(p[from]) === 0 && ['lat', 'lng'].includes(from))
    )
      data[to] = Number(p[from]);
  }
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ''));
}
export const bookingFromApi = (b) => ({
  ...b,
  id: idOf(b),
  propertyId: idOf(b.property),
  ownerId: idOf(b.owner),
  renterId: idOf(b.renter),
  moveIn: b.moveInDate?.slice(0, 10),
  occupants: b.numberOfOccupants,
  duration: b.stayDuration === 'Custom' ? b.customStayDuration : b.stayDuration,
  message: b.renterMessage,
  response: b.ownerResponse,
});
export const reviewFromApi = (r) => ({
  ...r,
  id: idOf(r),
  propertyId: idOf(r.property),
  renterId: idOf(r.renter),
  bookingId: idOf(r.booking),
  comment: r.reviewText,
  reply: r.ownerReply?.text || '',
});
export const notificationFromApi = (n) => ({
  ...n,
  id: idOf(n),
  userId: idOf(n.user),
  body: n.message,
  path: n.link,
  read: n.isRead,
});
export const messageFromApi = (m) => ({
  ...m,
  id: idOf(m),
  senderId: idOf(m.sender),
  text: m.content,
});
