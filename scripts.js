document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. MODAL VARIABLES ---
    const modal = document.getElementById("whiskeyModal");
    const modalBody = document.getElementById("modal-body");
    const closeBtn = document.querySelector(".close-button");

    // --- 2. SETUP SCRATCH CANVASES ---
    const doors = document.querySelectorAll('.door');

    doors.forEach(door => {
        const canvas = door.querySelector('.scratch-canvas');
        const number = door.querySelector('.door_number');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        // Set Canvas Size
        const resizeCanvas = () => {
            canvas.width = door.offsetWidth;
            canvas.height = door.offsetHeight;
            
            // Fill with Silver Foil
            ctx.fillStyle = "#C0C0C0"; // Silver
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        
        resizeCanvas();
        // Handle window resize (optional, might reset scratch)
        // window.addEventListener('resize', resizeCanvas);

        // --- SCRATCH LOGIC ---
        const getBrushPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            // Handle both touch and mouse
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const scratch = (e) => {
            if (!isDrawing) return;
            e.preventDefault(); // Stop scrolling while scratching

            const pos = getBrushPos(e);
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); // Brush size
            ctx.fill();
        };

        const checkPercent = () => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let transparentPixels = 0;

            // Check every 4th pixel (optimization)
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] === 0) transparentPixels++;
            }

            const percent = transparentPixels / (pixels.length / 4);

            // If 40% scratched, reveal the door
            if (percent > 0.4) {
                revealDoor();
            }
        };

        const revealDoor = () => {
            canvas.style.display = 'none'; // Hide canvas
            if(number) number.style.display = 'none'; // Hide number
            door.classList.add('revealed'); // Mark as ready for clicking
        };

        // --- EVENTS FOR SCRATCHING ---
        // Mouse
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; scratch(e); });
        canvas.addEventListener('mousemove', (e) => { scratch(e); });
        canvas.addEventListener('mouseup', () => { isDrawing = false; checkPercent(); });
        canvas.addEventListener('mouseleave', () => { isDrawing = false; });
        
        // Touch
        canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); });
        canvas.addEventListener('touchmove', (e) => { scratch(e); });
        canvas.addEventListener('touchend', () => { isDrawing = false; checkPercent(); });


        // --- 3. CLICK TO OPEN MODAL (ONLY AFTER REVEAL) ---
        door.addEventListener('click', (e) => {
            // Only open if the door is fully revealed
            if (door.classList.contains('revealed')) {
                const content = door.querySelector('.door-hidden-content').innerHTML;
                modalBody.innerHTML = content;
                modal.style.display = "block";
            }
        });
    });

    // --- 4. CLOSE MODAL LOGIC ---
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = "none";
    };
});
