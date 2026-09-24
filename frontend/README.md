# BoardLK frontend

React/Vite interface for Sri Lankan boarding discovery. The UI connects to the BoardLK Express/MongoDB API and supports only renter and owner accounts.

## Run

```sh
npm install
npm run dev
```

Start the backend first; see ../backend/README.md. Copy .env.example to .env if the API is not at http://localhost:5000/api. The sole frontend setting is VITE_API_URL. Never put backend secrets in frontend variables.

The frontend contains no mock accounts, domain records, simulated authentication or mock-mode switch. Property listings, favorites, bookings, conversations, reviews, notifications and dashboards come from the backend. Backend demo seeds are optional.

## Structure

- components/: shared UI, property cards, forms, booking, messaging and maps
- pages/: public, renter and owner screens
- context/: authentication, favorites, notifications
- services/: Axios endpoints, API field adapters, response cache and mutations
- hooks/: store subscription and cancellable server-side property searches
- data/locations.js: Sri Lankan geographic/form options, not business records
- assets/: styles and static editorial photography references

Routes include /, /properties, /properties/:id, /map, /login, /register, /forgot-password, /reset-password, /unauthorized; /renter/{dashboard,profile,favorites,bookings,messages,notifications}; /owner/{dashboard,profile,properties,bookings,messages,reviews,notifications}; /owner/properties/new and /owner/properties/:id/edit.

The existing responsive React Router, Tailwind/CSS, Lucide, Recharts and Leaflet UI is retained. Authentication tokens use localStorage with Remember Me and sessionStorage otherwise. Domain records are held only in an in-memory API response cache. Failed API calls show errors instead of substituting fictional records.

## Verify

```sh
npm test
npm run build
```

Unit tests cover API field translation, forbidden write-field omission, validation, geography and session persistence. Backend tests cover the authoritative workflows and authorization.

Property photos upload via multipart requests to the backend/Cloudinary. Browser previews are temporary. Chat refreshes after sends and on a 30-second refresh interval; there is no simulated reply. Reviews require completed bookings. Owner dashboard charts use real recorded totals.
