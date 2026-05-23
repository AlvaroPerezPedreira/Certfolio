# Certfolio Roadmap

This document is the source of truth for planning and implementing the project.

Its purpose is to be refined through iterative Q&A until it is specific enough that an implementation agent can execute it consistently with minimal ambiguity.

## 1. Project Overview

### Project Name
- Certfolio

### One-Sentence Summary
- Certfolio is a public personal landing page for showcasing published tech courses and certifications, with a protected admin area for managing the content through Firebase Authentication.

### Problem Statement
- A recruiter or visitor should be able to open one CV link and quickly understand the user's technical learning history.
- The current problem is that courses and certifications are usually scattered across providers, emails, profile pages, and PDFs, which makes them harder to review as a coherent portfolio.
- It is worth solving because a focused public landing page can improve credibility, make the CV more actionable, and give the user a controlled place to curate what is visible.

### Target Users
- Primary public user: Recruiters, hiring managers, and anyone opening the CV link
- Primary admin user: The owner of the profile
- Secondary users: None in v1
- Technical skill level of users: General web users for the public page, technical user for the admin side

### Core Value Proposition
- A visitor gets a clean, public, easy-to-scan certifications page grouped by provider, while the owner gets a simple authenticated admin workflow to publish and maintain the content.

## 2. Success Criteria

### Outcome Goals
- Success for v1 means the public landing page is accessible to everyone, shows only published certifications, groups them into provider tabs, and lets the owner create, edit, publish, unpublish, and delete entries from `/admin` after signing in with Firebase Authentication.
- The project is already useful once the owner can maintain a curated public list of certifications that is stable enough to link from a CV.

### Non-Goals
- Multi-user profiles
- Public search
- Public filtering beyond provider tabs
- Rich CMS features
- Multiple admin roles
- Separate viewer and editor repos
- Complex analytics dashboards
- SSR or backend-heavy rendering unless a later need appears

### Constraints
- Preferred stack: Vite + React + Firebase Authentication + Cloud Firestore
- Hosting: Vercel
- Firebase reuse: Reuse the existing Firebase project and the existing `.env` variable names from the base setup
- Auth model: Only the owner's Firebase user can edit
- Owner identity check: Use a fixed owner UID stored in config or environment for v1
- Public access model: Public users can view published data without signing in
- Styling constraint: The implementation agent must read `DESIGN.md` from the project root before implementing visual design decisions
- Maintenance expectation: Keep architecture simple and consistent with the existing base app conventions where possible

## 3. Product Scope

### Must-Have Features

1. Shared Firebase foundation
   - User need: Reuse the existing Firebase project and auth setup rather than creating a separate auth system.
   - Expected behavior: Certfolio uses the same Firebase project, `src/firebase.js` setup pattern, and `.env` variable names described in the base setup.
   - Acceptance criteria: The app initializes Firebase through the shared environment variables and can authenticate the owner using the shared Firebase project.

2. Public landing page
   - User need: Anyone with the CV link should be able to view the published certifications.
   - Expected behavior: The root route shows the public Certfolio profile and only renders published cert records.
   - Acceptance criteria: An unauthenticated visitor can load the landing page and see published content without accessing admin features.

3. Protected admin area
   - User need: Only the owner should be able to create or edit records.
   - Expected behavior: `/admin` is protected by Firebase Authentication and by Firestore rules that only allow the owner's UID to write.
   - Acceptance criteria: Unauthenticated users cannot enter admin features, and authenticated non-owner users cannot edit data.

4. Published-only public visibility
   - User need: Draft or incomplete entries must stay private until intentionally published.
   - Expected behavior: Private admin records can exist in an app-specific private namespace, and a separate public published branch is used for the public landing page.
   - Acceptance criteria: Unpublished items do not appear on the public page.

5. Provider-tab presentation
   - User need: Visitors should be able to scan certifications grouped by course provider or corporation.
   - Expected behavior: The landing page renders one tab per provider and shows that provider's certifications in a card-based layout.
   - Acceptance criteria: When records from multiple providers exist, the UI separates them into distinct tabs.

6. Cert CRUD with optional links
   - User need: The owner needs a lightweight way to maintain each certification entry.
   - Expected behavior: Admin can create, edit, publish, unpublish, and delete certs, each with an optional external link.
   - Acceptance criteria: A cert can be saved with or without an external link.

