# Mobile — Authentication

## Purpose

Give drivers and store managers a fast, secure way to access the mobile app while respecting shared devices, unreliable connectivity, and role-controlled access.

## Mobile auth pattern

- A clean white screen, Waypoint Flow logo at top, small pale-green route accent, and one focused task per screen.
- Forms use full-width, 48 dp+ controls and place the primary green action above the keyboard/within the thumb zone when possible.
- Authentication needs a connection. If offline, clearly state: `Connect to the internet to sign in. Previously signed-in users can continue with available offline delivery records.`
- Never display customer order or route information until the authenticated session unlocks it.

## 1. Sign in

### Screen content

- `Welcome to Waypoint Flow` heading and short role-neutral support text.
- Email and password fields, show/hide password, and `Sign in` primary action.
- `Forgot password?` and `Activate account` text links.
- Optional Waypoint SSO button only where configured.

### Behaviour

- Support password-manager autofill and biometric quick-unlock only *after* an initial successful authenticated sign-in on this device.
- On a shared device, present `This is a shared device` guidance and avoid enabling biometric unlock by default.
- Generic authentication errors prevent account discovery. Preserve the entered email after a recoverable error.

## 2. Activate account / sign-up

Account setup begins from a secure invitation. The mobile flow is intentionally short:

1. **Invitation check:** masked work email, invitation validity, resend/request help.
2. **Create password:** requirements, confirmation, and show/hide toggles.
3. **Profile confirmation:** name and required contact number; role/outlet/depot are displayed but not editable.
4. **Ready:** `Account activated` with `Continue` to the correct role home.

There is no open public registration. This protects operational access and ensures every driver/store manager is linked to the correct Waypoint context.

## 3. Recover password

- `Forgot password?` collects work email and sends a reset link with neutral confirmation.
- The reset link opens the app when installed, otherwise a secure responsive web page; both use the same password requirements.
- Success returns to sign-in, with clear text if the previous session must be reauthenticated.

## Session and failure states

- **Session expired:** explain that the session expired, retain no sensitive content, and return to sign in. Locally queued delivery evidence follows the organization’s secure retention policy and must be restored/synced after reauthentication.
- **No connection:** do not pretend sign-in succeeded. Offer `Try again` once network returns.
- **Locked out:** show a clear retry time and recovery route, without exposing account details.
- **Biometrics unavailable/failed:** fall back to password without trapping the user in a device-specific error loop.

