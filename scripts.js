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

document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('.scratch-canvas').forEach(canvas => {
    const door = canvas.parentElement;
    const number = door.querySelector('.door_number');
    const content = door.querySelector('.door-content');
    const ctx = canvas.getContext('2d');

    // Size canvas same as door
    const resize = () => {
      canvas.width = door.offsetWidth;
      canvas.height = door.offsetHeight;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#AFAFAF"; // foil color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    let scratching = false;
    const radius = 28;

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const percentScratched = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) clear++;
      }

      return clear / (data.length / 4);
    };

    const checkReveal = () => {
      if (percentScratched() > 0.5) {
        canvas.remove();            // remove foil
     if (number) number.remove();        // remove the door number
        door.classList.add('revealed');
      }
    };

    // TOUCH EVENTS
    canvas.addEventListener("touchstart", e => {
      scratching = true;
      const rect = canvas.getBoundingClientRect();
      scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      checkReveal();
    });

    canvas.addEventListener("touchmove", e => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      checkReveal();
    });

    canvas.addEventListener("touchend", () => scratching = false);

    // MOUSE EVENTS (desktop)
    canvas.addEventListener("mousedown", e => {
      scratching = true;
      const rect = canvas.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
      checkReveal();
    });

    canvas.addEventListener("mousemove", e => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      scratch(e.clientX - rect.left, e.clientY - rect.top);
      checkReveal();
    });

    canvas.addEventListener("mouseup", () => scratching = false);

  });

});