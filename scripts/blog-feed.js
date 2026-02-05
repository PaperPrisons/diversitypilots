// scripts/blog-feed.js
// ESM module to load blog posts from Firestore after the blog component is injected.
// Listens for the 'blog:ready' event dispatched by scripts/main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgZXZlsj6phh-P8h2HMXYRX3yNH9-FQ90",
  authDomain: "diversitypilots-6eaa2.firebaseapp.com",
  projectId: "diversitypilots-6eaa2",
  storageBucket: "diversitypilots-6eaa2.firebasestorage.app",
  messagingSenderId: "755498707275",
  appId: "1:755498707275:web:b89b60443069dc428b60ce",
  measurementId: "G-KS4MYHE4ZD"
};

// Placeholder when image is missing or fails to load (double-quotes only so onerror works)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22260%22%20viewBox%3D%220%200%20400%20260%22%3E%3Crect%20fill%3D%22%23e5e7eb%22%20width%3D%22400%22%20height%3D%22260%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20image%3C%2Ftext%3E%3C%2Fsvg%3E";

let app;
let db;

function ensureFirebase() {
  if (!app) app = initializeApp(firebaseConfig);
  if (!db) db = getFirestore(app);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function populateBlogs() {
  try {
    ensureFirebase();
    const container = document.getElementById("blog-page-1");
    if (!container) return;

    let snapshot;
    try {
      // Preferred: newest first (requires createdAt to exist + correct type across docs)
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      snapshot = await getDocs(q);
    } catch (err) {
      // Fallback: still load posts even if ordering/index/field-type issues happen
      console.warn("[Blog Feed] ordered query failed, falling back to unordered read:", err);
      snapshot = await getDocs(collection(db, "blogs"));
    }

    // Clear any existing items
    container.innerHTML = "";

    snapshot.forEach((doc) => {
      const blog = doc.data() || {};
      const article = document.createElement("article");
      article.className = "bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full";

      const imgSrc = (blog.image && blog.image.trim()) ? blog.image.trim() : PLACEHOLDER_IMAGE;
      const title = blog.title || "Untitled";
      const titleEsc = escapeHtml(title);
      const date = blog.date || "";
      const summary = blog.summary || "";
      const social = blog.social || {};

      // Note: Destination pages are static under components/blogdetails/*.html.
      const slug = blog.slug;
      const href = slug ? `./components/blogdetails/${slug}.html` : "#";
      const dateDisplay = date ? `${date} – No Comments` : "No Comments";

      article.innerHTML = `
        <a href="${href}" class="block focus:outline-none focus:ring-2 focus:ring-[#8C1D40] focus:ring-inset flex-shrink-0" aria-label="Read blog">
          <div class="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
            <img src="${imgSrc}" alt="${titleEsc}" class="w-full h-full object-cover" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=this.dataset.fallback||'';" data-fallback="${PLACEHOLDER_IMAGE}" />
          </div>
        </a>
        <div class="p-6 flex-1 flex flex-col min-h-0">
          <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
            <a href="${href}" class="hover:text-[#8C1D40] transition">${titleEsc}</a>
          </h3>
          <p class="text-gray-500 text-sm mt-auto">${escapeHtml(dateDisplay)}</p>
          ${summary ? `<p class="text-gray-700 text-sm leading-relaxed mt-2">${escapeHtml(summary)}</p>` : ""}
          <div class="flex gap-3 text-sm mt-3">
            ${social.facebook ? `<a class="text-[#8C1D40] hover:underline" href="${social.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>` : ""}
            ${social.twitter ? `<a class="text-[#8C1D40] hover:underline" href="${social.twitter}" target="_blank" rel="noopener noreferrer">Twitter</a>` : ""}
            ${social.linkedin ? `<a class="text-[#8C1D40] hover:underline" href="${social.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ""}
            ${social.other ? `<a class="text-[#8C1D40] hover:underline" href="${social.other}" target="_blank" rel="noopener noreferrer">Link</a>` : ""}
          </div>
        </div>
        <div class="h-0.5 w-full bg-[#8C1D40]" aria-hidden="true"></div>
      `;

      container.appendChild(article);
    });

    if (snapshot.empty) {
      container.innerHTML = `<div class="col-span-full text-center text-gray-500">No blog posts found.</div>`;
    }
  } catch (err) {
    console.error("[Blog Feed] Failed to load blogs:", err);
    const container = document.getElementById("blog-page-1");
    if (container) {
      const msg = (err && (err.message || err.toString())) ? String(err.message || err.toString()) : "Unknown error";
      container.innerHTML = `
        <div class="col-span-full p-4 bg-red-50 text-red-700 rounded">
          We couldn't load blog posts. If you're seeing a 400 error, it's usually due to:
          <ul class="list-disc ml-6 mt-2">
            <li>Running from an unauthorized domain in Firebase (add your domain under Firebase Hosting/Authorized domains).</li>
            <li>Incorrect Firestore rules preventing reads.</li>
            <li>A malformed query or missing field (createdAt).</li>
          </ul>
          <div class="mt-3 text-sm">
            <div class="font-semibold">Debug:</div>
            <div class="font-mono text-xs whitespace-pre-wrap">${msg}</div>
          </div>
        </div>
      `;
    }
  }
}

// Run when blog section is ready
document.addEventListener("blog:ready", populateBlogs);

// In case the component was already loaded before this module, run once.
if (document.getElementById("blog-page-1")) {
  populateBlogs();
}
