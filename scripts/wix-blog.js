// scripts/wix-blog.js
// Loads blog posts from your Wix API and renders cards that link to your Wix site.
// Pagination: 12 cards per page.

const WIX_BLOG_API = "https://bhoomikaganapuram.wixsite.com/my-site-2/_functions/myBlogPosts";
const WIX_BLOG_BASE = "https://bhoomikaganapuram.wixsite.com/my-site-2/post";
const POSTS_PER_PAGE = 12;

// Placeholder when image is missing or fails to load (grey SVG; double-quotes only so onerror works)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22260%22%20viewBox%3D%220%200%20400%20260%22%3E%3Crect%20fill%3D%22%23e5e7eb%22%20width%3D%22400%22%20height%3D%22260%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20image%3C%2Ftext%3E%3C%2Fsvg%3E";

function getPostImageUrl(post) {
  const raw =
    post.coverImage ||
    post.mainImage ||
    post.featuredImage ||
    post.image ||
    post.thumbnail ||
    post.heroImage ||
    "";

  if (typeof raw === "string" && raw.startsWith("wix:image://")) {
    // Remove wix:image://v1/
    let mediaId = raw.replace("wix:image://v1/", "");

    // Extract just the hash_filename part (before any / or #)
    mediaId = mediaId.split("/")[0].split("#")[0];

    console.log(mediaId); // Should log: 45b1c4_5aded204dd414ef194df85ab08a73a74~mv2.png

    return `https://static.wixstatic.com/media/${mediaId}`;
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }

  if (raw && typeof raw === "object") {
    const u =
      raw.url ||
      raw.src ||
      raw.originalUrl ||
      raw.imageUrl ||
      "";
    if (typeof u === "string" && u.trim()) return u.trim();
  }

  return "";
}



function renderCard(post) {
  const postUrl = `${WIX_BLOG_BASE}/${post.slug || ""}`;
  const title = (post.title || "Untitled").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const imgUrl = getPostImageUrl(post) || PLACEHOLDER_IMAGE;
  const dateStr = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  return `
    <article class="overflow-hidden flex flex-col h-full flex-shrink-0 rounded-lg" style="background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-bottom: 3px solid #8C1D40;">
      <a href="${postUrl}" class="block focus:outline-none focus:ring-2 focus:ring-[#8C1D40] focus:ring-inset flex-shrink-0">
        <div class="w-full aspect-[16/10] overflow-hidden" style="background-color: #f3f4f6;">
          <img
            src="${imgUrl}"
            alt="${title}"
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null;this.src=this.dataset.fallback||'';"
            data-fallback="${PLACEHOLDER_IMAGE}"
          />
        </div>
      </a>
      <div class="p-6 flex-1 flex flex-col min-h-0">
        <h3 class="text-xl font-bold mb-2 leading-snug" style="color: #111827; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          <a href="${postUrl}" class="hover:opacity-80 transition" style="color: inherit;">${title}</a>
        </h3>
        <p class="text-base mt-auto" style="color: #6b7280;">${dateStr}</p>
      </div>
    </article>
  `;
}

function renderPagination(currentPage, totalPages, onPageChange) {
  const paginationEl = document.getElementById("blog-pagination");
  if (!paginationEl || totalPages <= 1) {
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }

  let html = "";
  if (currentPage > 1) {
    html += `<button type="button" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-medium transition" data-pagination-prev aria-label="Previous page">← Previous</button>`;
  }
  html += `<span class="px-4 py-2 text-gray-600">Page ${currentPage} of ${totalPages}</span>`;
  if (currentPage < totalPages) {
    html += `<button type="button" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-medium transition" data-pagination-next aria-label="Next page">Next →</button>`;
  }

  paginationEl.innerHTML = html;

  const prevBtn = paginationEl.querySelector("[data-pagination-prev]");
  const nextBtn = paginationEl.querySelector("[data-pagination-next]");
  if (prevBtn) prevBtn.addEventListener("click", () => onPageChange(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => onPageChange(currentPage + 1));
}

async function loadWixBlog() {
  const container = document.getElementById("blog-page-1");
  if (!container) {
    console.error("[Wix Blog] #blog-page-1 not found");
    return;
  }

  const showError = (msg) => {
    container.innerHTML = '<p class="col-span-full text-center text-red-500">' + msg + "</p>";
    const paginationEl = document.getElementById("blog-pagination");
    if (paginationEl) paginationEl.innerHTML = "";
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(WIX_BLOG_API, {
      signal: controller.signal,
      mode: "cors",
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("API returned " + response.status);
    const data = await response.json();

    const allItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

    if (allItems.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-500">No posts yet.</p>';
      return;
    }

    const totalPages = Math.ceil(allItems.length / POSTS_PER_PAGE);
    let currentPage = 1;

    function showPage(page) {
      currentPage = Math.max(1, Math.min(page, totalPages));
      const start = (currentPage - 1) * POSTS_PER_PAGE;
      const end = start + POSTS_PER_PAGE;
      const pageItems = allItems.slice(start, end);

      container.innerHTML = pageItems.map(renderCard).join("");
      renderPagination(currentPage, totalPages, showPage);

      container.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    showPage(1);
  } catch (error) {
    console.error("Error loading Wix blog:", error);
    if (error.name === "AbortError") {
      showError("Request timed out. The blog server may be slow or unreachable.");
    } else if (error.message && error.message.includes("Failed to fetch")) {
      showError("Could not reach the blog (often CORS or network). Try from the same domain as the API or check the console.");
    } else {
      showError("Failed to load blog posts: " + (error.message || String(error)));
    }
  }
}

window.loadWixBlog = loadWixBlog;
