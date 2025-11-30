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
      ctx.fillStyle = "#b19cd9";  
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(card.dataset.id, canvas.width / 2, canvas.height / 2);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let scratching = false;

    // Prevent page scroll while scratching on mobile
    canvas.addEventListener("touchmove", e => {
      if (scratching) e.preventDefault();
    }, { passive: false });

    function start(e) {
      scratching = true;
      scratch(e);
    }

    function stop() {
      scratching = false;
      checkReveal();
    }

    function scratch(e) {
      if (!scratching) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", scratch, { passive: false });
    canvas.addEventListener("touchend", stop);

    function checkReveal() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) cleared++;
      }

      const percent = cleared / (pixels.length / 4);

      if (percent > 0.55) reveal(card, canvas, overlay);
    }
  });
});


// ---------------------------
// OPEN MODAL (POP-UP) ON REVEAL
// ---------------------------
function reveal(card, canvas, overlay) {
  canvas.style.transition = "opacity .4s ease";
  overlay.style.transition = "opacity .4s ease";

  canvas.style.opacity = 0;
  overlay.style.opacity = 0;
  canvas.style.pointerEvents = "none";

  setTimeout(() => openModal(card), 450);
}

// ---------------------------
// MODAL LOGIC
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
    ${[...hidden.querySelectorAll("a")]
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
