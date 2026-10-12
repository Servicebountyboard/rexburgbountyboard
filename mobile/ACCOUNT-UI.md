# Mock account UI

Open Profile > Preview account screens, or /account in the local web app.

Nine screens cover sign-in, signup, email verification, verification success,
forgot password, reset email confirmation, new password, reset success, and sign-out.
Development-only review controls expose ready, loading, error, and offline states.

All account operations are simulations. No auth SDK, API calls, email delivery,
or credential persistence is involved. Sign-in selects the existing Bridger demo
profile. Signup does not create a profile. Sign-out clears the local demo selection.
The existing demo account creator remains at /demo-accounts.

UI-only state lives in src/features/account/screens.tsx. Route entry is
src/app/account.tsx. Existing bounty state remains in features/tavern.
Password and username rules are provisional examples, not a service contract.
When the team component specifications arrive, map their result states to these
screens and replace simulation callbacks with the agreed service layer.

Review on Android: keyboard clearance, scrolling, Back behavior, large text,
empty/invalid fields, mismatch errors, resend cooldown, and sign-out cancellation.
