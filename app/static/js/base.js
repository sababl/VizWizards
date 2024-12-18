function toggleDropdown(sectionId) {
    const dropdown = document.getElementById(sectionId);
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
}
