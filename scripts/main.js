// scripts/main.js

async function loadComponent(id, file) {
    try {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Element with id "${id}" not found`);
            return;
        }

        // Try to fetch the component
        const res = await fetch(file);
        if (!res.ok) {
            throw new Error(`Failed to load ${file}: ${res.status} ${res.statusText}`);
        }
        
        const html = await res.text();
        el.innerHTML = html;

        // Initialize components after they are injected
        if (id === "navbar") {
            initNavbar();
        } else if (id === "blog") {
            initBlogPagination();
        }
    } catch (error) {
        console.error(`Error loading component ${id} from ${file}:`, error);
        // Don't break the page if a component fails to load
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
    
    // Fix navbar links based on current page location
    const currentPath = window.location.pathname;
    
    // Remove GitHub Pages base path if present (e.g., /diversitypilots/)
    const pathParts = currentPath.split('/').filter(p => p);
    const repoName = pathParts[0]; // First part might be repo name
    
    // Check if we're in blogdetails
    const blogDetailsIndex = pathParts.indexOf('components');
    const isBlogDetails = blogDetailsIndex !== -1 && pathParts[blogDetailsIndex + 1] === 'blogdetails';
    const isComponents = pathParts.includes('components') && !isBlogDetails;
    
    // Calculate base path relative to root
    let basePath = '';
    if (isBlogDetails) {
        basePath = '../../';
    } else if (isComponents) {
        basePath = '../';
    } else {
        // For root pages, check if we need to account for repo name
        if (repoName && repoName !== 'index.html' && !repoName.endsWith('.html')) {
            basePath = './';
        } else {
            basePath = './';
        }
    }
    
    // Update all navbar links
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
        const targetFile = link.getAttribute('data-nav-link');
        link.setAttribute('href', basePath + targetFile);
    });
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
   BLOG PAGINATION LOGIC
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

    // Initialize on page 1
    showPage(1);
}

// Load components only if we're on a page that needs them
// This prevents errors on pages that load components manually
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-load if the elements exist and haven't been loaded yet
    if (document.getElementById("navbar") && !document.getElementById("navbar").innerHTML.trim()) {
        loadComponent("navbar", "./components/navbar.html");
    }
    if (document.getElementById("blog") && !document.getElementById("blog").innerHTML.trim()) {
        loadComponent("blog", "./components/blogsection.html");
    }
    if (document.getElementById("footer") && !document.getElementById("footer").innerHTML.trim()) {
        loadComponent("footer", "./components/footer.html");
    }
});
