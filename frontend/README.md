# Eventora — SWC3633 Individual Frontend

A rose-pink, modern-sidebar frontend for the Event Ticketing and Venue Booking System. Includes Admin, Organiser and Customer views.

## Files
- `index.html` — login screen and app shell
- `styles.css` — responsive rose-pink interface
- `app.js` — navigation, sample preview data, forms and API request layer

## Run in XAMPP
1. Copy this folder into the PHP project's root, naming it `frontend`.
2. Keep the backend `api`, `config`, and `vendor` folders in their existing locations.
3. Start Apache in XAMPP.
4. Open `http://localhost/<project-folder>/frontend/` in a browser.

## Preview mode
Use the three preview buttons on the login page. Preview mode uses illustrative sample records and temporary in-memory changes. It does **not** authenticate against the backend or persist changes in MySQL. Do not present preview records as actual database results.

## Live API mode
The JavaScript uses `API_BASE = "../api"` and expects the supplied API endpoints:
- `login.php`
- `users.php`
- `events.php`
- `venues.php`
- `schedules.php`
- `bookings.php`

Login posts JSON `{ "email": "...", "password": "..." }` and expects an `access_token` and `user` object. The token is sent as `Authorization: Bearer <token>` for subsequent requests.

Important integration notes:
- The database `event_ticketing_db` has not yet been imported/created in the user's setup. Live login and data operations will therefore fail until the database and tables exist.
- The provided `users.php`, `events.php`, `venues.php`, `schedules.php`, and `bookings.php` should be tested against the actual API. Payload requirements and response shapes may differ; adjust `app.js` only after checking actual API responses.
- The `users.php` API may require a password on account creation. The frontend deliberately refuses a live create request without one.
- Booking creation sends `schedule_id` and `quantity`, matching the typical booking request flow, but verify the exact request fields in `bookings.php`.
- Role-based visibility in the frontend improves navigation, but backend JWT/RBAC remains the actual security boundary.
- The `weather.php` endpoint is not currently displayed in this UI.
- Do not store JWTs in long-lived production localStorage; use a secure architecture appropriate for production. localStorage is used here for a coursework prototype.

## Suggested screenshots for Section 6.4
1. Login screen.
2. Admin overview, Manage Users, Manage Events and Manage Venues.
3. Organiser overview, My Events and Ticket Schedules.
4. Customer Discover Events, Book Tickets modal and My Bookings.
5. Browser DevTools Network tab showing real API requests and responses after the database is configured.
6. Validation tests: empty login fields, invalid credentials, invalid ticket quantities, and API error handling.

Only describe actions as successful in the report after verifying the result. Preview-mode screenshots demonstrate UI layout only, not backend integration.
