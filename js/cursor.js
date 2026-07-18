(function () {
        const cursor = document.createElement("div");
        cursor.id = "point-cursor-container";
        cursor.innerHTML = `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="cursor-outer" cx="50" cy="50" r="25"></circle>
      <path class="cursor-tick" d="M50 9V22M50 78V91M9 50H22M78 50H91"></path>
      <path class="cursor-inner" d="M50 31L59 41L69 50L59 59L50 69L41 59L31 50L41 41Z"></path>
    </svg>
  `;
        document.body.appendChild(cursor);

        document.addEventListener("mousemove", function (e) {
          cursor.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 12}px)`;

          const interactive = e.target.closest(
            'a, button, input, select, textarea, summary, details, [onclick], [role="button"], [tabindex]:not([tabindex="-1"])',
          );

          cursor.classList.toggle("is-interactive", !!interactive);
        });

        document.addEventListener("mouseleave", function () {
          cursor.style.opacity = "0";
        });

        document.addEventListener("mouseenter", function () {
          cursor.style.opacity = "1";
        });
      })();
