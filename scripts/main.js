// scripts/main.js

async function loadComponent(id, file) {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
    const html = await res.text();
    const el = document.getElementById(id);

    if (!el) return;
    el.innerHTML = html;

    // Initialize components after they are injected
    if (id === "navbar") {
        initNavbar();
    } else if (id === "blog") {
        const container = document.getElementById("blog-page-1");
        if (container && typeof window.loadWixBlog === "function") {
            window.loadWixBlog();
        } else if (!container) {
            console.error("[Blog] #blog-page-1 not found after injecting blog section");
        }
    } else if (id === "footer") {
        initFooter();
    }
}

function initFooter() {
   
    const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);
    const isPaperPrisons = /paperprisons\.org$/i.test(window.location.hostname);
    if (isLocal || !isPaperPrisons) {
        const recaptchaContainer = document.querySelector(".g-recaptcha");
        if (recaptchaContainer) recaptchaContainer.remove();
        const recaptchaScript = document.querySelector('script[src*="google.com/recaptcha"]');
        if (recaptchaScript) recaptchaScript.remove();
    }
}

function initNavbar() {
    const btn = document.getElementById("menu-btn");
    const menu = document.getElementById("mobile-menu");
    
    if (btn && menu) {
        btn.addEventListener("click", () => {
            menu.classList.toggle("hidden");
        });
    }
    
    const currentPath = window.location.pathname;
    const isBlogDetails = currentPath.includes('/components/blogdetails/');
    const isDashboard = currentPath.includes('/dashboard/');
    const isComponents = currentPath.includes('/components/') && !isBlogDetails;
    
    // Calculate base path
    let basePath = '';
    if (isBlogDetails) {
        basePath = '../../';
    } else if (isDashboard || isComponents) {
        basePath = '../';
    } else {
        basePath = './';
    }
    
    // Update all navbar links
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
        const targetFile = link.getAttribute('data-nav-link');
        link.setAttribute('href', basePath + targetFile);
    });

    // Fix logo image path for subpages (dashboard, blog details, etc.)
    const logoImg = document.querySelector('[data-nav-logo]');
    if (logoImg) {
        const logoPath = logoImg.getAttribute('data-nav-logo');
        logoImg.setAttribute('src', basePath + logoPath);
    }
}

// Accordion toggle function for diary page
function toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById("icon-" + id);

    if (!content || !icon) return;
    
    if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        icon.style.transform = "rotate(180deg)";
    } else {
        content.classList.add("hidden");
        icon.style.transform = "rotate(0deg)";
    }
}

// Make toggleAccordion available globally
window.toggleAccordion = toggleAccordion;

/* -------------------------
   WIX BLOG: loaded from scripts/wix-blog.js (API + links to your Wix site)
   ------------------------- */

/* -------------------------
   BLOG PAGINATION LOGIC (legacy, for multi-page blog UI)
   ------------------------- */

