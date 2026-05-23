# Certfolio

Certfolio is a Vite + React portfolio site for publishing tech courses and certifications. It has:

- a public landing page at `/`
- an owner-only admin area at `/admin`
- private source-of-truth records in Firestore
- a public published projection in Firestore

## Stack

- Vite
- React
- Firebase Authentication
- Cloud Firestore
- Vercel for frontend deployment

## Environment Variables

Create a `.env` file from `.env.example`.

Required values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OWNER_UID=your_firebase_auth_uid
```

`VITE_OWNER_UID` must be the Firebase Authentication `uid` of the only account allowed to manage `/admin`.

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev
```

Run lint:

```powershell
npm run lint
```

Create a production build:

```powershell
npm run build
```

## Firestore Structure

Private source records:

```txt
users/{ownerUid}/projects/certfolio/settings/profile
users/{ownerUid}/projects/certfolio/certs/{certId}
```

Public published projection:

```txt
publicProfiles/alvaroperez/meta/profile
publicProfiles/alvaroperez/certs/{certId}
```

## Firebase Rules

This repo includes:

- `firestore.rules`
- `firebase.json`

Deploy rules with Firebase CLI:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <firebase-project-id>
```

## Current Scope

Implemented now:

- owner sign-in gate for `/admin`
- private cert CRUD
- publish/unpublish sync to `publicProfiles/alvaroperez/certs`
- provider-tab public landing page

Still pending:

- polish for admin UX
- final Firebase rule deployment and verification
- Vercel deployment setup
