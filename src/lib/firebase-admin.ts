import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Reads credentials from a Firebase service account (Project settings ->
// Service accounts -> Generate new private key). Set these in .env:
//   FIREBASE_PROJECT_ID=
//   FIREBASE_CLIENT_EMAIL=
//   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
// (Keep the quotes around FIREBASE_PRIVATE_KEY so the \n sequences survive.)
function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["'],?$/g, "");
}

function getFirebaseApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = cleanEnvValue(process.env.FIREBASE_PRIVATE_KEY)?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your .env file.",
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const firestore = getFirestore(getFirebaseApp());
