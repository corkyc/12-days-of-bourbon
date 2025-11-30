document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------------------
     MOBILE HAMBURGER MENU
  --------------------------------------------------- */
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav-links");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }

  /* ---------------------------------------------------
     MODAL SYSTEM
  --------------------------------------------------- */
  const modal = document.getElementById("whiskeyModal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-button");

  function openModal(html) {
    modalBody.innerHTML = html;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  closeBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  /* ---------------------------------------------------
     SCRATCH LOGIC FOR EACH WHISKEY CARD
  --------------------------------------------------- */
  const cards = document.querySelectorAll(".whiskey-card");
  const DPR = window.devicePixelRatio || 1;

  cards.forEach((card) => {
    const canvas = card.querySelector(".scratch-canvas");
    const overlay = card.querySelector(".scratch-overlay");
    const hiddenData = card.querySelector(".hidden-modal-data");

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let isDrawing = false;
    let lastPoint = null;
    let revealed = false;

    /* ---------------------------
       SETUP CANVAS
    --------------------------- */
    function resizeCanvas() {
      const w = card.offsetWidth;
      const h = card.offsetHeight;

      canvas.width = w * DPR;
      canvas.height = h * DPR;

      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      ctx.scale(DPR, DPR);

      ctx.fillStyle = "#C0C0C0";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "destination-out";
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    /* ---------------------------
       SCRATCH UTILS
    --------------------------- */
    function getPosition(e) {
      const rect = canvas.getBoundingClientRect();
      let x, y;

      if (e.touches) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      return { x, y };
    }

    function scratch(point) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    function scratchLine(start, end) {
      const dist = Math.hypot(end.x - start.x, end.y - start.y);
      const steps = Math.ceil(dist / 6);

      for (let i = 0; i < steps; i++) {
        const x = start.x + (end.x - start.x) * (i / steps);
        const y = start.y + (end.y - start.y) * (i / steps);
        scratch({ x, y });
      }
    }

    function checkReveal() {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imgData.data;
      let cleared = 0;

      // sample every 20px for speed
      for (let i = 3; i < pixels.length; i += 80) {
        if (pixels[i] === 0) cleared++;
      }

      const percent = cleared / (pixels.length / 80);

      if (percent > 0.45 && !revealed) revealCard();
    }

    /* ---------------------------
       REVEAL CARD + OPEN MODAL
    --------------------------- */
    function revealCard() {
      revealed = true;

      overlay.style.opacity = 0;
      overlay.style.pointerEvents = "none";

      canvas.style.opacity = 0;
      canvas.style.pointerEvents = "none";

      setTimeout(() => {
        openModal(hiddenData.innerHTML);
      }, 350);
    }

    /* ---------------------------
       POINTER EVENTS
    --------------------------- */
    canvas.addEventListener("pointerdown", (e) => {
      if (revealed) return;
      isDrawing = true;
      lastPoint = getPosition(e);
      scratch(lastPoint);
      e.preventDefault();
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDrawing || revealed) return;
      const pos = getPosition(e);
      scratchLine(lastPoint, pos);
      lastPoint = pos;
      checkReveal();
      e.preventDefault();
    });

    window.addEventListener("pointerup", () => (isDrawing = false));
    window.addEventListener("pointercancel", () => (isDrawing = false));

  }); // end cards loop

});
