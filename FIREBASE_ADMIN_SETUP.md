# AJAY NXT Firebase Admin

The public site remains hosted on GitHub Pages. Firebase is used only for:

- Google sign-in for the private admin dashboard
- editable public content
- saved project enquiries
- privacy-conscious click events

## One-time setup

1. Create or select the Firebase project intended for `ajaynxt.com`.
2. Register a Web App and paste its public config into `firebase-config.js`.
3. Deploy the included Authentication configuration to enable only Google sign-in.
4. Confirm `ajaynxt.com` under Authentication > Settings > Authorized domains.
5. Create Cloud Firestore.
6. Authenticate Firebase CLI and select the project:

   ```bash
   pnpm dlx firebase-tools@latest login
   pnpm dlx firebase-tools@latest use --add
   ```

7. Deploy only the database rules and indexes:

   ```bash
   pnpm dlx firebase-tools@latest deploy --only auth,firestore:rules,firestore:indexes
   ```

8. Run `pnpm build`, commit `firebase-dist/`, and deploy the site through GitHub Pages.

## Admin access

Admin URL:

```text
https://ajaynxt.com/admin/
```

Only the verified Google account `ajayx3neha@gmail.com` is accepted in both:

- the admin interface
- `firestore.rules`

Changing the email in JavaScript alone does not grant access. The rule must also be updated and deployed.
