#!/usr/bin/env node
/**
 * Grants the `admin: true` custom claim to a Firebase Auth user.
 *
 * The admin dashboard checks this claim in two places:
 *  - `AuthService.performGoogleSignIn` — rejects sign-in without it
 *  - `firestore.rules` isAdmin() — rejects every read/write without it
 *
 * Usage:
 *   node scripts/set-admin-claim.mjs <UID>
 *
 * Credentials (pick one):
 *   1. Service account key:
 *        $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
 *      Download from Firebase Console -> Project Settings -> Service Accounts
 *      -> Generate new private key.  NEVER commit this file.
 *
 *   2. gcloud application-default credentials:
 *        gcloud auth application-default login
 *
 * After running, the user must sign out and sign in again (or the app must
 * call getIdToken(true)) for the new claim to appear in their token. The
 * dashboard already passes forceRefresh: true, so a fresh sign-in is enough.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.mjs <UID>');
  console.error('');
  console.error('Find the UID in Firebase Console -> Authentication -> Users.');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(
    'GOOGLE_APPLICATION_CREDENTIALS is not set - falling back to ' +
      'application-default credentials. If this fails, run:\n' +
      '  gcloud auth application-default login\n',
  );
}

if (getApps().length === 0) {
  initializeApp({ credential: applicationDefault() });
}

const auth = getAuth();

try {
  const user = await auth.getUser(uid);
  const existing = user.customClaims ?? {};

  await auth.setCustomUserClaims(uid, { ...existing, admin: true });

  const updated = await auth.getUser(uid);
  console.log('admin claim granted');
  console.log(`  uid    : ${updated.uid}`);
  console.log(`  email  : ${updated.email ?? '(none)'}`);
  console.log(`  claims : ${JSON.stringify(updated.customClaims)}`);
  console.log('');
  console.log('Sign out and sign in again for the claim to take effect.');
} catch (err) {
  console.error(`Failed to set claim on uid "${uid}"`);
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
