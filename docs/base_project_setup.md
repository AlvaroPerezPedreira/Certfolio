## Firebase Setup

This document is a generic base setup for a `Vite + React` app that uses `Firebase Authentication` and `Cloud Firestore`.

Firebase initialization is expected to live in `src/firebase.js`.

## Goal

Reuse the same Firebase project across multiple apps, share the same Firebase Authentication users, and keep each app's Firestore data isolated by giving every app its own subcollection branch under `users/{userId}`.

## Required Setup

For each new app:

1. Reuse the existing Firebase project.
2. Reuse the same Firebase Authentication setup so the same users can sign in.
3. Reuse the same `.env` variable names.
4. Create a new app-specific Firestore branch under `users/{userId}/projects/{projectName}`.
5. Do not reuse another app's first subcollection unless both apps intentionally share the same data.
6. Keep the existing Firestore rule pattern based on `users/{userId}`.

## App Type

- Build tool: `Vite`
- UI: `React`
- Firebase SDK usage:
- `getAuth(app)` for authentication
- `getFirestore(app)` for Firestore

## Environment Variables

This app expects the following variables in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Use the same `.env` variable names across all apps that connect to this Firebase project.

Base `.env.example`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Firebase Config

Current config source in `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

Initialization summary:

```js
const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
```

## Auth Setup

This app uses Firebase Auth with email/password sign-in.

Observed auth flow:

- `onAuthStateChanged(auth, ...)` in `src/context/AuthContext.jsx`
- `signInWithEmailAndPassword(auth, email, password)` in `src/hooks/useAuth.js`
- `signOut(auth)` in `src/hooks/useAuth.js`

This means multiple apps can share the same Firebase Authentication users as long as they point to the same Firebase project.

## Auth Note

- Firebase Authentication is shared across apps.
- The same user can sign in to multiple apps when those apps use the same Firebase project.
- Data separation is handled by Firestore paths, not by Firebase Auth.

## Project Namespace Rule

- Every app must store its data under `users/{userId}/projects/{projectName}`.
- `{projectName}` must be lowercase.
- `{projectName}` should be unique per app.
- Example: `Charting` becomes `charting`.

## Entity Naming Rule

- Entity collection names should be lowercase.
- Prefer plural collection names when they represent many records.
- Examples: `actives`, `accounts`, `entries`, `tasks`.
- Use nested subcollections only when the data model requires them.

## Shared Auth, Separate App Data

Recommended approach if several apps use the same Firebase project:

- share `Firebase Authentication`
- multiple apps can share the same Firebase Auth users
- keep a shared user root such as `users/{userId}`
- create one project namespace under `users/{userId}/projects/{projectName}`
- do not reuse another app's project namespace unless the apps intentionally share data
- subcollections are optional and should only be added when the app needs them

Recommended generic pattern:

```txt
users/{userId}/projects/{projectName}/{entityCollection}/{documentId}
users/{userId}/projects/{projectName}/{entityCollection}/{documentId}/{subcollection}/{subdocumentId}
```

Examples:

```txt
users/{userId}/projects/charting/actives/{activeId}
users/{userId}/projects/charting/actives/{activeId}/snapshots/{snapshotId}
users/{userId}/projects/budgeting/budgets/{budgetId}
users/{userId}/projects/journal/entries/{entryId}
```

This keeps the same authenticated user identity while isolating each app's Firestore data model.

## Firestore Naming Rule

Use this rule for new projects:

- share `users/{userId}`
- create each app under `users/{userId}/projects/{projectName}`
- use the project name in lowercase for `{projectName}`
- example: `Charting` becomes `charting`
- keep entity collections inside that project namespace, such as `actives`, `accounts`, or `entries`
- add nested subcollections only when the data model requires them
- do not reuse another app's project namespace if the data must stay isolated

Safe example:

```txt
users/{userId}/projects/charting/actives/{activeId}
```

Unsafe example if the app should follow the project namespace standard:

```txt
users/{userId}/actives/{activeId}
```

This is unsafe because it skips the project namespace and makes the branch harder to isolate from other apps.

## Starter Firestore Example

```txt
users/{userId}/projects/myapp/tasks/{taskId}
users/{userId}/projects/myapp/accounts/{accountId}
users/{userId}/projects/myapp/settings/profile
users/{userId}/projects/myapp/tasks/{taskId}/comments/{commentId}
```

## Do Not Use Examples

Do not use paths like these for new apps:

```txt
users/{userId}/actives/{activeId}
users/{userId}/accounts/{accountId}
users/{userId}/entries/{entryId}
```

These paths skip the project namespace and make unrelated apps harder to isolate.

## Current Security Rule Pattern

The repo currently documents this rule pattern:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This works well with a shared `users/{uid}/...` structure and supports multiple apps when each app stores data in its own subcollection branch.
