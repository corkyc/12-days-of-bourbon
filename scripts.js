document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. HAMBURGER MENU LOGIC ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- 2. MODAL VARIABLES ---
    const modal = document.getElementById("whiskeyModal");
    const modalBody = document.getElementById("modal-body");
    const closeBtn = document.querySelector(".close-button");

    // --- 3. SETUP SCRATCH CANVASES ---
    const doors = document.querySelectorAll('.door');

    doors.forEach(door => {
        const canvas = door.querySelector('.scratch-canvas');
        const number = door.querySelector('.door_number');
        
        // If canvas is missing (e.g. on an already revealed door), skip logic
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        // Set Canvas Size & Fill
        const resizeCanvas = () => {
            canvas.width = door.offsetWidth;
            canvas.height = door.offsetHeight;
            ctx.fillStyle = "#C0C0C0"; // Silver Foil
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        resizeCanvas();

        // --- SCRATCH HELPERS ---
        const getBrushPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const scratch = (e) => {
            if (!isDrawing) return;
            // Prevent scrolling on mobile only if touching the canvas
            if(e.type.startsWith('touch')) e.preventDefault();

            const pos = getBrushPos(e);
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
            ctx.fill();
        };

        const checkPercent = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let transparentPixels = 0;
            // Check every 4th pixel
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] === 0) transparentPixels++;
            }
            
            // If > 40% scratched, reveal fully
            if ((transparentPixels / (pixels.length / 4)) > 0.4) {
                revealDoor();
            }
        };

        const revealDoor = () => {
            canvas.style.display = 'none'; 
            if(number) number.style.display = 'none'; 
            door.classList.add('revealed'); 
        };

        // --- EVENTS ---
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
        canvas.addEventListener('mousemove', (e) => { scratch(e); });
        canvas.addEventListener('mouseup', () => { isDrawing = false; checkPercent(); });
        
        canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); });
        canvas.addEventListener('touchmove', (e) => { scratch(e); });
        canvas.addEventListener('touchend', () => { isDrawing = false; checkPercent(); });

        // --- 4. CLICK TO OPEN MODAL ---
        door.addEventListener('click', (e) => {
            // Only open modal if door is REVEALED
            if (door.classList.contains('revealed')) {
                const content = door.querySelector('.door-hidden-content');
                if (content) {
                    modalBody.innerHTML = content.innerHTML;
                    modal.style.display = "block";
                }
            }
        });
    });

    // --- 5. CLOSE MODAL ---
    if(closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = "none";
    };
});