### Nice-to-Have Features

1. Featured ordering
   - Reason it matters: Some certs may deserve more prominent placement.
   - Why it is deferred: The provider-tab structure is enough for v1, and manual ordering can come first.

2. Public certificate detail page
   - Reason it matters: A richer detail page could hold longer descriptions or proof.
   - Why it is deferred: v1 only requires a landing page with provider tabs and cards.

3. Draft preview mode
   - Reason it matters: It would help review unpublished changes before publishing.
   - Why it is deferred: v1 can rely on admin-side preview patterns later if needed.

### Future Ideas
- Multiple public profiles under the same codebase
- Provider logos or branding metadata
- Sorting options inside each provider tab
- Auto-import from third-party learning platforms
- Basic analytics for public visits
- SEO enhancements or server-assisted metadata if needed later

## 4. Functional Requirements

### Feature: Owner Sign In
- Trigger: The owner opens `/admin` while unauthenticated.
- Inputs: Email and password.
- System behavior: Authenticate through Firebase Authentication using the shared Firebase project through a normal login form. After sign-in, verify that `auth.currentUser.uid` matches a fixed owner UID stored in app config or environment before loading the admin UI.
- Outputs: Successful sign-in redirects to the admin dashboard.
- Error states: Invalid credentials, network failures, and non-owner accounts should show clear feedback.
- Edge cases: A valid Firebase user who is not the configured owner must not get write access.

### Feature: Public Landing Page
- Trigger: Any visitor opens the root route.
- Inputs: None required.
- System behavior: Fetch and display only published public records. Group records by provider and render provider tabs with card-style items.
- Outputs: A readable public portfolio page.
- Error states: If no published records exist, show a clean empty state rather than an error-looking screen.
- Edge cases: Providers may have one cert or many certs. A cert may have no external link.

### Feature: Manage Certs
- Trigger: The owner uses the admin interface to create or update a cert.
- Inputs: Title, provider, provider slug, completion date, optional issuer text, optional description, optional single external link, published status.
- System behavior: Save the editable source record in the private Certfolio namespace. If the record is published, sync the public projection used by the landing page.
- Outputs: The cert appears in admin immediately and appears publicly only when published.
- Error states: Required-field validation errors, failed writes, and public-sync failures should be surfaced clearly.
- Edge cases: Editing a published cert should update both the private source and the public projection. Unpublishing should remove it from the public projection. Description remains optional in v1. Duplicate titles are allowed within the same provider in v1.

### Feature: Publish And Unpublish
- Trigger: The owner toggles a cert's publication state.
- Inputs: Target cert and publish state.
- System behavior: Publishing writes the public-ready version of the cert into the public branch. Unpublishing removes the public version but preserves the private source record.
- Outputs: The public landing page reflects the latest published state.
- Error states: If the public write/delete fails, the admin UI should show that the publish state is not fully synchronized.
- Edge cases: A cert can be drafted privately for an extended period before ever being published. Publishing is allowed with only the required fields and without issuer, external link, or description.

### Feature: Optional External Link
- Trigger: The owner adds a relevant URL to a cert.
- Inputs: One optional URL such as a credential link, course page, or proof link.
- System behavior: Validate that the URL is a full `https://` URL, store it only when provided, and render the public link action only when present.
- Outputs: Public cards can contain zero or one external action depending on whether a link exists, and the link opens in a new tab in v1.
- Error states: Invalid URLs should block save or be normalized consistently.
- Edge cases: Some records may only have a title and provider with no links.

### Feature: Provider Tabs
- Trigger: Public data contains records from one or more providers.
- Inputs: Published cert collection.
- System behavior: Group records by manually managed `providerSlug`, render one tab per provider, and sort tabs alphabetically by provider label in v1.
- Outputs: Visitors can switch provider tabs and browse the corresponding cards.
- Error states: None beyond standard data-loading errors.
- Edge cases: Provider names must stay stable enough that small spelling differences do not create accidental duplicate tabs.

