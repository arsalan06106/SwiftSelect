(function () {
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = document.querySelector(".sun-icon");
  const moonIcon = document.querySelector(".moon-icon");
  const body = document.body;
  const allButtons = document.querySelectorAll("button");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-theme");
      const isDark = body.classList.contains("dark-theme");
      if (sunIcon) sunIcon.style.display = isDark ? "none" : "block";
      if (moonIcon) moonIcon.style.display = isDark ? "block" : "none";
    });
  }

  allButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // JS triggers the fast compress
      this.classList.add("is-clicking");

      // And releases it quickly to allow the spring bezier to take over
      setTimeout(() => {
        this.classList.remove("is-clicking");
      }, 150);
    });
  });
})();
