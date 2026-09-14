import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Search,
  MessageCircle,
  KeyRound,
  Wallet,
  Heart,
  Star,
  Check,
  Compass,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { photos } from '../../data/mockData';
import SearchBar from '../../components/property/SearchBar';
import { PropertyGrid } from '../../components/property/PropertyCard';
import { Avatar } from '../../components/common/UI';
const locationPhotos = [
  'https://images.unsplash.com/photo-1588258219511-64eb629cb833?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=500&q=80',
  ...photos,
];
export default function Home() {
  const { properties } = useStore();
  const published = properties.filter((p) => p.status === 'Published');
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-pill">
              <span /> A LITTLE CLOSER TO HOME
            </span>
            <h1>
              Find Your Perfect
              <br />
              Boarding Place
              <br />
              in <em>Sri Lanka.</em>
            </h1>
            <p>
              Discover affordable and convenient boarding houses, rooms and shared accommodation
              near your university or workplace.
            </p>
            <div className="hero-proof">
              <div className="avatar-stack">
                {['Kavindu', 'Amaya', 'Arun', 'Nethmi'].map((name) => (
                  <Avatar key={name} user={{ name }} />
                ))}
              </div>
              <div>
                <div className="five-stars">★★★★★</div>
                <small>A new place. A fresh start. A better everyday.</small>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={photos[0]}
              alt="Bright sunlit apartment with comfortable seating and green plants"
              fetchpriority="high"
            />
            <div className="hero-photo-label">
              <span>
                <MapPin size={13} /> Colombo, Sri Lanka
              </span>
              <span>YOUR NEXT CHAPTER STARTS HERE</span>
            </div>
            <div className="floating-card">
              <span className="floating-icon">
                <ShieldCheck size={24} />
              </span>
              <div>
                <strong>A place that feels right.</strong>
                <p>Find comfort. Find your community.</p>
              </div>
              <span className="tiny-check">
                <Check size={12} />
              </span>
            </div>
            <div className="hero-tag">
              <Heart size={15} /> More than a room. A home.
            </div>
          </div>
        </div>
        <div className="container hero-search">
          <SearchBar />
          <div className="popular-search">
            <span>Popular searches:</span>
            {['Colombo', 'Kandy', 'Vavuniya', 'Jaffna'].map((c) => (
              <Link key={c} to={'/properties?q=' + c}>
                {c}
              </Link>
            ))}
            <span className="search-note">
              <ShieldCheck size={13} /> Explore. Connect. Move in.
            </span>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          <span>
            <Compass size={17} />
            Find your place, at your pace
          </span>
          <span>
            <Wallet size={17} />
            Options for every budget
          </span>
          <span>
            <MessageCircle size={17} />
            Connect directly with owners
          </span>
          <span>
            <MapPin size={17} />
            Across Sri Lanka
          </span>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A PLACE FOR EVERY CHAPTER</span>
              <h2>Where would you like to live?</h2>
              <p>From vibrant cities to quieter corners, explore your next neighbourhood.</p>
            </div>
            <Link className="text-link" to="/map">
              Explore locations <ArrowRight size={15} />
            </Link>
          </div>
          <div className="locations-grid">
            {['Colombo', 'Kandy', 'Vavuniya', 'Jaffna', 'Galle', 'Kurunegala', 'Batticaloa'].map(
              (city, i) => (
                <Link className="location-card" to={'/properties?q=' + city} key={city}>
                  <img
                    src={locationPhotos[i]}
                    alt={city + ' accommodation inspiration'}
                    loading="lazy"
                  />
                  <div>
                    <h3>{city}</h3>
                    <p>{published.filter((p) => p.city === city).length} places to stay</p>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="section muted-bg">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HANDPICKED FOR YOUR NEXT MOVE</span>
              <h2>A great place to start</h2>
              <p>Discover comfortable spaces in well-connected neighbourhoods.</p>
            </div>
            <Link className="text-link" to="/properties">
              View all properties <ArrowRight size={15} />
            </Link>
          </div>
          <PropertyGrid properties={published.slice(0, 6)} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FRESH SPACES, NEW POSSIBILITIES</span>
              <h2>Just added to BoardLK</h2>
              <p>Be among the first to find your new favourite place.</p>
            </div>
            <Link className="text-link" to="/properties?sort=latest">
              See latest listings <ArrowRight size={15} />
            </Link>
          </div>
          <PropertyGrid
            properties={[...published]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3)}
          />
        </div>
      </section>
      <section className="section how-section">
        <div className="container">
          <div className="center-heading">
            <span className="eyebrow">LESS SEARCHING. MORE LIVING.</span>
            <h2>Your next home, in three simple steps</h2>
            <p>We make finding your boarding place a little easier.</p>
          </div>
          <div className="grid-3 steps">
            {[
              [
                Search,
                '01',
                'Find your fit',
                'Search by location, budget and the things that matter to you.',
              ],
              [
                MessageCircle,
                '02',
                'Connect with the owner',
                'Ask questions, request a booking and arrange a visit.',
              ],
              [
                KeyRound,
                '03',
                'Make yourself at home',
                'Agree on the details with your owner and start your next chapter.',
              ],
            ].map(([Icon, n, title, desc]) => (
              <div key={n}>
                <span className="step-icon">
                  <Icon size={25} />
                  <small>{n}</small>
                </span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container why-grid">
          <div className="why-photo">
            <img
              src={photos[1]}
              alt="A spacious and thoughtfully designed kitchen and living area"
              loading="lazy"
            />
            <div>
              <Heart size={22} />
              <strong>
                Good spaces.
                <br />
                Better everyday living.
              </strong>
            </div>
          </div>
          <div>
            <span className="eyebrow">BUILT AROUND YOU</span>
            <h2>
              A better way to
              <br />
              find your place.
            </h2>
            <p>Moving is a big step. Finding a place shouldn’t have to be.</p>
            {[
              [
                Wallet,
                'A budget that works for you',
                'Compare monthly rent and costs with transparent property details.',
              ],
              [
                MapPin,
                'Close to what matters',
                'Find a home near your university, workplace or favourite neighbourhood.',
              ],
              [
                MessageCircle,
                'Real conversations, directly',
                'Get to know your owner and ask your questions in one place.',
              ],
            ].map(([Icon, title, desc]) => (
              <div className="why-item" key={title}>
                <span>
                  <Icon size={19} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section muted-bg">
        <div className="container">
          <div className="center-heading">
            <span className="eyebrow">STORIES FROM OUR COMMUNITY</span>
            <h2>A little space. A big difference.</h2>
            <p>Illustrative stories from our demo community.</p>
          </div>
          <div className="grid-3">
            {[
              [
                'Nethmi Perera',
                'Student · Colombo',
                'Finding a room close to campus was so much easier. I could compare the rent and message the owner before deciding.',
              ],
              [
                'Arun Thiruchelvam',
                'Student · Vavuniya',
                'The location filters helped me find a quiet room near university that actually fit my budget.',
              ],
              [
                'Dilani Fernando',
                'Boarding owner · Galle',
                'Keeping property details and booking requests in one place makes it easier to connect with prospective renters.',
              ],
            ].map(([name, role, quote]) => (
              <article className="testimonial panel" key={name}>
                <div className="five-stars">★★★★★</div>
                <p>“{quote}”</p>
                <div className="person">
                  <Avatar user={{ name }} />
                  <div>
                    <strong>{name}</strong>
                    <small>{role}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">HAVE A SPACE TO SHARE?</span>
              <h2>Your property. Someone’s next home.</h2>
              <p>Connect with students and working professionals looking for a place like yours.</p>
            </div>
            <Link className="btn" to="/register?role=owner">
              List your property <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