### Feature: Confirm Destructive Actions
- Trigger: The owner attempts to delete a cert.
- Inputs: Delete action plus confirmation.
- System behavior: Require an explicit confirmation step before permanent deletion. A published cert can be hard-deleted in a single confirmed action.
- Outputs: The target data is deleted only after confirmation.
- Error states: Failed deletes should keep the UI consistent and visible to the admin.
- Edge cases: Deleting a published cert must also remove its public projection.

## 5. Non-Functional Requirements

### Performance
- Expected load: Low in v1; public visitors mainly read a small published dataset, and one owner manages content.
- Response-time expectations: Public page should feel fast on first load and tab switching should be immediate once data is loaded.

### Reliability
- Availability expectations: Standard Vercel + Firebase expectations are acceptable for v1.
- Backup/recovery needs: Firestore remains the source of truth; export workflows can be added later if needed.

### Security
- Authentication required? yes for admin only
- Authorization roles: Single owner UID in v1
- Sensitive data involved: Minimal personal portfolio data only
- Security baseline: Private editable data remains owner-only; public published data is readable to everyone but writable only by the owner UID

### Privacy
- Personal data stored: Certification/course metadata and optional external links
- Data retention expectations: Records remain until deleted by the owner
- Compliance needs: No special compliance target defined yet

### Accessibility
- Accessibility target: Reasonable keyboard support, readable contrast, semantic tabs, and accessible admin forms without a formal compliance target in v1

### Observability
- Logs required: Basic client-side error logging
- Metrics required: None in v1
- Error tracking required: No external tracking required in v1

## 6. User Experience

### Primary User Flows

1. Public visitor flow
   - Step 1: Visitor opens the CV link.
   - Step 2: Landing page loads published certs.
   - Step 3: Visitor switches provider tabs and scans the cards.

2. Admin sign-in flow
   - Step 1: Owner opens `/admin`.
   - Step 2: Owner signs in with Firebase Authentication.
   - Step 3: Admin dashboard loads and shows the cert list.

3. Create and publish a cert
   - Step 1: Owner creates a cert from the admin form.
   - Step 2: Owner optionally adds an external link.
   - Step 3: Owner publishes the cert.
   - Step 4: Public landing page reflects the new card under the correct provider tab.

4. Edit an existing cert
   - Step 1: Owner selects a cert in admin.
   - Step 2: Owner updates metadata, links, or publication state.
   - Step 3: Private and public representations stay synchronized according to the published state.

### UI/UX Direction
- Platform: Responsive web app with strong desktop presentation and solid mobile support
- Visual style constraints: The implementation agent must read Certfolio's `DESIGN.md` from the project root before making styling decisions
- Design system preference: Preserve the visual direction defined in `DESIGN.md`; do not invent a conflicting visual language
- Mobile support expectations: Public landing page and core admin flows should work on mobile, even if desktop is the primary management experience
- Internationalization needed? no in v1

### Content Requirements
- Copy tone: Clear, professional, and concise
- Required pages/screens: public landing page, login gate if needed for admin, protected admin dashboard, cert form, delete confirmations
- Empty states needed: no published certs, no certs yet in admin, no links
- Onboarding needed: Minimal; the admin should be obvious enough without a tutorial

### Screen/Page Structure

#### 1. Public Landing Page
- Purpose: Show the published certifications portfolio linked from the CV.
- Main elements: fixed page title `Tech Courses & Certifications`, provider tabs, compact cert cards, optional single-link action.
- Behavior: Publicly accessible at `/`, shows only published certs, and groups cards by provider.
- Notes: This page is the main product surface and should feel presentation-ready. Tabs should still render even when only one provider exists in v1.

#### 2. Admin Route
- Purpose: Protect editing features from public users.
- Main elements: auth gate, owner check, admin shell.
- Behavior: `/admin` is accessible only to the owner account.
- Notes: If an unauthenticated user visits `/admin`, show login. If an authenticated non-owner visits, deny access.

#### 3. Admin Dashboard
- Purpose: Manage the cert inventory.
- Main elements: one sortable cert list, create action, edit action, inline publish toggle, delete action.
- Behavior: Shows all private source certs regardless of published state in one management list with simple sorting only in v1. The default sort is newest `completedAt` first.
- Notes: Draft and published state should be easy to distinguish.

