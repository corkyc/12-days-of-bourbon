document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".whiskey-card");

  cards.forEach(card => {
    const canvas = card.querySelector(".scratch-canvas");
    const overlay = card.querySelector(".scratch-overlay");
    const content = card.querySelector(".hidden-modal-data");

    const ctx = canvas.getContext("2d");

    // Resize canvas to match card
    function resize() {
      canvas.width = card.clientWidth;
      canvas.height = card.clientHeight;
      ctx.fillStyle = "#bfbfbf";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    let scratching = false;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    };

    const start = (e) => { scratching = true; scratch(e); };
    const end = () => { scratching = false; checkReveal(); };

    const scratch = (e) => {
      if (!scratching) return;
      const { x, y } = getPos(e);

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    };

    const checkReveal = () => {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let total = pixels.data.length / 4;
      let cleared = 0;

      for (let i = 3; i < pixels.data.length; i += 4) {
        if (pixels.data[i] === 0) cleared++;
      }

      if (cleared / total > 0.4) revealCard();
    };

    function revealCard() {
      overlay.style.display = "none";
      canvas.style.display = "none";

      content.style.display = "block"; // show whiskey inside the card

      card.classList.add("revealed");

      // Enable click-to-open-modal
      card.addEventListener("click", () => {
        if (card.classList.contains("revealed")) {
          openModal(content.innerHTML);
        }
      }, { once: false });
    }

    // Event listeners
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", scratch);
    document.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", scratch);
    document.addEventListener("touchend", end);
  });

  /* Modal Controls */
  const modal = document.getElementById("whiskeyModal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-button");

  function openModal(html) {
    modalBody.innerHTML = html;
    modal.setAttribute("aria-hidden", "false");
  }

  closeBtn.addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.setAttribute("aria-hidden", "true");
  });
});
