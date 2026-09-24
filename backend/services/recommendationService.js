import Property from '../models/Property.js';
import RenterProfile from '../models/RenterProfile.js';
import Favorite from '../models/Favorite.js';
import { PUBLIC_FILTER } from '../utils/constants.js';
import { serializeProperty, exactFields } from './propertyService.js';
export async function recommend(userId) {
  const profile = await RenterProfile.findOne({ user: userId }).lean();
  const favorites = await Favorite.find({ renter: userId })
    .populate('property', 'district roomType')
    .lean();
  const districts = new Set(favorites.map((x) => x.property?.district).filter(Boolean));
  const properties = await Property.find({
    ...PUBLIC_FILTER,
    availableSpaces: { $gt: 0 },
    availabilityStatus: { $ne: 'Temporarily Unavailable' },
  })
    .select(exactFields)
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(200);
  return properties
    .map((p) => {
      const reasons = [];
      let score = p.averageRating;
      if (p.district === profile?.preferredDistrict) {
        score += 4;
        reasons.push('Preferred district');
      }
      if (p.city === profile?.preferredCity) {
        score += 4;
        reasons.push('Preferred city');
      }
      if (profile?.monthlyBudget && p.monthlyRent <= profile.monthlyBudget) {
        score += 4;
        reasons.push('Within your budget');
      }
      if (p.roomType === profile?.preferredRoomType) {
        score += 3;
        reasons.push('Preferred room type');
      }
      if (districts.has(p.district)) {
        score += 2;
        reasons.push('Similar to saved places');
      }
      if (profile?.recentlyViewed?.some((x) => String(x.property) === String(p._id))) {
        score += 1;
        reasons.push('Recently viewed');
      }
      return {
        ...serializeProperty(p),
        recommendationScore: score,
        recommendationReasons: reasons,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 12);
}
