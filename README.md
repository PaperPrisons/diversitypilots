# DiversityPilots

## Deploy to GitHub Pages

1. **Push your code to GitHub** (if you haven’t already):
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages"
   git push origin bhoomika
   ```
   To publish from `main` instead: `git checkout main`, merge your changes, then `git push origin main`.

2. **Enable GitHub Pages** in the repo:
   - Open **https://github.com/PaperPrisons/diversitypilots**
   - Go to **Settings → Pages**
   - Under **Build and deployment**, set **Source** to **Deploy from a branch**
   - Choose **Branch**: `main` or `bhoomika`, **Folder**: `/ (root)**
   - Click **Save**

3. **Wait a minute or two.** Your site will be at:
   - **https://paperprisons.github.io/diversitypilots/** (if the repo is `PaperPrisons/diversitypilots`)

4. **After changing Tailwind/CSS**, rebuild and commit so the live site updates:
   ```bash
   npm run build:css
   git add dist/output.css
   git commit -m "Update CSS"
   git push
   ```

The repo includes a `.nojekyll` file so GitHub serves the site as plain static files (no Jekyll processing).

---

## Blog Dashboard (Org-only)

This repo now includes a client-side scaffold for an internal blog dashboard under `dashboard/`:

- `dashboard/login.html` — lightweight org access gate (replace with real auth)
- `dashboard/index.html` — dashboard UI to create and manage drafts
- `scripts/dashboard.js` — page logic, local draft storage, simple publish toggle

Navbar includes a new `DASHBOARD` link which routes to `dashboard/index.html` with relative path handling.

### How it works (current)

- Login uses a placeholder org key defined in `scripts/dashboard.js` (`ORG_SECRET`). On success it sets `sessionStorage` and redirects to the dashboard.
- Drafts are stored in `localStorage` on the browser (no backend yet). They’re visible only on the device where they were created.

### Important

This is for prototyping. To make it production-ready:

1. Replace the access key gate with real authentication (e.g., Firebase Auth, Auth0, or Netlify Identity).
2. Persist posts to a backend (e.g., serverless functions + database). Optionally, generate static HTML under `components/blogdetails/` via a commit API.
3. Add role-based access control (e.g., Admin vs Member) and server-side checks.

If you’d like, we can wire Firebase Auth + Firestore or Netlify Functions in a follow-up PR.

## Firebase integration (optional but recommended)

This project includes optional Firebase wiring (Auth + Firestore). To enable:

1. Create a Firebase project and a Web App.
2. Copy your config from Firebase Console → Project settings → Your apps → SDK snippet.
3. Paste into `scripts/firebase.js` (replace placeholders).
4. In Firestore, create collections: `orgUsers` and `posts`.
	 - `orgUsers/{uid}` docs contain `{ role: 'OrgMember' | 'BlogAdmin' }`.
	 - `posts/{id}` docs contain fields: `title, content, tags, status, slug, authorId, createdAt, updatedAt`.
5. Add Firestore Security Rules similar to:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		function isOrgMember() {
			return request.auth != null &&
				exists(/databases/$(database)/documents/orgUsers/$(request.auth.uid)) &&
				get(/databases/$(database)/documents/orgUsers/$(request.auth.uid)).data.role in ['OrgMember','BlogAdmin'];
		}
		function isBlogAdmin() {
			return request.auth != null &&
				exists(/databases/$(database)/documents/orgUsers/$(request.auth.uid)) &&
				get(/databases/$(database)/documents/orgUsers/$(request.auth.uid)).data.role == 'BlogAdmin';
		}

		match /posts/{postId} {
			allow read: if true; // public blog can read
			allow create: if isOrgMember() && request.resource.data.authorId == request.auth.uid;
			allow update, delete: if isBlogAdmin() || (isOrgMember() && resource.data.authorId == request.auth.uid);
		}

		match /orgUsers/{userId} {
			allow read: if request.auth != null && request.auth.uid == userId;
			allow write: if false; // manage roles via console or server only
		}
	}
}
```

6. Enable Firebase Storage and set Storage Security Rules (restrict writes to owners, allow public reads for published assets if you want):

```
rules_version = '2';
service firebase.storage {
	match /b/{bucket}/o {
		match /posts/{uid}/{postId}/{filename} {
			allow read: if true; // or restrict to published posts via Firestore check with rules v2 if desired
			allow write: if request.auth != null && request.auth.uid == uid;
		}
	}
}
```

7. Add your org users to `orgUsers` with role `'OrgMember'` or `'BlogAdmin'`.
8. Visit `/dashboard/login.html` to sign in; `/dashboard/index.html` requires auth.
