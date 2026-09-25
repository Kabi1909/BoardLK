# BoardLK verification record

Verified locally on 2026-09-25 after the backend completion pass.

| Check                            | Result                                                                     |
| -------------------------------- | -------------------------------------------------------------------------- |
| Backend `npm test`               | 31 tests passed, 0 failed                                                  |
| Frontend `npm test`              | 10 tests passed, 0 failed                                                  |
| Frontend `npm run build`         | Passed                                                                     |
| Backend `npm run format:check`   | Passed                                                                     |
| Frontend `npm start`             | Vite started; HTTP request returned 200                                    |
| Backend `npm run setup`, twice   | Secret generated initially; existing secret preserved on second invocation |
| Git exclusion for backend `.env` | Confirmed ignored                                                          |

Backend tests use real temporary MongoDB replica sets. They cover authentication, token expiry and revocation, renter/owner authorization, private profile/location data, listing creation/publication/uploads, filtering, favorites, concurrent booking acceptance, cancellation, completion, messages and read state, reviews and replies, notifications, dashboards, and single-use password reset. A separate test starts the seed CLI and development server and checks login over HTTP.

Added regression coverage checks concurrent profile photo replacement, notification filtering, deleted-property favorites, readiness/liveness, numeric query validation, model capacity/image/rating constraints, deployment configuration, and Sri Lankan midnight/year boundaries.

The frontend startup smoke check suppresses launching a browser during automation. Automatic opening is configured using Vite's `server.open`; the selected browser follows the user's operating-system default.

## External configuration

The normal backend requires a configured persistent MongoDB replica set or Atlas connection. The optional `npm run dev:local` command uses a disposable database and backend demo seeds. Frontend domain data always comes from the API.

Cloudinary and SMTP are replaced with controlled adapters in integration tests. Live uploads and actual email delivery have not been tested with user credentials. Configure these services in the ignored backend `.env` before using those features against real accounts. The generated JWT signing secret is local only, is never printed, and is not committed.

This verification covers application behavior locally. It does not assert that a production deployment, backups, DNS or external-provider accounts have been configured.

## Git delivery

Fourteen focused local commits are listed in `COMMIT_PLAN.md` and `commit-plan.json`, following the existing `21ee6c7` baseline. The previous commit is preserved. No changes are pushed as part of this work.
