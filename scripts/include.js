function htmlInclude(id, file) {
    return fetch(file)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var el = document.getElementById(id);
            if (el) el.outerHTML = html;
        });
}

function initHeader(title, basePath) {
    basePath = basePath || './';
    document.getElementById('page-title').textContent = title;
    if (basePath !== './') {
        document.querySelectorAll('header a[href]').forEach(function(a) {
            a.href = a.getAttribute('href').replace('./', basePath);
        });
        var logo = document.querySelector('header img');
        if (logo) logo.src = logo.getAttribute('src').replace('./', basePath);
    }
    document.getElementById('menu-btn').addEventListener('click', function() {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
}