#### 4. Cert Form
- Purpose: Create and edit a cert record.
- Main elements: title, provider, provider slug, completion date, issuer, description, optional single link, published toggle.
- Behavior: Supports create and edit with inline validation.
- Notes: Keep this form practical and lightweight rather than turning it into a full CMS. Provider text and provider slug are both editable fields in v1. `providerSlug` should auto-generate from `provider` on first entry, then remain manually editable.

#### 5. Delete Confirmation
- Purpose: Prevent accidental destructive actions.
- Main elements: confirmation text, cancel, confirm.
- Behavior: Used for cert deletion.
- Notes: Destructive actions should be explicit.

#### Route Recommendation
- Public route: `/`
- Admin route: `/admin`
- Optional auth route: `/login` only if it improves clarity; otherwise `/admin` can handle the auth gate inline with a normal Firebase login form

### CRUD Behavior

#### Certs
- Create: Admin creates a private source cert under the Certfolio namespace.
- Read: Admin reads private source certs; public page reads public published certs.
- Update: Editing updates the private source and syncs the public copy when published.
- Delete: Deleting a cert removes the private source and any related public projection in one confirmed hard-delete action.

## 7. Technical Architecture

### Proposed Stack
- Frontend: Vite + React
- Backend model: Firebase client-driven app
- Database: Cloud Firestore
- Auth: Firebase Authentication with email/password
- Infrastructure: Shared Firebase project reused from the base setup
- Deployment: Vercel
- CI/CD: Minimal CI running `lint` in v1

### Architecture Decisions
- Monolith or split services? Single frontend app with public and protected routes
- SSR / SPA / static? SPA in v1
- Why this architecture fits the project: It keeps the implementation small, reuses the existing Firebase base setup, supports a public landing page plus protected admin, and avoids duplication across separate viewer and editor repos

### Firebase Setup Baseline
- Firebase initialization should live in `src/firebase.js`
- Reuse the same shared `.env` variable names from the base setup
- Use `getAuth(app)` for authentication
- Use `getFirestore(app)` for Firestore
- Add one owner-only config value for v1 such as `VITE_OWNER_UID`

### Required Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OWNER_UID=your_firebase_uid
```

### Core Architecture Decision: Private Source Plus Public Projection
- The base setup assumes app data should live under `users/{userId}/projects/{projectName}`.
- That pattern should still be used for Certfolio's private editable source data.
- Public visibility introduces a requirement that cannot be satisfied by the private `users/{userId}` rule pattern alone.
- Therefore Certfolio should use a hybrid model:
  - Private editable source under `users/{userId}/projects/certfolio/...`
  - Public published projection under a separate public-readable branch

### Why The Hybrid Model Is Required
- The base Firestore rules described in the shared setup only allow the authenticated owner to read and write under `users/{userId}`.
- A public landing page needs unauthenticated public read access.
- The safest simple solution is to keep source-of-truth admin records private and project only the published subset to a separate public branch.

## 8. Data Model

This section is the current source of truth for Certfolio persistence decisions.

### Database Baseline
- Database: Cloud Firestore
- Auth model: Shared Firebase Authentication users
- Private data isolation rule: Private Certfolio source data must live under `users/{userId}/projects/certfolio`
- Project namespace rule: `certfolio` must be lowercase
- Collection naming rule: Use lowercase collection names; prefer plural names for multi-record collections
- Public data rule: Publicly visible content must live outside the private `users/{userId}` branch in a public-readable projection
- Core model for v1: `settings + certs` privately, plus `publicProfiles` projection publicly

### Private Firestore Path Standard
```txt
users/{userId}/projects/certfolio/settings/profile
users/{userId}/projects/certfolio/certs/{certId}
```

### Public Firestore Path Standard
```txt
publicProfiles/alvaroperez/meta/profile
publicProfiles/alvaroperez/certs/{certId}
```

### Public Entity Baseline
- Certfolio v1 uses two main cert entities:
  - private source certs under `users/{userId}/projects/certfolio/certs/{certId}`
  - public published certs under `publicProfiles/alvaroperez/certs/{certId}`
- The optional `publicProfiles/alvaroperez/meta/profile` document stores public-profile metadata, not a second cert collection
- There is no MongoDB model in this project; the source of truth is Firestore document paths and Firestore document shapes

### Public Profile Decision
- v1 is only for a single owner.
- The public profile slug is fixed to `alvaroperez` in v1.
- If multi-profile support is needed later, the same structure can generalize without rewriting the core cert entity.

### Entity: settings
- Purpose: Store owner-specific app configuration for Certfolio
- Path example: `users/{userId}/projects/certfolio/settings/profile`
- Key fields: `ownerUid`, `publicProfileSlug`, optional UI preferences, optional lastEditedCertId`
- Relationships: Belongs to the owner's private Certfolio namespace
- Validation rules: Keep this document small and configuration-focused

