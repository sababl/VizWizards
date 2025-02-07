function toggleDropdown(sectionId) {
    const dropdown = document.getElementById(sectionId);
    
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        // Close other submenus under the same parent
        const allDropdowns = dropdown.parentElement.querySelectorAll('.dropdown-content');
        allDropdowns.forEach(menu => {
            if (menu.id !== sectionId) {
                menu.style.display = 'none';
            }
        });

        dropdown.style.display = 'block';
    }
}
