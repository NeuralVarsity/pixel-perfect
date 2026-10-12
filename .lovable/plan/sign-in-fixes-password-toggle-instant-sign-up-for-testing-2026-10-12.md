# Sign-in fixes: password toggle + instant sign-up for testing

## What's going on
New accounts have to click a confirmation email before they can sign in. Dummy email addresses never get that email, so the account stays locked. That is why signing in after sign-up keeps failing. Your account (asadiomer24@gmail.com) is in the same state.

## Changes
1. **Instant sign-up (testing mode)**: turn off the email-confirmation step. A new sign-up is signed in right away and goes straight to the dashboard, even with a made-up email address.
2. **Unlock existing accounts**: mark every account that is currently waiting for confirmation, including yours, as confirmed so they can sign in now.
3. **Show/hide password toggle**: an eye icon inside the password box on Sign in, Sign up and the Reset password page.
4. **Clearer error messages**: "Wrong email or password" (pointing to "Forgot password?"), and "This email already has an account. Sign in instead" when someone signs up twice with the same email.

Note: before real users join, turn email confirmation back on. Otherwise anyone can sign up with an email they don't own. Password reset emails still won't reach dummy addresses.

## Technical details
- Auth config: `auto_confirm_email: true`, keeping signup enabled and the leaked-password check on.
- Data fix: set `email_confirmed_at = now()` where it is null in auth.users.
- `src/routes/auth.tsx`: `PasswordInput` with Eye/EyeOff toggle (aria-label); map `invalid_credentials`; detect an existing user from signUp returning `identities.length === 0`; navigate to /dashboard when `data.session` is returned (already wired).
- `src/routes/reset-password.tsx`: use the same `PasswordInput`.
- Save a memory note that confirmation is off for the testing phase.
- Check with Playwright: sign up with a dummy email, land on the dashboard, sign out, sign back in, and confirm the toggle works.
