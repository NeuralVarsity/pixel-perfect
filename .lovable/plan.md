# Sign-in fixes: password toggle + "can't log in after sign-up"

## What's going on
Your account (asadiomer24@gmail.com) was created at 06:32 but its confirmation email was never clicked, so it isn't activated yet. Signing up again at 07:20 didn't create a new account or change the password. It only re-sent the confirmation email. Every sign-in since then has been turned away, and the sign-in page only says "Invalid login credentials", which doesn't explain why.

## Changes
1. **Show/hide password toggle**: an eye icon inside the password box on Sign in, Sign up and the Reset password page.
2. **Activate your account now**: mark asadiomer24@gmail.com as confirmed so you can sign in straight away. If you've forgotten which password you used, "Forgot password?" will work after this.
3. **Clearer messages on the sign-in page**:
   - Unconfirmed account: "Please confirm your email first", with a **Resend confirmation email** button.
   - Wrong email or password: say so, and point to "Forgot password?".
   - Signing up with an email that's already registered: "This email already has an account. Sign in or reset your password" (instead of a silent re-send).
4. After sign-up, show a "Check your inbox" message with a resend button, not just a quick popup.

Email confirmation stays on for new users.

## Technical details
- `src/routes/auth.tsx`: reusable `PasswordInput` with Eye/EyeOff toggle (aria-label, type switch); map `email_not_confirmed` / `invalid_credentials` errors; `supabase.auth.resend({ type: "signup", email })`; detect an existing user from signUp returning `identities.length === 0`.
- `src/routes/reset-password.tsx`: use the same `PasswordInput`.
- One-off data fix: set `email_confirmed_at = now()` for that one user.
- Check with Playwright: toggle works, sign-in succeeds, and the unconfirmed path shows the resend button.
