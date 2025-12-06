document.addEventListener("DOMContentLoaded", () => {
    const DPR = window.devicePixelRatio || 1;
    const cards = Array.from(document.querySelectorAll(".card"));
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const modalClose = document.getElementById("modalClose");
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    // --- CONSTANTS & PERSISTENCE ---
    const STORAGE_KEY = 'scratchedDays';
    const BOURBON_DATA_KEY = 'allBourbonData';
    let scratchedDays = {};

    function createAndSaveBourbonData() {
		const bourbonData = {};
		// Query all cards that have a data-day attribute (i.e., the scratch-off cards)
		const cards = document.querySelectorAll('.card[data-day]');

		cards.forEach(card => {
			const day = card.dataset.day;
			const name = card.querySelector('h3').textContent;
			// 🔑 Retrieve the Proof directly from the new data attribute
			const proof = card.dataset.proof || card.dataset.proof || 'N/A'; // Use proof from data-proof if available
			const imgSrc = card.querySelector('img').src;

			bourbonData[day] = {
				name: name,
				proof: proof,
				imgSrc: imgSrc
			};
		});

		try {
			localStorage.setItem(BOURBON_DATA_KEY, JSON.stringify(bourbonData));
		} catch (e) {
			console.error("Error saving bourbon data to Local Storage", e);
		}
	}
    
    // FIX: Re-run the saving function when the script loads on the index page
	if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
		createAndSaveBourbonData();
	}

    function loadProgress() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            scratchedDays = stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error("Error loading progress:", e);
        }
    }

    function saveProgress(day) {
        if (!day) return;
        scratchedDays[day] = true;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scratchedDays));
        } catch (e) {
            console.error("Error saving progress:", e);
        }
    }

    function resetProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('semiSpoiler');
            localStorage.removeItem('majorSpoiler');
            console.log("Progress cleared. Reloading page.");
            window.location.reload();
        } catch (e) {
            console.error("Error clearing progress:", e);
        }
    }

    // --- GENERIC MODAL & UI FUNCTIONS ---

    const closeModal = () => modal ? modal.setAttribute("aria-hidden", "true") : null;

    function openModal(node) {
        if (!modalBody || !node || !node.cloneNode) return;
        modalBody.innerHTML = "";
        const clone = node.cloneNode(true);
        const plate = clone.querySelector('.number-plate');
        if (plate) plate.remove();
        
        modalBody.appendChild(clone);
        if (modal) modal.setAttribute("aria-hidden", "false");
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modal) modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Attach reset button functionality
    const resetBtnEl = document.getElementById('resetProgressBtn');
    const resetPageBtnEl = document.getElementById('resetPageBtn');
    if (resetBtnEl) resetBtnEl.addEventListener('click', resetProgress);
    if (resetPageBtnEl) resetPageBtnEl.addEventListener('click', () => window.location.reload());

    // --- NAVIGATION / MENU LOGIC ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuClose = document.getElementById('menuClose');
    const menuLinks = document.querySelectorAll('.mobile-menu a');
    const confirmModalEl = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    let confirmedLinkHref = null;

    const closeConfirmModal = () => {
        if (confirmModalEl) confirmModalEl.setAttribute("aria-hidden", "true");
        confirmedLinkHref = null;
    };

    if (hamburgerBtn && mobileMenu) {
        const toggleMenu = (open) => {
            mobileMenu.classList.toggle('open', open);
            mobileMenu.setAttribute('aria-hidden', (!open).toString());
        };
        hamburgerBtn.addEventListener('click', () => toggleMenu(true));
        menuClose.addEventListener('click', () => toggleMenu(false));
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
                toggleMenu(false);
            }
        });
    }

    if (confirmNo) confirmNo.addEventListener('click', closeConfirmModal);
    if (confirmYes) confirmYes.addEventListener('click', () => {
        if (confirmedLinkHref) window.location.href = confirmedLinkHref;
        closeConfirmModal();
    });
    if (confirmModalEl) confirmModalEl.addEventListener("click", (e) => {
        if (e.target === confirmModalEl) closeConfirmModal();
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.requiresConfirm === 'true') {
                e.preventDefault();
                // Spoiler confirmation logic simplified (always opens modal due to checkSpoilerConfirmation always returning false in original code)
                confirmTitle.textContent = link.dataset.confirmTitle || "Confirm Navigation";
                confirmMessage.innerHTML = link.dataset.confirmMessage || "Are you sure you want to visit this page?";
                confirmedLinkHref = link.href;
                if (confirmModalEl) confirmModalEl.setAttribute("aria-hidden", "false");
                if (mobileMenu) mobileMenu.classList.remove('open');
            }
        });
    });

    // --- SCRATCH-OFF LOGIC (Index Page Only) ---
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        
        function localPos(canvas, clientX, clientY) {
            const r = canvas.getBoundingClientRect();
            return { x: clientX - r.left, y: clientY - r.top };
        }

        function checkRevealed(card) {
            const s = card._scratch;
            if (!s || s.revealed) return;

            try {
                const imageData = s.ctx.getImageData(0, 0, s.cssW, s.cssH);
                let clear = 0;
                let total = 0;
                const data = imageData.data;
                const len = data.length;
                const step = 4 * 40; 
                
                for (let i = 3; i < len; i += step) {
                    total++;
                    if (data[i] === 0) clear++;
                }

                if ((clear / total) > 0.4) {
                    s.revealed = true;
                    card.classList.add("revealed");
                    saveProgress(card.dataset.day);
                    
                    // Automatically open modal immediately on reveal
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            } catch (err) {
                console.error("Error during checkRevealed:", err);
            }
        }

        function initCanvas(card) {
            const canvas = card.querySelector(".scratch");
            if (!canvas) return;

            try {
                const ctx = canvas.getContext("2d");
                const day = card.dataset.day;

                // Set card background image
                const imgSrc = card.dataset.img;
                if (imgSrc) card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;

                const cssW = Math.max(1, Math.round(card.clientWidth));
                const cssH = Math.max(1, Math.round(card.clientHeight));

                canvas.style.width = cssW + "px";
                canvas.style.height = cssH + "px";
                canvas.width = Math.floor(cssW * DPR);
                canvas.height = Math.floor(cssH * DPR);

                ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = "#d8d8d8";
                ctx.fillRect(0, 0, cssW, cssH);
                ctx.globalCompositeOperation = "destination-out";

                card._scratch = {
                    canvas, ctx, cssW, cssH,
                    brush: Math.max(25, Math.round(Math.max(cssW, cssH) * 0.10)),
                    revealed: !!scratchedDays[day] // Check persistence here
                };

                if (card._scratch.revealed) {
                    card.classList.add("revealed");
                    canvas.style.display = 'none';
                }
                return card._scratch;

            } catch (e) {
                console.error("Failed to initialize canvas for card:", day, e);
                return null;
            }
        }

        function setupScratchLogic(card, s) {
            if (!s) return;
            const { canvas } = s;
            let drawing = false;
            let last = null;
            let moveCounter = 0;

            const eraseAt = (x, y) => {
                s.ctx.beginPath();
                s.ctx.arc(x, y, s.brush, 0, Math.PI * 2);
                s.ctx.fill();
            };

            const onDown = (x, y) => {
                if (s.revealed) return;
                drawing = true;
                last = { x, y };
            };

            const onMove = (x, y) => {
                if (!drawing || s.revealed) return;
                const dist = Math.hypot(x - last.x, y - last.y);
                const steps = Math.ceil(dist / (s.brush * 0.25));
                for (let i = 0; i < steps; i++) {
                    const t = i / steps;
                    eraseAt(last.x + (x - last.x) * t, last.y + (y - last.y) * t);
                }
                last = { x, y };

                moveCounter++;
                if (moveCounter % 20 === 0) checkRevealed(card);
            };

            const onUp = () => {
                if (drawing) {
                    drawing = false;
                    last = null;
                    checkRevealed(card);
                }
            };

            canvas.addEventListener("pointerdown", e => {
                if (e.pointerType === "mouse") e.preventDefault();
                const p = localPos(canvas, e.clientX, e.clientY);
                onDown(p.x, p.y);
            });

            canvas.addEventListener("pointermove", e => {
                if (drawing && e.cancelable && (e.pointerType === "mouse" || e.pointerType === "touch")) {
                    e.preventDefault();
                    const p = localPos(canvas, e.clientX, e.clientY);
                    onMove(p.x, p.y);
                }
            });

            canvas.addEventListener("pointerup", onUp);
            canvas.addEventListener("pointercancel", onUp);
        }
        
        // Initial setup and event delegation for the cards
        cards.forEach(card => {
            const scratchState = initCanvas(card);
            setupScratchLogic(card, scratchState);
            
            // Handle clicks on revealed cards (or any card not using scratch logic)
            card.addEventListener("click", (e) => {
                if (e.target.closest('a') !== null) return;
                
                // Only open the modal if the card is revealed
                if (card.classList.contains("revealed")) {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            });
        });

        // Resize handler re-initializes canvas
        let rt = null;
        window.addEventListener("resize", () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                cards.forEach(card => {
                    if (card.querySelector('.scratch') && card._scratch && !card._scratch.revealed) {
                        const canvas = card.querySelector(".scratch");
                        const cardEl = card.closest('.card');
                        const scratchState = card._scratch;

                        const cssW = Math.max(1, Math.round(cardEl.clientWidth));
                        const cssH = Math.max(1, Math.round(cardEl.clientHeight));

                        canvas.style.width = cssW + "px";
                        canvas.style.height = cssH + "px";
                        canvas.width = Math.floor(cssW * DPR);
                        canvas.height = Math.floor(cssH * DPR);

                        scratchState.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
                        scratchState.ctx.globalCompositeOperation = "source-over";
                        scratchState.ctx.fillStyle = "#d8d8d8";
                        scratchState.ctx.fillRect(0, 0, cssW, cssH);
                        scratchState.ctx.globalCompositeOperation = "destination-out";
                    }
                });
            }, 120);
        });

    } 
    
    // --- BOURBON GUESSING GAME LOGIC (All-Bottles Page Only) ---
    if (window.location.pathname.endsWith('all-bottles.html')) {
        let fullBourbonList = {};
        try {
            const storedData = localStorage.getItem(BOURBON_DATA_KEY);
            fullBourbonList = storedData ? JSON.parse(storedData) : {};
        } catch(e) {
            console.error("Failed to load full bourbon data.");
        }

        // --- Confetti function (Assumes canvas-confetti library is loaded) ---
        const launchConfetti = () => {
            console.log("Confetti effect launched!");
            const bursts = [{x: 0.2, y: 0.9}, {x: 0.8, y: 0.9}];
            bursts.forEach(origin => {
                confetti({ particleCount: 75, spread: 60, origin, zIndex: 10000 });
            });
        };
        
        // --- Modal Elements and Helpers ---
        const guessModal = document.getElementById('guessModal');
        const guessCloseButton = guessModal ? guessModal.querySelector('.close-button') : null;
        const submitButton = document.getElementById('submitGuessButton');
        const dayGuessInput = document.getElementById('dayGuessInput');
        const resultMessage = document.getElementById('resultMessage');
        const doors = document.querySelectorAll('.door');
        const modalBourbonImage = document.getElementById('modalBourbonImage');
        const modalBourbonNameGuessPrompt = document.getElementById('modalBourbonNameGuessPrompt');
        let currentDoor = null;

        const lockGuessModal = () => {
            dayGuessInput.disabled = true;
            submitButton.disabled = true;
            submitButton.textContent = 'Answer Submitted';
        };
        
        const unlockGuessModal = () => {
            dayGuessInput.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Guess';
        };

        const closeModalAndRestoreScroll = () => {
            if (guessModal) guessModal.style.display = 'none';
            unlockGuessModal();
            document.body.style.overflowY = ''; 
        };
        
        // --- Door Click Handler (Fixed for synchronous modal opening) ---
        doors.forEach(door => {
            door.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('revealed')) return;
                
                const bourbonContainer = this.closest('.bottle-container'); 
                const correctDay = bourbonContainer.dataset.correctDay; 
                const details = fullBourbonList[correctDay] || {};
                const { proof = 'N/A', name: bourbonName = '' } = details;
                const linkElement = bourbonContainer.querySelector('.btn');
                const bourbonLinkHref = linkElement ? linkElement.href : '#';

                let currentNameElement = document.getElementById('modalBourbonName');
                
                // Ensure name is a link (one-time replacement)
                if (currentNameElement && currentNameElement.tagName !== 'A') {
                    const newLink = document.createElement('a');
                    Object.assign(newLink, {
                        id: 'modalBourbonName',
                        href: bourbonLinkHref,
                        target: '_blank',
                        textContent: bourbonName,
                        style: 'font-weight: bold; color: inherit; text-decoration: underline;'
                    });
                    currentNameElement.parentNode.replaceChild(newLink, currentNameElement);
                    currentNameElement = newLink;
                } else if (currentNameElement) {
                     currentNameElement.textContent = bourbonName || 'this bottle';
                     currentNameElement.href = bourbonLinkHref;
                }
                
                // Update proof and image details
                const modalBourbonProof = document.getElementById('modalBourbonProof');
                if (modalBourbonProof) modalBourbonProof.textContent = ` (Proof: ${proof})`; 
                if (modalBourbonNameGuessPrompt) modalBourbonNameGuessPrompt.textContent = bourbonName || 'this bottle';
                
                const imageElement = bourbonContainer.querySelector('.bourbon-content img');
                if (modalBourbonImage && imageElement) {
                    modalBourbonImage.src = imageElement.src;
                    modalBourbonImage.style.display = 'block'; 
                }
                
                // --- MODAL OPEN (FIX: Synchronous display) ---
                unlockGuessModal(); 
                currentDoor = this; 
                resultMessage.textContent = '';
                dayGuessInput.value = ''; 
                
                if (guessModal) guessModal.style.display = 'flex';
            });
        });

        // --- Guess Submission Handler ---
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                dayGuessInput.blur();
                if (!currentDoor) return;

                const guess = parseInt(dayGuessInput.value);
                const bottleContainer = currentDoor.closest('.bottle-container');
                const correctAnswer = parseInt(bottleContainer.dataset.correctDay);

                if (isNaN(guess) || guess < 1 || guess > 12) {
                    resultMessage.textContent = 'Please enter a valid number between 1 and 12.';
                    return;
                }
                lockGuessModal();

                if (guess === correctAnswer) {
                    const { name: bourbonName = 'Unknown Bourbon' } = fullBourbonList[correctAnswer] || {};
                    
                    resultMessage.innerHTML = `<div style="font-size: 1.5rem; color: #B83232; font-weight: bold; margin: 10px 0;">🎉 YES! CORRECT! 🎉</div>${bourbonName} is mini-bottle bumber:${correctAnswer}!`;

                    currentDoor.classList.add('revealed');
                    const numberPlate = bottleContainer.querySelector('.hidden-number-plate');
                    if (numberPlate) {
                        numberPlate.textContent = correctAnswer;
                        numberPlate.classList.add('show-number');
                    }
                    window.requestAnimationFrame(() => {
                        currentDoor.style.pointerEvents = 'none';
                        launchConfetti();
                    });
                    
                    setTimeout(closeModalAndRestoreScroll, 10000);
                } else {
                    resultMessage.innerHTML = `❌ Incorrect ❌ That's not the right bottle number. Try another bottle!`;
                }
            });
            
            dayGuessInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    submitButton.click();
                }
            });
        }

        if (guessCloseButton) guessCloseButton.addEventListener('click', closeModalAndRestoreScroll);
        window.addEventListener('click', (event) => {
            if (event.target === guessModal) closeModalAndRestoreScroll();
        });
        
    } // End all-bottles.html logic

    // --- BACK TO TOP LOGIC ---
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
    }
    
    // --- TEMPORARY SNOW GENERATOR ---
    (function createSnow(num = 75, initialDurationSeconds = 5) {
        const container = document.getElementById('snow-container');
        if (!container) return;
        const SNOW_COLORS = ['#FFFFFF', '#F0F8FF', '#CCFFFF', '#99FFFF', '#B0E0E6'];
        const SNOW_CHARS = ['❄', '❅', '❆', '✶', '✷', '✵'];
        let activeFlakes = 0;
        let flakesGenerated = 0;
        const totalFlakesToGenerate = num;
        const intervalTime = (initialDurationSeconds * 1000) / totalFlakesToGenerate;
        let generationInterval;

        const handleFlakeEnd = (event) => {
            if (event.animationName === 'fall-fixed') {
                event.target.removeEventListener('animationend', handleFlakeEnd);
                event.target.remove();
                activeFlakes--;
                if (flakesGenerated >= totalFlakesToGenerate && activeFlakes <= 0) {
                    container.innerHTML = '';
                    container.remove();
                    console.log(`Snowfall effect complete and container removed.`);
                }
            }
        };

        const generateFlake = () => {
            if (flakesGenerated >= totalFlakesToGenerate) {
                clearInterval(generationInterval);
                return;
            }

            const el = document.createElement('div');
            el.className = 'snowflake';
            el.textContent = SNOW_CHARS[Math.floor(Math.random() * SNOW_CHARS.length)];
            const left = Math.random() * 100;
            const size = 15 + Math.random() * 10;
            const dur = 6 + Math.random() * 6;
            const sway = (Math.random() - 0.5) * 50;

            el.style.color = SNOW_COLORS[Math.floor(Math.random() * SNOW_COLORS.length)];
            el.style.left = left + 'vw';
            el.style.fontSize = size + 'px';
            el.style.animation = `fall-fixed ${dur}s linear 1, sway ${5 + Math.random() * 5}s ease-in-out infinite`;
            el.style.setProperty('--sway', `${sway}px`);

            el.addEventListener('animationend', handleFlakeEnd);
            container.appendChild(el);
            activeFlakes++;
            flakesGenerated++;
        };

        generationInterval = setInterval(generateFlake, intervalTime);
        generateFlake();
    })(75, 5);

    // Run once at start
    loadProgress();
});