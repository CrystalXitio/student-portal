// Core application UI and interaction handlers
function toggleMenu() {
    var menu = document.getElementById("side-menu");
    var mainContent = document.getElementById("main-content");
    if (menu.style.width === "250px") {
        menu.style.width = "0";
        mainContent.style.marginLeft = "0";
    } else {
        menu.style.width = "250px";
        mainContent.style.marginLeft = "250px";
    }
}

function toggleDropdown(dropdownId) {
    var dropdown = document.getElementById(dropdownId);
    var allDropdowns = document.getElementsByClassName("dropdown-menu");
    for (var i = 0; i < allDropdowns.length; i++) {
        if (allDropdowns[i].id !== dropdownId) allDropdowns[i].style.display = "none";
    }
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
}

window.onclick = function(event) {
    if (!event.target.matches('.icon')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        for (var i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].style.display === 'block' && !dropdowns[i].contains(event.target)) {
                dropdowns[i].style.display = 'none';
            }
        }
    }
    if (event.target.matches('.modal-overlay')) closePasswordModal();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function openPasswordModal() {
    document.getElementById('password-modal').style.display = 'flex';
    document.getElementById('settings-dropdown').style.display = 'none';
}

function closePasswordModal() {
    document.getElementById('password-modal').style.display = 'none';
}