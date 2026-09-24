# BoardLK API

BoardLK is a Sri Lankan boarding marketplace backed by Express and MongoDB.

BoardLK has two roles only:

- renter
- owner

## Run locally

Requires Node.js 22+ and npm. For persistent data, use MongoDB Atlas or a local MongoDB **replica set**: transactions protect booking capacity, reviews, notifications and registration. A standalone MongoDB instance is insufficient.

```sh
cd backend
npm install
cp .env.example .env
# Configure MONGO_URI and a random JWT_SECRET of at least 32 characters.
npm run seed
npm run dev
```

On PowerShell use `Copy-Item .env.example .env`. Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and keep it only in your ignored .env.

The seed command requires a database name ending in `_demo`, refuses production mode, and skips a nonempty database. `npm run seed -- --reset` explicitly replaces demo records.

For a disposable local database without installing MongoDB:

```sh
npm run dev:local
```

This downloads an official MongoDB binary on first use, starts a single-node replica set, seeds it and serves port 5000. Data and generated sessions disappear when it stops. This command is for development only.

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend is API-only. It has no mock data fallback. Its only environment variable is `VITE_API_URL=http://localhost:5000/api`.

## Environment

See .env.example. Never put these backend settings in Vite variables.

| Variable                                     | Purpose                                            |
| -------------------------------------------- | -------------------------------------------------- |
| PORT                                         | HTTP port; defaults to 5000                        |
| NODE_ENV                                     | development, test or production                    |
| MONGO_URI                                    | MongoDB connection string with replica-set support |
| JWT_SECRET                                   | Private random signing secret, 32+ characters      |
| JWT_EXPIRES_IN                               | JWT duration; default 7d                           |
| BCRYPT_SALT_ROUNDS                           | Password hashing cost; default 12                  |
| RESET_TOKEN_EXPIRES_MINUTES                  | Reset link lifetime; default 30                    |
| FRONTEND_URL                                 | Comma-separated exact allowed frontend origins     |
| TRUST_PROXY                                  | Trusted reverse-proxy hop count; default 0         |
| CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET | Server-only Cloudinary configuration               |
| SMTP_HOST / PORT / USER / PASS / FROM        | Password-reset email transport                     |
| SEED_PASSWORD                                | Development seed account password                  |

Configure a Cloudinary product environment and set its three server credentials. Uploads accept JPEG, PNG and WebP; MIME and signatures are checked, with 5 MB per image and eight property images maximum. Images are sent through Multer memory storage to Cloudinary; MongoDB stores URL and publicId. A published property keeps at least one image. Deleted image IDs are retained in a cleanup queue and retried every minute.

SMTP uses port 587 by default, or TLS on port 465. Forgot-password responses do not disclose account existence or return reset tokens. If SMTP is unconfigured the endpoint returns 503 for every address. Tokens are random, hashed in MongoDB, expiring and single-use. Password changes and resets invalidate older JWTs.

## Architecture

```text
backend/
  app.js                 Express application factory
  server.js              Database startup and graceful shutdown
  config/                Environment, MongoDB, Cloudinary
  models/                Mongoose schemas and indexes
  validators/            Strict request schemas
  middleware/            Authentication, roles, validation, uploads, errors
  routes/                Endpoint composition
  controllers/           HTTP workflows
  services/              Property privacy, mail, uploads, cleanup, recommendations
  utils/                 Responses, tokens, constants, pagination
  seeds/                 Guarded development seed command
  scripts/               Disposable local database launcher
  tests/                 Real MongoDB integration and startup tests
```

Stack: Node.js, Express 5, Mongoose, MongoDB, bcrypt, JWT, Zod, Multer, Cloudinary, Nodemailer, Helmet, CORS, express-rate-limit, Morgan, Supertest and Node's test runner.

All successful API responses use `{success:true,message,data}`. Lists also include `pagination:{page,limit,totalItems,totalPages,hasNextPage,hasPreviousPage}`. Failures use `{success:false,message,errors:[{field,message}]}`. Page sizes are bounded to 100. Object IDs and all write fields are validated; server-owned fields cannot be supplied by clients.

## Authentication and profiles

Send `Authorization: Bearer <token>`. The server verifies the signature, expiry, issuer, audience, account status and token version. The frontend preserves Remember Me storage behavior. Logout revokes all sessions for that user.

| Method    | Endpoint (prefix /api)                        | Access                                                 |
| --------- | --------------------------------------------- | ------------------------------------------------------ |
| POST      | /auth/register                                | Public; name,email,phone,password,confirmPassword,role |
| POST      | /auth/login                                   | Public; email,password                                 |
| GET       | /auth/me                                      | Authenticated                                          |
| POST      | /auth/logout                                  | Authenticated                                          |
| PUT       | /auth/change-password                         | currentPassword,newPassword,confirmPassword            |
| POST      | /auth/forgot-password                         | email                                                  |
| POST      | /auth/reset-password/:token                   | password,confirmPassword                               |
| GET / PUT | /renter/profile                               | Current renter                                         |
| GET / PUT | /owner/profile                                | Current owner                                          |
| POST      | /renter/profile/photo or /owner/profile/photo | Multipart image                                        |

Passwords, reset hashes, token versions and identification details are never public. Owners see their identification/address only in their own profile response.

## Properties, search and favorites

