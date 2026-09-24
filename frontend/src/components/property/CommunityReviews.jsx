import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Avatar, RatingStars } from '../common/UI';
import { userFromApi } from '../../services/adapters';
export default function CommunityReviews() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    let active = true;
    api
      .get('/reviews/recent')
      .then(({ data }) => {
        if (active) setReviews(data.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!reviews.length) return null;
  return (
    <section className="section muted-bg">
      <div className="container">
        <div className="center-heading">
          <span className="eyebrow">STORIES FROM OUR COMMUNITY</span>
          <h2>A little space. A big difference.</h2>
          <p>Reviews from renters who completed a stay.</p>
        </div>
        <div className="grid-3">
          {reviews.map((review) => (
            <article className="testimonial panel" key={review._id}>
              <RatingStars rating={review.rating} />
              <p>“{review.reviewText}”</p>
              <div className="person">
                <Avatar user={userFromApi(review.renter)} />
                <div>
                  <strong>{review.renter.name}</strong>
                  <small>{review.property.city}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
