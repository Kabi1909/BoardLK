# Messaging fix verification — 2026-09-27

The owner and renter inbox now keeps its message composer inside the dashboard viewport. Only the message history scrolls. The Send button has a visible label, rejects blank submissions and disables while a request is pending. Desktop entry selects an available conversation; mobile entry keeps the conversation list and provides a Back button inside the chat.

View property opens the listing in a separate tab, preserving the conversation. Session-only sign-in is scoped to a browser tab: a new tab may display the public property preview until the user signs in. An authenticated owner viewing their own listing sees Edit property, booking requests and Back to messages instead of renter booking/contact actions. Advance payments display as currency.

Confirmed deliveries appear immediately, without waiting for unrelated dashboard requests. Background refresh failures retain the loaded interface and offer Retry updates. Read-state updates are guarded against account changes and newer incoming messages. Conversation-specific drafts remain in component memory and are cleared only when the matching submitted text is successfully sent; they are not stored permanently.

## Verification

- Frontend unit tests: 13 passed, including delivery deduplication and draft isolation.
- Backend integration tests: 31 passed, including both-direction messaging, membership enforcement and read state.
- Production frontend build: passed.
- Formatting check for changed frontend files: passed.
- Browser checks used a disposable MongoDB replica set, API port 5098 and frontend port 5182. No messages were sent to the user's existing database.
- Owner message submission succeeded; changing conversations preserved a draft and kept other drafts separate.
- Renter message submission succeeded with Enter; the composer and Send button were visible at 390 × 844 and at desktop size.
- Mobile Back returned to the conversation list.
- The property link opened another tab, leaving the original conversation URL intact.
- An authenticated owner saw Edit property with no Request booking or Contact owner buttons on their own listing.
- No browser console errors appeared in the renter messaging check.

## Ten focused commits

1. Keep the chat composer within the dashboard viewport.
2. Clarify send controls and preserve chat when viewing properties.
3. Show owner property actions and correct advance payment currency.
4. Identify selected conversations and accurate unread indicators.
5. Display confirmed messages before refreshing dashboard data.
6. Preserve separate conversation drafts.
7. Wait for property details and support retry.
8. Preserve loaded chats during refresh errors and guard read updates.
9. Add delivery and draft regression tests.
10. Document messaging behavior and verification.

After updating the source, refresh the browser. During development, Vite normally applies these changes automatically. Production hosting needs the newly built frontend assets deployed.
