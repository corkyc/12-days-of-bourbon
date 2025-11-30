document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".whiskey-card");

  cards.forEach((card) => {
    const canvas = card.querySelector(".scratch-canvas");
    const overlay = card.querySelector(".scratch-overlay");
    const hiddenData = card.querySelector(".hidden-modal-data");

    if (!canvas || !overlay || !hiddenData) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    let isDrawing = false;
    let totalPixels = 0;
    let clearedPixels = 0;
    let scratchComplete = false;

    // INIT SCRATCH LAYER
    function setupCanvas() {
      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.fillStyle = "#bfbfbf";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      totalPixels = canvas.width * canvas.height;
      clearedPixels = 0;
      scratchComplete = false;
    }

    setupCanvas();

    // SCRATCH FUNCTION
    function scratch(x, y) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      clearedPixels += 22 * 22;
      checkReveal();
    }

    // CHECK IF 40% IS REMOVED
    function checkReveal() {
      if (!scratchComplete && clearedPixels > totalPixels * 0.4) {
        scratchComplete = true;
        revealCard();
      }
    }

    // REMOVE CANVAS + OVERLAY + OPEN MODAL
    function revealCard() {
      overlay.style.display = "none";
      canvas.style.display = "none";

      const modalBody = document.getElementById("modal-body");
      const modal = document.getElementById("whiskeyModal");

      if (modalBody && modal) {
        modalBody.innerHTML = hiddenData.innerHTML;
        modal.setAttribute("aria-hidden", "false");
        modal.classList.add("show");
      }
    }

    // MOUSE EVENTS
    canvas.addEventListener("mousedown", () => (isDrawing = true));
    canvas.addEventListener("mouseup", () => (isDrawing = false));
    canvas.addEventListener("mousemove", (e) => {
      if (isDrawing) {
        scratch(e.offsetX, e.offsetY);
      }
    });

    // TOUCH EVENTS
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      isDrawing = true;
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      scratch(x, y);
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!isDrawing) return;

      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      scratch(x, y);
    });

    canvas.addEventListener("touchend", () => (isDrawing = false));
  });

  // CLOSE MODAL
  document.querySelectorAll(".close-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById("whiskeyModal");
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    });
  });
});
