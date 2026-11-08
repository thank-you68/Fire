/* footer.js - keeps the copyright year in the footer current. */
(function () {
  var y = document.getElementById('footer-year');
  if (y) y.textContent = new Date().getFullYear();
})();
