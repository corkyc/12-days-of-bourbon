// Hamburger Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Door opening + number hiding
document.querySelectorAll('.door').forEach(door => {
  door.addEventListener('click', () => {
    door.classList.toggle('open');
    door.classList.toggle('number-hidden');
  });
});

// SCRATCH-OFF FUNCTION
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('.scratch-canvas').forEach(canvas => {
    const door = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    // Resize canvas to match its door
    const resizeCanvas = () => {
      canvas.width = door.offsetWidth;
      canvas.height = door.offsetHeight;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#AFAFAF"; // Gray scratch layer
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let scratching = false;

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    };

    // TOUCH
    canvas.addEventListener("touchstart", e => {
      scratching = true;
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      scratch(t.clientX - rect.left, t.clientY - rect.top);
    });

    canvas.addEventListener("touchmove", e => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      scratch(t.clientX - rect.left, t.clientY - rect.top);
    });

    canvas.addEventListener("touchend", () => scratching = false);

    // MOUSE (optional for desktop)
    canvas.addEventListener("mousedown", e => {
      scratching = true;
      const rect = canvas.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener("mousemove", e => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener("mouseup", () => scratching = false);
  });

});