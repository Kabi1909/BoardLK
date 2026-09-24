import User from '../models/User.js';
import RenterProfile from '../models/RenterProfile.js';
import OwnerProfile from '../models/OwnerProfile.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Favorite from '../models/Favorite.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import PropertyView from '../models/PropertyView.js';
import { prepareProperty } from '../services/propertyService.js';
export const models = [
  User,
  RenterProfile,
  OwnerProfile,
  Property,
  Booking,
  Review,
  Favorite,
  Conversation,
  Message,
  Notification,
  PropertyView,
];
const places = [
  ['Vavuniya', 'Vavuniya', 8.7542, 80.4982, 'University of Vavuniya'],
  ['Colombo', 'Colombo', 6.9271, 79.8612, 'University of Colombo'],
  ['Kandy', 'Kandy', 7.2906, 80.6337, 'University of Peradeniya'],
  ['Jaffna', 'Jaffna', 9.6615, 80.0255, 'University of Jaffna'],
  ['Galle', 'Galle', 6.0535, 80.221, 'Galle Teaching Hospital'],
  ['Kurunegala', 'Kurunegala', 7.4863, 80.3647, 'Wayamba University'],
  ['Gampaha', 'Gampaha', 7.0873, 79.999, 'Gampaha General Hospital'],
  ['Colombo', 'Nugegoda', 6.8649, 79.8997, 'University of Sri Jayewardenepura'],
  ['Colombo', 'Maharagama', 6.848, 79.9265, 'National Institute of Education'],
  ['Colombo', 'Dehiwala', 6.8511, 79.8659, 'Dehiwala Railway Station'],
  ['Batticaloa', 'Batticaloa', 7.7102, 81.6924, 'Eastern University'],
];
export async function seedData({ reset = false, password = 'BoardLKDemo123!' } = {}) {
  if (await User.exists({})) {
    if (!reset) return { skipped: true };
    for (const Model of [...models].reverse()) await Model.deleteMany({});
  }
  await Promise.all(models.map((Model) => Model.init()));
  const owners = [],
    renters = [],
    properties = [],
    completed = [];
  const ownerNames = [
    'Nimal Perera',
    'Kavitha Rajan',
    'Saman Wijesinghe',
    'Farzana Rahim',
    'Tharushi Silva',
  ];
  const renterNames = [
    'Kavin Suresh',
    'Amaya Fernando',
    'Dilshan Jayasuriya',
    'Nethmi Bandara',
    'Shanika Perera',
    'Rizwan Hassan',
    'Pavithra Kumar',
    'Thilina De Silva',
    'Anjali Rajan',
    'Kasun Weerasinghe',
  ];
  for (let i = 0; i < 5; i++) {
    const user = await User.create({
      name: ownerNames[i],
      email: i ? 'owner' + (i + 1) + '@boardlk.test' : 'owner.demo@boardlk.test',
      phone: '07712345' + String(i).padStart(2, '0'),
      password,
      role: 'owner',
    });
    await OwnerProfile.create({ user: user._id, address: '12 Lake Road, Colombo' });
    owners.push(user);
  }
  for (let i = 0; i < 10; i++) {
    const user = await User.create({
      name: renterNames[i],
      email: i ? 'renter' + (i + 1) + '@boardlk.test' : 'renter.demo@boardlk.test',
      phone: '07112345' + String(i).padStart(2, '0'),
      password,
      role: 'renter',
    });
    await RenterProfile.create({
      user: user._id,
      preferredDistrict: places[i][0],
      preferredCity: places[i][1],
      monthlyBudget: 20000,
      preferredRoomType: 'Single',
    });
    renters.push(user);
  }
  for (let i = 0; i < 22; i++) {
    const [district, city, latitude, longitude, institution] = places[i % places.length];
    const image = (i % 6) + 1;
    const p = new Property({
      owner: owners[i % 5]._id,
      title:
        city +
        ' ' +
        ['Garden Rooms', 'Student Residence', 'Lakeview Boarding', 'Palm Court'][i % 4],
      description:
        'A welcoming, well maintained home with bright rooms, study space and convenient transport links. Ideal for students and working professionals seeking a comfortable monthly stay.',
      propertyType: i % 3 === 0 ? 'Boarding House' : 'Room',
      district,
      city,
      address: 10 + i + ' Temple Road, ' + city,
      nearbyLandmark: city + ' bus station',
      nearbyUniversityOrWorkplace: institution,
      latitude,
      longitude,
      roomType: i % 11 === 0 ? 'Single' : ['Single', 'Shared', 'Double'][i % 3],
      numberOfRooms: 4,
      maximumOccupants: 8,
      availableSpaces: 6,
      genderPreference: 'Any',
      monthlyRent: [18000, 25000, 12000, 18500, 35000][i % 5],
      securityDeposit: 10000,
      utilityCharges: 1500,
      advancePayment: 1,
      facilities: {
        wifi: true,
        attachedBathroom: i % 2 === 0,
        parking: true,
        kitchen: true,
        furnished: true,
        security: true,
        bed: true,
        studyTable: true,
      },
      houseRules: {
        smokingAllowed: false,
        petsAllowed: false,
        visitorsAllowed: true,
        curfew: '22:00',
        otherRules: 'Please respect quiet hours.',
      },
      images: [{ url: 'http://localhost:5173/images/boarding-' + image + '.jpg' }],
      coverImage: 'http://localhost:5173/images/boarding-' + image + '.jpg',
      isDraft: false,
      isActive: true,
    });
    prepareProperty(p);
    await p.save();
    properties.push(p);
  }
  for (let i = 0; i < 20; i++) {
    const p = properties[i],
      renter = renters[i % 10];
    const booking = await Booking.create({
      renter: renter._id,
      owner: p.owner,
      property: p._id,
      moveInDate: new Date('2026-01-01'),
      numberOfOccupants: 1,
      stayDuration: '3 months',
      status: 'Completed',
      active: false,
      history: [{ status: 'Completed', at: new Date() }],
    });
    completed.push(booking);
    const rating = 4 + (i % 2);
    await Review.create({
      renter: renter._id,
      owner: p.owner,
      property: p._id,
      booking: booking._id,
      rating,
      reviewText: 'Clean and comfortable rooms with easy access to transport and a helpful owner.',
    });
    await Property.updateOne(
      { _id: p._id },
      { $set: { averageRating: rating, reviewCount: 1 }, $inc: { bookingRequestCount: 1 } },
    );
  }
  for (let i = 0; i < 12; i++) {
    const p = properties[i],
      status = ['Pending', 'Accepted', 'Rejected', 'Cancelled'][i % 4],
      renter = renters[(i + 1) % 10];
    await Booking.create({
      renter: renter._id,
      owner: p.owner,
      property: p._id,
      moveInDate: new Date(Date.now() + 14 * 86400000),
      numberOfOccupants: 1,
      stayDuration: '6 months',
      renterMessage: 'I would like to arrange a visit before moving in.',
      status,
      active: ['Pending', 'Accepted'].includes(status),
      history: [{ status, at: new Date() }],
    });
    await Property.updateOne(
      { _id: p._id },
      {
        $inc: { bookingRequestCount: 1, ...(status === 'Accepted' ? { availableSpaces: -1 } : {}) },
      },
    );
  }
  for (let i = 0; i < 8; i++) {
    const p = properties[i],
      renter = renters[i],
      owner = owners[i % 5];
    const c = await Conversation.create({
      renter: renter._id,
      owner: owner._id,
      property: p._id,
      lastMessage: 'Yes, we can arrange a viewing this weekend.',
      lastMessageAt: new Date(),
    });
    await Message.create([
      {
        conversation: c._id,
        sender: renter._id,
        receiver: owner._id,
        content: 'Is the room still available?',
        readAt: new Date(),
      },
      { conversation: c._id, sender: owner._id, receiver: renter._id, content: c.lastMessage },
    ]);
  }
  for (let i = 0; i < 20; i++)
    await Notification.create({
      user: i % 2 ? owners[i % 5]._id : renters[i % 10]._id,
      type: 'welcome',
      title: 'Welcome to BoardLK',
      message: 'Your account is ready. Find your next home or manage your listings.',
      link: i % 2 ? '/owner/dashboard' : '/renter/dashboard',
    });
  for (let i = 0; i < 10; i++) {
    await Favorite.create({ renter: renters[i]._id, property: properties[i]._id });
    await RenterProfile.updateOne(
      { user: renters[i]._id },
      { $set: { recentlyViewed: [{ property: properties[i]._id, viewedAt: new Date() }] } },
    );
  }
  return {
    owners: 5,
    renters: 10,
    properties: 22,
    bookings: 32,
    reviews: 20,
    conversations: 8,
    messages: 16,
    notifications: 20,
    favorites: 10,
  };
}
