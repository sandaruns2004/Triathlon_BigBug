# Desktop — Authentication

## Purpose

Provide a calm, trusted entry point for every Waypoint Flow user without slowing time-critical operations. Accounts are provisioned by Waypoint administration; sign-up means activating an invited account, not creating an unrestricted public account.

## Shared auth layout

- White page with a restrained pale-green side panel on wide screens. The panel carries the Waypoint Flow mark, a short promise—“Connected delivery operations”—and a subtle network/route motif.
- A centred white form card, maximum 440 px wide, has a clear page title, helpful one-line explanation, labelled fields, and a full-width green primary button.
- Use the same support link and language selector/accessible help location on every auth screen.
- Keep the page visually quiet: no dashboard navigation, alerts, or operational data before authentication.

## 1. Sign in

### Content

- Heading: `Welcome back`.
- Work email field; password field with show/hide control.
- `Keep me signed in on this trusted device` checkbox, off by default on shared loader terminals.
- Primary action: `Sign in`.
- Secondary links: `Forgot password?` and `Activate your account`.
- SSO button appears only when Waypoint enables it: `Continue with Waypoint SSO`.

### Behaviour

- Validate email format inline after the field is left; do not reveal whether an email exists until the secure flow requires it.
- Generic failed sign-in message: “We couldn’t sign you in. Check your details or reset your password.” Avoid account-enumeration hints.
- After repeated failed attempts, apply a short lockout with an exact retry time and password-recovery path.
- On success, route users by assigned role and context: dispatchers to Operations Overview, loaders to Load Board, drivers to the mobile app flow, and store managers to their outlet home.

## 2. Account activation / sign-up

### Entry condition

Users arrive from a secure invitation emailed by a Waypoint administrator. The page displays a masked email and assigned organization/outlet/depot where appropriate; it never permits self-selection of a privileged role.

### Steps

1. **Verify invitation:** invitation state, masked email, and `Send a new link` if expired.
2. **Set password:** password, confirm password, requirements shown before typing, and show/hide controls.
3. **Confirm profile:** full name, mobile number where required for driver contact, and acknowledgement of operational-use policy.
4. **Success:** `Your account is ready` and `Continue to Waypoint Flow`.

### Guardrails

- Invitation links expire and can be used once. Expired links have a clear resend/request-access path.
- Role, outlet, and depot are read-only here; changes require an administrator.
- Do not use a misleading generic “Sign up” call-to-action that suggests external visitors can access the distribution system.

## 3. Forgot and reset password

- **Forgot password:** one email field and `Send reset link`. Completion text remains generic: “If this address is registered, we’ve sent reset instructions.”
- **Reset password:** secure link validation, new password/confirmation, and a strength/requirement checklist.
- **Completed:** explain that other active sessions may be signed out according to organization policy, then return to sign in.

## Accessibility and states

- Every field has a persistent visible label; error text appears beside the field and is announced to screen readers.
- Support keyboard-only completion, password managers, and a visible focus state in green with sufficient contrast.
- Loading buttons retain their label with an inline spinner; network failure preserves entered non-password fields and provides `Try again`.

