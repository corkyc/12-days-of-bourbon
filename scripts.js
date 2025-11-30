// ---------------------------
// HAMBURGER MENU
// ---------------------------
const hamburger = document.getElementById("hamburger");
const nav = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  nav.classList.toggle("open");
});


// ---------------------------
// SCRATCH-OFF FUNCTION
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".whiskey-card");

  cards.forEach(card => {
    const canvas = card.querySelector(".scratch-canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const overlay = card.querySelector(".scratch-overlay");

    function resizeCanvas() {
      canvas.width = card.clientWidth;
      canvas.height = card.clientHeight;
      drawCover();
    }

    function drawCover() {
      ctx.fillStyle = "#b19cd9";  // purple/silver scratch surface
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.dataset.id, canvas.width / 2, canvas.height / 2);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let scratching = false;

    // Mobile: prevent scrolling while scratching
    function preventScroll(e) {
      if (scratching) e.preventDefault();
    }
    canvas.addEventListener("touchmove", preventScroll, { passive: false });

    // Start scratching
    function start(e) {
      scratching = true;
      scratch(e);
    }

    // Stop scratching
    function stop() {
      scratching = false;
      checkReveal();
    }

    // Scratch logic
    function scratch(e) {
      if (!scratching) return;

      const rect = canvas.getBoundingClientRect();
      const x =
        (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y =
        (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Events
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", scratch, { passive: false });
    canvas.addEventListener("touchend", stop);

    // Reveal when 60% scratched
    function checkReveal() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) cleared++;
      }

      const percent = cleared / (pixels.length / 4);

      if (percent > 0.60) reveal(card, canvas, overlay);
    }
  });
});


// ---------------------------
// OPEN MODAL ON REVEAL
// ---------------------------

function reveal(card, canvas, overlay) {
  canvas.style.opacity = 0;
  overlay.style.opacity = 0;
  canvas.style.pointerEvents = "none";

  setTimeout(() => openModal(card), 300);
}


// ---------------------------
// MODAL BEHAVIOR
// ---------------------------
const modal = document.getElementById("whiskeyModal");
const modalBody = document.getElementById("modal-body");
const closeBtn = document.querySelector(".close-button");

function openModal(card) {
  const hidden = card.querySelector(".hidden-modal-data");

  modalBody.innerHTML = `
    <img src="${hidden.querySelector("img").src}" class="modal-image">
    <h3>${hidden.querySelector("h3").textContent}</h3>
    <p>${hidden.querySelector("p").textContent}</p>
    ${hidden.querySelectorAll("a")
      .map(a => `<a href="${a.href}" class="btn">${a.textContent}</a>`)
      .join("")}
  `;

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

closeBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