### Entity: private certs
- Purpose: Source-of-truth editable cert records controlled by the owner
- Path example: `users/{userId}/projects/certfolio/certs/{certId}`
- Key fields: `title`, `provider`, `providerSlug`, `completedAt`, `issuer?`, `description?`, `externalUrl?`, `published`, `createdAt`, `updatedAt`, `publishedAt?`
- Relationships: A private cert may map to one public cert projection when published
- Validation rules: `title`, `provider`, `providerSlug`, and `completedAt` are required; duplicate titles are allowed in v1; `issuer` is always optional in v1; `description` is optional in v1; `completedAt` uses `YYYY-MM` in v1, must be a valid calendar month, and must not be in the future; `published` is required boolean; `externalUrl` must be a valid full `https://` URL when present

### Entity: public certs
- Purpose: Publicly readable published subset used by the landing page
- Path example: `publicProfiles/alvaroperez/certs/{certId}`
- Key fields: `title`, `provider`, `providerSlug`, `completedAt`, `issuer?`, `description?`, `externalUrl?`, `publishedAt`, `updatedAt`
- Relationships: Mirrors the public-safe subset of a private cert
- Validation rules: Only include fields intended for public display; never include private admin-only metadata here

### Link Modeling Decision
- Store one optional external URL directly on the cert document as `externalUrl`
- Reason: v1 only needs a single optional public action and does not need a more complex links model yet

### Provider Grouping Decision
- Public tabs are derived from the normalized `provider` or `providerSlug` field on published certs
- `providerSlug` is manually managed in admin and must be normalized and stable so tiny naming differences do not create duplicate tabs
- The public UI should group on `providerSlug`, display the human-readable `provider` label, and sort provider tabs alphabetically in v1

### Recommended Private Cert Shape
```txt
users/{userId}/projects/certfolio/certs/{certId}
  title: string
  provider: string
  providerSlug: string
  completedAt: string // YYYY-MM
  issuer?: string
  description?: string
  externalUrl?: string
  published: boolean
  createdAt: timestamp
  updatedAt: timestamp
  publishedAt?: timestamp
```

### Recommended Public Cert Shape
```txt
publicProfiles/alvaroperez/certs/{certId}
  title: string
  provider: string
  providerSlug: string
  completedAt: string // YYYY-MM
  issuer?: string
  description?: string
  externalUrl?: string
  publishedAt: timestamp
  updatedAt: timestamp
```

### Timestamp Strategy
- Use Firestore server timestamps consistently where practical
- `createdAt`: set on creation
- `updatedAt`: update on every write
- `publishedAt`: set when first published or updated according to the chosen publishing strategy

### Date Strategy
- `completedAt` is stored as a string in `YYYY-MM` format in v1
- `completedAt` must represent a real calendar month
- `completedAt` must not be in the future
- Public cards should render that value in `Month YYYY` format while the persisted format remains `YYYY-MM`

### Public Card Content Baseline
- Public cards always show `title`
- Public cards also show `provider` even inside a provider tab in v1
- Public cards show `completedAt` and `externalUrl` when present
- If `issuer` exists and is meaningfully different from `provider`, it may be shown as separate metadata; if it matches `provider`, the card should show only one visible provider/issuer line
- Public cards do not show `description` in v1; cards should stay compact and scan-friendly
- Public card titles clamp to 2 lines in v1
- The landing page title is fixed to `Tech Courses & Certifications` in v1
- Provider tabs always render, even when there is only one provider in the dataset
- Public external links open in a new tab in v1
- Public external links use the fixed label `View certificate` in v1
- The public page should not include a note explaining that only published certs are shown
- The public page should not include a last-updated hint in v1

