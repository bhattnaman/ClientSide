var menuIcon = document.querySelector(".menu");
var sidebar = document.querySelector(".sidebar");

/**
 * Function to toggle the sidebar
 * @param {void}
 * @return {void}
 * 
 */
menuIcon.onclick = function() {
    sidebar.classList.toggle("small-sidebar");
}