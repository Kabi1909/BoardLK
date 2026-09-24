# Prepared 12-commit plan

No changes have been staged, committed or pushed. These commands are for you to run when ready. Use the repository root in PowerShell. Review each staged diff before committing. Do not use Commit All for the first group: that would combine the twelve groups into one commit.

Backend modules are introduced in dependency groups; the backend entry point and test suite are wired in group 9. The complete frontend integration is assembled across groups 10–12. Run the full checks after all groups.

## 1. chore(backend): initialize configuration validation and shared API utilities

```powershell
git add -- 'backend/.env.example' `
  'backend/.gitignore' `
  'backend/.prettierignore' `
  'backend/.prettierrc.json' `
  'backend/config/db.js' `
  'backend/config/env.js' `
  'backend/middleware/errorMiddleware.js' `
  'backend/middleware/notFoundMiddleware.js' `
  'backend/middleware/validationMiddleware.js' `
  'backend/package-lock.json' `
  'backend/package.json' `
  'backend/utils/ApiError.js' `
  'backend/utils/asyncHandler.js' `
  'backend/utils/constants.js' `
  'backend/utils/pagination.js' `
  'backend/utils/respond.js' `
  'backend/validators/schemas.js'
git diff --cached --stat
git diff --cached
git commit -m 'chore(backend): initialize configuration validation and shared API utilities'
```

## 2. feat(auth): add JWT authentication and private renter owner profiles

```powershell
git add -- 'backend/controllers/authController.js' `
  'backend/controllers/profileController.js' `
  'backend/middleware/authMiddleware.js' `
  'backend/middleware/roleMiddleware.js' `
  'backend/models/OwnerProfile.js' `
  'backend/models/RenterProfile.js' `
  'backend/models/User.js' `
  'backend/services/mailService.js' `
  'backend/utils/generateToken.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(auth): add JWT authentication and private renter owner profiles'
```

## 3. feat(properties): implement listings search privacy and view tracking

```powershell
git add -- 'backend/controllers/propertyController.js' `
  'backend/models/Property.js' `
  'backend/models/PropertyView.js' `
  'backend/services/propertyService.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(properties): implement listings search privacy and view tracking'
```

## 4. feat(media): add protected Cloudinary uploads and cleanup retries

```powershell
git add -- 'backend/config/cloudinary.js' `
  'backend/controllers/imageController.js' `
  'backend/middleware/uploadMiddleware.js' `
  'backend/services/cleanupService.js' `
  'backend/services/imageService.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(media): add protected Cloudinary uploads and cleanup retries'
```

## 5. feat(bookings): add favorites and transactional booking capacity

```powershell
git add -- 'backend/controllers/bookingController.js' `
  'backend/controllers/favoriteController.js' `
  'backend/models/Booking.js' `
  'backend/models/Favorite.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(bookings): add favorites and transactional booking capacity'
```

## 6. feat(messages): implement participant-scoped conversations and messages

```powershell
git add -- 'backend/controllers/messageController.js' `
  'backend/models/Conversation.js' `
  'backend/models/Message.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(messages): implement participant-scoped conversations and messages'
```

## 7. feat(reviews): enforce completed stays and recalculate property ratings

```powershell
git add -- 'backend/controllers/reviewController.js' `
  'backend/models/Review.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(reviews): enforce completed stays and recalculate property ratings'
```

## 8. feat(dashboards): add notifications recommendations and owner analytics

```powershell
git add -- 'backend/controllers/dashboardController.js' `
  'backend/controllers/notificationController.js' `
  'backend/models/Notification.js' `
  'backend/services/notificationService.js' `
  'backend/services/recommendationService.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(dashboards): add notifications recommendations and owner analytics'
```

## 9. test(backend): wire API routes add seed data and integration coverage

```powershell
git add -- 'backend/README.md' `
  'backend/app.js' `
  'backend/routes/index.js' `
  'backend/scripts/localDemo.js' `
  'backend/seeds/data.js' `
  'backend/seeds/seed.js' `
  'backend/server.js' `
  'backend/tests/api.test.js' `
  'backend/tests/startup.test.js'
git diff --cached --stat
git diff --cached
git commit -m 'test(backend): wire API routes add seed data and integration coverage'
```

## 10. feat(frontend): connect authentication and service state to the API

```powershell
git add -- 'frontend/src/components/common/ApiDataBoundary.jsx' `
  'frontend/src/services/adapters.js' `
  'frontend/src/services/dashboardService.js' `
  'frontend/src/services/propertyImageService.js' `
  'frontend/src/services/remoteActions.js' `
  'frontend/src/services/remoteStore.js' `
  'frontend/.env.example' `
  'frontend/src/context/AuthContext.jsx' `
  'frontend/src/context/NotificationContext.jsx' `
  'frontend/src/main.jsx' `
  'frontend/src/services/actions.js' `
  'frontend/src/services/api.js' `
  'frontend/src/services/authService.js' `
  'frontend/src/services/bookingService.js' `
  'frontend/src/services/favoriteService.js' `
  'frontend/src/services/listingActions.js' `
  'frontend/src/services/messageService.js' `
  'frontend/src/services/notificationService.js' `
  'frontend/src/services/propertyService.js' `
  'frontend/src/services/reviewService.js' `
  'frontend/src/services/store.js'
git diff --cached --stat
git diff --cached
git commit -m 'feat(frontend): connect authentication and service state to the API'
```

## 11. feat(frontend): connect marketplace and dashboard workflows

```powershell
git add -- 'frontend/src/assets/photography.js' `
  'frontend/src/components/property/CommunityReviews.jsx' `
  'frontend/src/hooks/usePropertySearch.js' `
  'frontend/src/assets/application.css' `
  'frontend/src/components/booking/BookingModal.jsx' `
  'frontend/src/components/booking/BookingsPage.jsx' `
  'frontend/src/components/forms/ProfilePage.jsx' `
  'frontend/src/components/messaging/MessagesPage.jsx' `
  'frontend/src/components/property/PropertyCard.jsx' `
  'frontend/src/components/property/Reviews.jsx' `
  'frontend/src/pages/owner/Dashboard.jsx' `
  'frontend/src/pages/owner/Properties.jsx' `
  'frontend/src/pages/owner/PropertyForm.jsx' `
  'frontend/src/pages/owner/Reviews.jsx' `
  'frontend/src/pages/public/AuthPage.jsx' `
  'frontend/src/pages/public/Home.jsx' `
  'frontend/src/pages/public/MapPage.jsx' `
  'frontend/src/pages/public/Properties.jsx' `
  'frontend/src/pages/public/PropertyDetails.jsx' `
  'frontend/src/pages/renter/Dashboard.jsx'
git diff --cached --stat
git diff --cached
git commit -m 'feat(frontend): connect marketplace and dashboard workflows'
```

## 12. refactor(frontend): remove mock data and document verified setup

```powershell
git add -- 'frontend/README.md' `
  'frontend/src/data/mockData.js' `
  'frontend/src/utils/search.test.js' `
  'frontend/src/utils/session.test.js' `
  'frontend/src/utils/workflows.test.js' `
  'docs/COMMIT_PLAN.md' `
  'docs/commit-plan.json' `
  'docs/VALIDATION.md'
git diff --cached --stat
git diff --cached
git commit -m 'refactor(frontend): remove mock data and document verified setup'
```

After creating all twelve commits, run `git status` and review `git log -12 --oneline`. Sync or push only when you choose. There is no push command in this plan.