### Public Ordering Baseline
- Inside each provider tab, certs are sorted by `completedAt` descending in v1
- Provider tabs are sorted alphabetically by provider label in v1

### Provider Slug Edit Policy
- `providerSlug` is editable in admin in v1
- If the owner edits a `providerSlug` that already affects published certs, the UI should warn that the change will affect public grouping and tabs
- The change is still allowed after the warning

### Provider Tab Rendering Policy
- Public provider tabs should be derived only from providers that currently have at least one published public cert
- This keeps the public tab model simple and avoids needing a separate public provider registry in v1
- Empty provider tabs should not exist in the public UI in v1 because tabs are created only from published cert data

### Provider Slug Input Strategy
- In admin, `providerSlug` should auto-generate from the current `provider` value on first entry
- After auto-generation, the field remains editable so the owner can normalize it manually
- If the owner has manually changed the slug, later provider text edits should not silently overwrite the customized slug

### Tab State Strategy
- Provider tabs use local client state only in v1
- Deep-linking to a specific provider tab is not required in v1
- The initial active tab is the alphabetically first provider tab in v1

### Admin Sorting Baseline
- The admin list uses simple sorting only in v1
- The default sort is newest `completedAt` first
- The admin list does not need switchable sort modes in v1

### Public Profile Metadata Shape
Recommended Firestore shape:

```txt
publicProfiles/alvaroperez/meta/profile
  title: string
  slug: string
  createdAt: timestamp
  updatedAt: timestamp
```

- This document is optional for v1 but may be used for the fixed public page metadata and future profile-level settings
- The fixed landing page title in code remains acceptable for v1 even if this document exists

### Firestore Rules Baseline
- Keep the existing private rule pattern for `users/{userId}`-scoped data
- Add a public-readable rule for the public profile projection
- Only the owner UID should be allowed to write to the public profile branch

Recommended direction:

```txt
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /publicProfiles/{profileSlug}/{document=**} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == <OWNER_UID_OR_EQUIVALENT_CHECK>;
}
```

## 9. Delivery Plan

### Phase 0: Clarify Remaining Decisions
- Confirm the final provider normalization rules in admin UX terms.

### Phase 1: Project Setup
- Create the Vite + React app structure if not already present.
- Add `src/firebase.js` based on the shared base setup.
- Configure Firebase Authentication and Firestore.
- Read the root `DESIGN.md` before implementing styling.
- Add linting and formatting.
- Set up minimal CI running `lint`.

### Phase 2: Data Layer And Security
- Implement private Certfolio collections under `users/{userId}/projects/certfolio`.
- Implement public published projection under `publicProfiles/{slug}`.
- Implement admin auth guard and fixed owner UID check from config/env.
- Implement Firestore reads/writes for private and public branches.
- Finalize Firestore rules for owner writes and public reads.

### Phase 3: Public Experience
- Build the public landing page at `/`.
- Implement provider-tab grouping and card layout.
- Implement empty states for no published certs.
- Wire public cert links.
- Use a fixed landing page title in code for v1.
- Keep provider tabs visible even when only one provider exists.
- Default the active public tab to the alphabetically first tab.
- Format `completedAt` as `Month YYYY` on public cards.
- Render provider tabs only for providers that currently have published certs.

### Phase 4: Admin Experience
- Build the protected admin route.
- Build the admin dashboard with one sortable cert list.
- Build the cert form with validation.
- Implement create, edit, publish, unpublish, and delete flows.
- Support inline publish toggles in the admin list as well as publish control in the edit form.
- Implement manual `providerSlug` handling in admin so provider tabs stay stable.
- Auto-generate `providerSlug` from `provider` on first entry, then allow manual edits.
- Warn before saving `providerSlug` edits that affect published grouping.
- Use simple list sorting only in v1; do not add drag ordering.
- Add confirmation dialogs for destructive actions.

### Phase 5: Quality Hardening
- Run manual QA on public and admin flows.
- Verify that unpublished items never appear publicly.
- Verify provider tabs group correctly.
- Verify non-owner accounts cannot edit.
- Improve validation and accessibility where needed.

