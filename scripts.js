document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".whiskey-card");

  cards.forEach(card => {
    const canvas = card.querySelector(".scratch-canvas");
    const overlay = card.querySelector(".scratch-overlay");
    const hiddenData = card.querySelector(".hidden-modal-data");
    const ctx = canvas.getContext("2d");

    // Make canvas match card size
    const resizeCanvas = () => {
      canvas.width = card.clientWidth;
      canvas.height = card.clientHeight;

      // Fill with gray scratch coat
      ctx.fillStyle = "#bfbfbf";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let isScratching = false;

    const startScratch = (e) => {
      isScratching = true;
      scratch(e);
    };

    const endScratch = () => {
      isScratching = false;
      checkReveal();
    };

    const scratch = (e) => {
      if (!isScratching) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    };

    // Check if scratched area is > 50%
    const checkReveal = () => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let total = imgData.data.length / 4;
      let cleared = 0;

      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] === 0) cleared++;
      }

      if (cleared / total > 0.4) {
        revealCard(card, canvas, overlay, hiddenData);
      }
    };

    // Event listeners
    canvas.addEventListener("mousedown", startScratch);
    canvas.addEventListener("mousemove", scratch);
    document.addEventListener("mouseup", endScratch);

    canvas.addEventListener("touchstart", startScratch);
    canvas.addEventListener("touchmove", scratch);
    document.addEventListener("touchend", endScratch);
  });
});

function revealCard(card, canvas, overlay, hiddenData) {
  overlay.style.display = "none";

  // Remove the gray scratch canvas completely
  canvas.style.display = "none";

  // Reveal modal
  openModal(hiddenData);
}

/* ---------- Modal ---------- */

function openModal(content) {
  let modal = document.getElementById("scratchModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "scratchModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.7)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.padding = "20px";
    modal.style.zIndex = "9999";
    modal.innerHTML = `
      <div id="scratchModalContent"
           style="background:white; border-radius:12px; padding:20px; max-width:420px; width:100%;">
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  const modalContent = document.getElementById("scratchModalContent");
  modalContent.innerHTML = content.innerHTML;
  modal.style.display = "flex";
}