function initBlogPagination() {
    const blogRoot = document.getElementById("blog");
    if (!blogRoot) return;

    const pages = blogRoot.querySelectorAll("[data-blog-page]");
    if (!pages.length) return;

    const prevBtn = blogRoot.querySelector("[data-pagination-prev]");
    const nextBtn = blogRoot.querySelector("[data-pagination-next]");
    const pageBtns = blogRoot.querySelectorAll("[data-pagination-page]");

    let currentPage = 1;
    const totalPages = pages.length;

    function showPage(page) {
        currentPage = page;

        pages.forEach((p) => {
            const pageNum = Number(p.dataset.blogPage);
            if (pageNum === page) {
                p.classList.remove("hidden");
            } else {
                p.classList.add("hidden");
            }
        });

        updateButtons();
    }

    function updateButtons() {
        // Page number buttons
        pageBtns.forEach((btn) => {
            const page = Number(btn.dataset.paginationPage);
            if (page === currentPage) {
                // Active
                btn.classList.add("bg-[#8C1D40]", "text-white", "font-bold");
                btn.classList.remove("bg-gray-200");
            } else {
                // Inactive
                btn.classList.remove("bg-[#8C1D40]", "text-white", "font-bold");
                btn.classList.add("bg-gray-200");
            }
        });

        // Prev button
        if (prevBtn) {
            if (currentPage === 1) {
                prevBtn.disabled = true;
                prevBtn.classList.add("cursor-not-allowed", "opacity-60");
            } else {
                prevBtn.disabled = false;
                prevBtn.classList.remove("cursor-not-allowed", "opacity-60");
            }
        }

        // Next button
        if (nextBtn) {
            if (currentPage === totalPages) {
                nextBtn.disabled = true;
                nextBtn.classList.add("cursor-not-allowed", "opacity-60");
            } else {
                nextBtn.disabled = false;
                nextBtn.classList.remove("cursor-not-allowed", "opacity-60");
            }
        }
    }

    // Page button clicks
    pageBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const page = Number(btn.dataset.paginationPage);
            if (page !== currentPage) {
                showPage(page);
            }
        });
    });

    // Prev / Next clicks
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) showPage(currentPage - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) showPage(currentPage + 1);
        });
    }


    showPage(1);
}

function isBlogPage() {
    var path = window.location.pathname || "";
    return /blog\.html$/.test(path) || /\/blog\/?$/.test(path.replace(/\/$/, ""));
}

function isDiaryPage() {
    var path = window.location.pathname || "";
    return /diary\.html$/.test(path) || /diary2\.html$/.test(path) || /\/diary\/?$/.test(path.replace(/\/$/, ""));
}

function isConferencePage() {
    var path = window.location.pathname || "";
    return /conference\.html$/.test(path) || /\/conference\/?$/.test(path.replace(/\/$/, ""));
}

function is404Page() {
    var path = window.location.pathname || "";
    return /404\.html$/.test(path) || /\/404\/?$/.test(path.replace(/\/$/, ""));
}

/** List of pathnames that are valid pages. Any other path should show 404. */
function isAllowedPath(pathname) {
    var p = (pathname || "").replace(/\/$/, "") || "/";
    if (p === "/" || p === "/index.html") return true;
    if (["/blog.html", "/team.html", "/diary.html", "/diary2.html", "/conference.html", "/admin.html", "/404.html"].indexOf(p) !== -1) return true;
    if (p === "/dashboard" || p === "/dashboard/" || p === "/dashboard/index.html" || p === "/dashboard/login.html") return true;
    if (/^\/components\/blogdetails\/[^/]+\.html$/.test(p)) return true;
    return false;
}

/** Relative URL to 404.html from the current path (for redirect). */
function get404RedirectUrl() {
    var pathname = window.location.pathname || "";
    var segments = pathname.split("/").filter(Boolean);
    var base = segments.length > 1 ? "../".repeat(segments.length - 1) : "./";
    return base + "404.html";
}

// Load components: on blog.html the blog layout is inlined, so we only run loadWixBlog().
// On diary pages we only load navbar and footer (no blog section).
// On conference page we load the conference section.
(async function init() {
    // If user landed on a wrong/unknown URL, show 404 (don’t run on 404 page itself to avoid loop)
    if (!is404Page() && !isAllowedPath(window.location.pathname)) {
        window.location.replace(get404RedirectUrl());
        return;
    }

    await loadComponent("navbar", "./components/navbar.html");
    if (is404Page()) {
        // 404 page: only navbar and footer (loaded below).
    } else if (isBlogPage()) {
        // Blog layout is already in blog.html; just load posts.
        var container = document.getElementById("blog-page-1");
        if (container && typeof window.loadWixBlog === "function") {
            window.loadWixBlog();
        }
    } else if (isConferencePage()) {
        await loadComponent("conference", "./components/conferencesection.html");
    } else if (!isDiaryPage()) {
        await loadComponent("blog", "./components/blogsection.html");
    }
    await loadComponent("footer", "./components/footer.html");
})();