### Phase 6: Release
- Prepare Vercel production environment variables.
- Run final QA pass.
- Write README and deployment notes.
- Deploy v1.
- Add the public landing page URL to the CV.

### Phase 7: Post-Launch
- Collect feedback from real CV usage.
- Fix early issues.
- Decide whether detail pages, featured ordering, or analytics are worth adding.

## 10. Implementation Order

When an agent starts building, it should generally follow this order unless this document later overrides it:

1. Read the shared base setup document and Certfolio's root `DESIGN.md`.
2. Set up Firebase initialization using the shared environment variable names.
3. Implement owner authentication and `/admin` route protection.
4. Implement private `users/{userId}/projects/certfolio` collections.
5. Implement public `publicProfiles/{slug}` published projection.
6. Implement the public landing page with provider tabs and card layout.
7. Implement admin CRUD and publish/unpublish handling.
8. Finalize Firestore rules.
9. Add linting, CI baseline, and deployment readiness.
10. Perform final validation against acceptance criteria.

## 11. Acceptance Checklist For v1

The project is considered ready for v1 only if all applicable items below are satisfied.

- The public landing page is accessible without authentication.
- Only published certs appear publicly.
- The public page groups certs into provider tabs.
- Each provider tab displays certs in a card-style layout.
- Certs inside provider tabs are ordered by newest `completedAt` first.
- Provider tabs are ordered alphabetically.
- Provider tabs still render when only one provider exists.
- Public cards stay compact and do not show descriptions by default.
- Public cards show the provider name.
- Public cards collapse duplicate provider and issuer display into one visible line.
- Public card titles clamp to 2 lines.
- Public external links open in a new tab.
- Public external links use the label `View certificate`.
- Public `completedAt` values render as `Month YYYY`.
- The owner can access `/admin` after authenticating.
- Non-owner users cannot edit data.
- The admin dashboard uses one sortable list for cert management.
- The admin dashboard defaults to newest `completedAt` first.
- The admin dashboard uses one fixed default sort in v1.
- The admin dashboard supports inline publish toggles.
- The owner can create, edit, publish, unpublish, and delete certs.
- Publishing is allowed with only the required fields.
- Each cert supports one optional external link.
- Optional external links require full `https://` URLs.
- `completedAt` accepts only valid non-future months in `YYYY-MM` format.
- `providerSlug` auto-generates from `provider` on first entry and remains editable afterward.
- Private source data lives under `users/{userId}/projects/certfolio`.
- Public published data lives in a separate public-readable branch.
- Public provider tabs are derived only from providers with at least one published cert.
- Firestore rules enforce public-read and owner-only-write behavior correctly.
- Empty states and validation states are implemented.
- The app can run locally from documented instructions.
- The Vercel deployment path is defined and tested.

## 12. Agent Execution Rules

An implementation agent should follow these rules unless later instructions override them.

1. Do not invent product requirements when the document is ambiguous.
2. Prefer the smallest correct implementation that satisfies the current roadmap.
3. Reuse the shared Firebase project and the existing `.env` variable names from the base setup.
4. Keep private source data under `users/{userId}/projects/certfolio`.
5. Use a separate public projection for published data rather than weakening private rules.
6. Treat the public landing page as the primary product surface and `/admin` as the management surface.
7. Enforce admin access with a fixed owner UID stored in config or environment for v1.
8. Use manual `providerSlug` values to prevent accidental duplicate provider tabs.
9. Read the root `DESIGN.md` before making styling decisions.
10. Keep v1 narrow and practical.
11. Update this roadmap when scope or architectural decisions change.

## 13. Open Questions

Use this section to track unresolved decisions.

1. Tab visual style should be taken from `DESIGN.md` during implementation.
2. Admin search is not needed in v1.
3. The admin form should use explicit save in v1.
4. Public cert counts should be omitted in v1.

No blocking product or data-model questions are currently open for v1 implementation.

## 14. Next Refinement Pass

In the next Q&A round, answer these in order:

1. Review implementation against `DESIGN.md` once styling starts.
2. Verify Firestore rules against the actual deployed Firebase project.
3. Verify the publish-sync flow between private and public cert documents.
4. Validate the public card layout against real cert content lengths.
5. Update the roadmap only if implementation reveals missing behavior or a better minimal approach.
