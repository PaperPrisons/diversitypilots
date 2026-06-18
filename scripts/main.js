function toggleAccordion(id) {
    var content = document.getElementById(id);
    var icon = document.getElementById('icon-' + id);
    if (!content || !icon) return;
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}
window.toggleAccordion = toggleAccordion;
