// scripts/wix-blog.js
// Loads blog posts from your Wix API and renders cards that link to your Wix site.

const WIX_BLOG_API = "https://bhoomikaganapuram.wixsite.com/my-site-2/_functions/myBlogPosts";
const WIX_BLOG_BASE = "https://bhoomikaganapuram.wixsite.com/my-site-2/post";

// Placeholder when image is missing or fails to load (grey SVG; double-quotes only so onerror works)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22260%22%20viewBox%3D%220%200%20400%20260%22%3E%3Crect%20fill%3D%22%23e5e7eb%22%20width%3D%22400%22%20height%3D%22260%22%2F%3E%3Ctext%20fill%3D%22%239ca3af%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20image%3C%2Ftext%3E%3C%2Fsvg%3E";

function getPostImageUrl(post) {
  const url = post.coverImage || post.mainImage || post.featuredImage || post.image || "";
  return typeof url === "string" && url.trim() ? url.trim() : "";
}

async function loadWixBlog() {
  const container = document.getElementById("blog-page-1");
  if (!container) {
    console.error("[Wix Blog] #blog-page-1 not found");
    return;
  }

  const showError = (msg) => {
    container.innerHTML = '<p class="col-span-full text-center text-red-500">' + msg + "</p>";
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

    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-500">No posts yet.</p>';
      return;
    }

    items.forEach((post) => {
      const postUrl = `${WIX_BLOG_BASE}/${post.slug || ""}`;
      const title = (post.title || "Untitled").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const imgUrl = getPostImageUrl(post) || PLACEHOLDER_IMAGE;
      const dateStr = post.publishedDate
        ? new Date(post.publishedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";
      const card = `
        <article class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full">
          <a href="${postUrl}" class="block focus:outline-none focus:ring-2 focus:ring-[#8C1D40] focus:ring-inset flex-shrink-0">
            <div class="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
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
            <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
              <a href="${postUrl}" class="hover:text-[#8C1D40] transition">${title}</a>
            </h3>
            <p class="text-gray-500 text-sm mt-auto">${dateStr}${dateStr ? " – " : ""}No Comments</p>
          </div>
          <div class="h-0.5 w-full bg-[#8C1D40] flex-shrink-0" aria-hidden="true"></div>
        </article>
      `;
      container.innerHTML += card;
    });
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
