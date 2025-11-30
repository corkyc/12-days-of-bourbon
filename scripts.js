document.addEventListener("DOMContentLoaded", () => {

  /* -----------------------
      MOBILE NAVIGATION
  ------------------------*/
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.querySelector(".nav-links");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  /* -----------------------
      MODAL LOGIC
  ------------------------*/
  const modal = document.getElementById("whiskeyModal");
  const modalBody = document.getElementById("modal-body");
  const closeButton = document.querySelector(".close-button");

  function showModal(html) {
    modalBody.innerHTML = html;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  if (closeButton) closeButton.addEventListener("click", hideModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  /* -----------------------
      SCRATCH CARDS
  ------------------------*/
  const DPR = window.devicePixelRatio || 1;
  const doors = document.querySelectorAll(".door");

  doors.forEach((door) => {
    const canvas = door.querySelector(".scratch-canvas");
    const numberEl = door.querySelector(".door_number");
    const hidden = door.querySelector(".door-hidden-content");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let drawing = false;
    let pointerDown = false;
    let lastPt = null;

    /* Force canvas ON TOP */
    canvas.style.zIndex = "999";

    /* Force scratch enabling on mobile Safari */
    canvas.style.touchAction = "none";

    /* -----------------------
        SETUP CANVAS
    ------------------------*/
    function setupCanvas() {
      const width = door.offsetWidth;
      const height = door.offsetHeight;

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      canvas.width = width * DPR;
      canvas.height = height * DPR;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "destination-out";
    }

    function brushSize() {
      return Math.max(16, Math.min(60, door.offsetWidth * 0.1));
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    }

    function erase(pt) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushSize(), 0, Math.PI * 2);
      ctx.fill();
    }

    function draw(pt) {
      if (!lastPt) {
        erase(pt);
        lastPt = pt;
        return;
      }

      const dx = pt.x - lastPt.x;
      const dy = pt.y - lastPt.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.ceil(dist / 4);

      for (let i = 0; i < steps; i++) {
        erase({
          x: lastPt.x + (dx * i) / steps,
          y: lastPt.y + (dy * i) / steps,
        });
      }

      lastPt = pt;
    }

    function checkReveal() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      let total = 0;

      for (let i = 3; i < pixels.length; i += 40) {
        total++;
        if (pixels[i] === 0) clear++;
      }

      if (clear / total > 0.45) reveal();
    }

    function reveal() {
      canvas.style.display = "none";
      numberEl.style.display = "none";
      door.classList.add("revealed");
      hidden.style.opacity = 1;
    }

    /* -----------------------
        POINTER + TOUCH
    ------------------------*/

    function start(e) {
      pointerDown = true;
      drawing = true;
      lastPt = null;
      draw(getPos(e));
      e.preventDefault();
    }

    function move(e) {
      if (!drawing) return;
      draw(getPos(e));
      e.preventDefault();
    }

    function end() {
      if (!pointerDown) return;
      pointerDown = false;
      drawing = false;
      lastPt = null;
      setTimeout(checkReveal, 100);
    }

    /* Use Pointer Events where possible */
    if (window.PointerEvent) {
      canvas.addEventListener("pointerdown", start, { passive: false });
      canvas.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", end, { passive: false });
    } else {
      canvas.addEventListener("mousedown", start, { passive: false });
      window.addEventListener("mousemove", move, { passive: false });
      window.addEventListener("mouseup", end, { passive: false });

      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end, { passive: false });
    }

    /* Allow scrolling when not scratching */
    canvas.addEventListener(
      "touchmove",
      (e) => {
        if (pointerDown) e.preventDefault();
      },
      { passive: false }
    );

    /* -----------------------
        MODAL CLICK
    ------------------------*/
    door.addEventListener("click", () => {
      if (!door.classList.contains("revealed")) return;
      if (pointerDown) return;
      showModal(hidden.innerHTML);
    });

    /* Initialize */
    setupCanvas();

    /* Resize handler */
    window.addEventListener("resize", () => {
      if (!door.classList.contains("revealed")) setupCanvas();
    });
  });
});