| Method        | Endpoint                        | Access                                       |
| ------------- | ------------------------------- | -------------------------------------------- |
| GET           | /properties                     | Public, filtered and paginated               |
| GET           | /properties/map                 | Same filters; coordinate-ready records       |
| GET           | /properties/:id                 | Public published listing; own drafts allowed |
| GET           | /properties/:id/similar         | Public                                       |
| GET           | /owner/properties               | Current owner's listings                     |
| POST          | /properties                     | Owner creates a draft                        |
| PUT / DELETE  | /properties/:id                 | Owning owner only                            |
| PATCH         | /properties/:id/status          | isActive, isDraft, availabilityStatus        |
| POST          | /properties/:id/images          | Multipart images                             |
| PATCH         | /properties/:id/cover           | imageId                                      |
| DELETE        | /properties/:id/images/:imageId | Owning owner only                            |
| GET           | /favorites                      | Current renter                               |
| POST / DELETE | /favorites/:propertyId          | Current renter                               |
| GET           | /renter/recently-viewed         | Last 20 distinct public listings             |

Publish by setting isDraft=false after filling details and uploading images. Drafts and disabled/deleted listings are excluded publicly. Exact address and coordinates are hidden unless publicLocationEnabled=true; approximate coordinates are rounded to two decimal places. Owners always receive their own exact location.

Search query fields: search, district, city, propertyType, roomType, genderPreference, minRent, maxRent, minRating, availableNow. Facility booleans include wifi, attachedBathroom, sharedBathroom, fan, airConditioning, furnished, bed, studyTable, kitchen, washingMachine, parking, cctv, security, drinkingWater, hotWater, electricityIncluded, waterIncluded, mealsAvailable. Use literal true/false. Sort: price_asc, price_desc, rating, latest, popular. Example:

```text
GET /api/properties?search=Vavuniya&maxRent=20000&roomType=Single&wifi=true&page=1&limit=9
```

## Booking workflow

POST /bookings accepts propertyId, moveInDate (YYYY-MM-DD), numberOfOccupants, stayDuration, optional customStayDuration and renterMessage. Duration is 1 month, 3 months, 6 months, 1 year, Long term or Custom.

- GET /bookings/my, GET /bookings/:id: renter's own records.
- GET /owner/bookings and /owner/bookings/:id: owner's own records.
- PATCH /bookings/:id/cancel: renter may cancel Pending only.
- PATCH /bookings/:id/status: owner supplies status and optional ownerResponse.

Pending does not reserve spaces. Accepted atomically reserves the requested number. Concurrent acceptances cannot make availability negative. Accepted transitions to Completed, which releases its reserved spaces, capped at maximum capacity. Pending can become Rejected or Cancelled. Terminal states cannot be changed. A unique partial index prevents duplicate active requests for the same renter/property. Owners cannot edit capacity in a way that excludes active reservations. Listings with Accepted bookings cannot be deleted.

## Messaging, reviews and notifications

POST /conversations uses propertyId. Renters contact the listing owner; owners can supply renterId only when a matching booking exists. GET /conversations, GET /conversations/:id, PATCH /conversations/:id/read are participant-only.

GET /messages/:conversationId is paginated. POST /messages accepts conversationId and content. The server derives the receiver. PATCH /messages/:id/read is recipient-only. The frontend refreshes every 30 seconds and immediately after its own mutations. REST services provide a boundary for future Socket.IO delivery.

Reviews require a Completed booking owned by the author. POST /reviews accepts propertyId, bookingId, rating (integer 1–5), reviewText. PUT /reviews/:id edits your review; DELETE removes it. GET /reviews/property/:propertyId is public; GET /reviews/recent provides public homepage reviews. GET /owner/reviews lists the owner's reviews; POST /reviews/:id/reply accepts reply from the owning owner. Rating totals are recalculated transactionally.

GET /notifications returns the current user's list and unreadCount. PATCH /notifications/:id/read and /notifications/read-all mark only that user's records. Booking requests, status changes, incoming messages, reviews and unavailable saved properties generate notifications.

## Dashboards and recommendations

GET /renter/dashboard and /owner/dashboard use only the current user's records. Owner charts use recorded monthly views and booking creation dates. Views are deduplicated per signed-in user or hashed IP per UTC day. IP addresses are not stored in view records.

GET /recommendations ranks up to 200 available candidates using preferred district, city, budget, room type, saved districts, recently viewed listings and ratings. This is a deterministic rule-based system, not an AI prediction.

## Demo data

Seeds live exclusively in the backend: 22 properties, 5 owners, 10 renters, 32 bookings, 20 completed-stay reviews, 8 conversations, 16 messages, 20 notifications and 10 favorites. Names are fictional. Demo image URLs point to photographs served by the existing frontend on port 5173; they are not Cloudinary uploads.

Default local-only accounts:

| Role   | Email                    | Password        |
| ------ | ------------------------ | --------------- |
| renter | renter.demo@boardlk.test | BoardLKDemo123! |
| owner  | owner.demo@boardlk.test  | BoardLKDemo123! |

Never run demo seeds against production. New real accounts use bcrypt; no shared password is built into authentication.

## Tests and integration

```sh
npm test
npm run format:check
```

Tests start real temporary MongoDB replica sets and exercise Supertest/HTTP workflows, including concurrent acceptances, cross-user access, reset reuse, upload limits and provider failure handling. The test upload/mail adapters replace external providers only; MongoDB is real. Live Cloudinary upload and SMTP delivery need configured credentials and are not claimed by these tests.

Frontend adapters map _id→id, monthlyRent→rent, availableSpaces→spaces, facilities objects→labels, and other API fields while keeping the UI. All mutations use Axios. UI search/sort/pagination use server query parameters. Only authentication is persisted in browser storage; domain data is cached in memory from API responses.

Production deployment still needs a persistent replica set, private secrets, HTTPS, a correct CORS origin/proxy configuration, configured image/email providers, backups and operational monitoring. The local launcher is not a production deployment.
