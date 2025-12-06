/*
  Note: This script includes Back-to-Top logic,
  Persistent Confirmation logic, and the main Scratch-Off game functionality.
*/
document.addEventListener("DOMContentLoaded", () => {
    const DPR = window.devicePixelRatio || 1;
    const cards = Array.from(document.querySelectorAll(".card"));
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const modalClose = document.getElementById("modalClose");
    const resetBtn = document.getElementById('resetProgressBtn');
    const backToTopBtn = document.getElementById('backToTopBtn'); // NEW

    // NEW: Global variable for Reset Page button
    const resetPageBtn = document.getElementById('resetPageBtn'); 

    // Confirmation Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    // --- LOCAL STORAGE STATE & MANAGEMENT (PERSISTENCE) ---
    const STORAGE_KEY = 'scratchedDays';
    const LS_KEY_SEMI_SPOILER = 'semiSpoiler'; 
    const LS_KEY_MAJOR_SPOILER = 'majorSpoiler'; 
	
	// --- Bourbon Data Storage Functions (scripts.js) ---

	const BOURBON_DATA_KEY = 'allBourbonData';

	function createAndSaveBourbonData() {
		const bourbonData = {};
		// Query all cards that have a data-day attribute (i.e., the scratch-off cards)
		const cards = document.querySelectorAll('.card[data-day]');

		cards.forEach(card => {
			const day = card.dataset.day;
			const name = card.querySelector('h3').textContent;
			// 🔑 Retrieve the Proof directly from the new data attribute
			const proof = card.dataset.proof || 'N/A'; 
			const imgSrc = card.querySelector('img').src;

			bourbonData[day] = {
				name: name,
				proof: proof, // Storing the proof
				imgSrc: imgSrc
			};
		});

		try {
			localStorage.setItem(BOURBON_DATA_KEY, JSON.stringify(bourbonData));
			console.log("Bourbon data stored in Local Storage.");
		} catch (e) {
			console.error("Error saving bourbon data to Local Storage", e);
		}
	}

	// Run the saving function when the script loads on the index page
	if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
		createAndSaveBourbonData();
	}

    let scratchedDays = {};

    function loadProgress() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            scratchedDays = stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error("Error loading progress from localStorage", e);
            scratchedDays = {}; 
        }
    }

    function saveProgress(day) {
        if (!day) return;
        scratchedDays[day] = true;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scratchedDays));
        } catch (e) {
            console.error("Error saving progress to localStorage", e);
        }
    }

    function saveSpoilerConfirmation(key) {
        try {
            // MODIFIED: This function now does nothing to prevent saving the confirmation.
            // localStorage.setItem(key, 'true'); 
        } catch (e) {
            console.error("Error saving spoiler confirmation:", e);
        }
    }

    function checkSpoilerConfirmation(key) {
        try {
            // MODIFIED: This function now always returns false to force the modal.
            return false;
            // return localStorage.getItem(key) === 'true'; 
        } catch (e) {
            return false;
        }
    }

    function resetProgress() {
        try {
            // Clears door progress AND spoiler warnings (needed for door logic to work)
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LS_KEY_SEMI_SPOILER);
            localStorage.removeItem(LS_KEY_MAJOR_SPOILER);
            console.log("All local storage cleared. Reloading page.");
            window.location.reload();
        } catch (e) {
            console.error("Error clearing progress from localStorage", e);
        }
    }

    
    loadProgress();
    
    // --- CARD RANDOMIZATION & BOURBON MATCHING LOGIC (CONDITIONAL) ---
    
    // Check if the current page is 'all-bottles.html'
    if (window.location.pathname.endsWith('all-bottles.html')) {
		const BOURBON_DATA_KEY = 'allBourbonData';
		let fullBourbonList = {};
		try {
			const storedData = localStorage.getItem(BOURBON_DATA_KEY);
			// Load the full list saved from index.html
			fullBourbonList = storedData ? JSON.parse(storedData) : {}; 
		} catch(e) {
			console.error("Failed to load full bourbon data.");
		}      
        function shuffleCards() {
            if (cards.length === 0) return;
            const container = cards[0].parentNode;

            if (container) {
                let cardElements = Array.from(container.children); 
                
                // 1. Create a Document Fragment (In-memory container)
                const fragment = document.createDocumentFragment();

                // 2. Perform Fisher-Yates Shuffle on the Array
                for (let i = cardElements.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [cardElements[i], cardElements[j]] = [cardElements[j], cardElements[i]];
                }

                // 3. Append the shuffled elements to the fragment (no browser reflows triggered here)
                cardElements.forEach(card => fragment.appendChild(card));

                // 4. Append the fragment back to the live DOM (only ONE reflow is triggered)
                container.appendChild(fragment);

                console.log("Card order shuffled successfully with Document Fragment.");
            }
        }

        // --- Run the randomization ---
        shuffleCards();

        // --- NEW: BOURBON GUESSING GAME LOGIC (for all-bottles.html) ---
        // 1. New Confetti function (Uses canvas-confetti library loaded in HTML)
        function launchConfetti() {
            console.log("Confetti effect launched!");
            // Placeholder for actual confetti code (e.g., using a library like canvas-confetti):
            confetti({
                particleCount: 75,
                spread: 60,
                origin: { x: 0.2, y: 0.9 },
                zIndex: 10000
            });
            
            // Launch another burst from the bottom right
            confetti({
                particleCount: 75,
                spread: 60,
                origin: { x: 0.8, y: 0.9 },
                zIndex: 10000
            });

            
            
            // If you use a CSS/manual animation, place the logic here.
        }
        
        // 1. Get DOM elements for the new guessing modal (MOVED INSIDE HERE)
        const guessModal = document.getElementById('guessModal');
        const guessCloseButton = guessModal ? guessModal.querySelector('.close-button') : null;
		const submitButton = document.getElementById('submitGuessButton');
        const dayGuessInput = document.getElementById('dayGuessInput');
        const resultMessage = document.getElementById('resultMessage');
        const doors = document.querySelectorAll('.door');
        
        // ADDED: Element to display the Bourbon name in the modal
        const modalBourbonName = document.getElementById('modalBourbonName');
		const modalBourbonImage = document.getElementById('modalBourbonImage');
		const modalBourbonProof = document.getElementById('modalBourbonProof');
        let currentDoor = null;

        if (guessModal && doors.length > 0) {
			function lockGuessModal() {
				dayGuessInput.disabled = true;
				submitButton.disabled = true;
				submitButton.textContent = 'Answer Submitted';
			}
			
			function unlockGuessModal() {
				dayGuessInput.disabled = false;
				submitButton.disabled = false;
				submitButton.textContent = 'Submit Guess';
			}
            // 4. Modal Close Handlers
            const closeModalAndRestoreScroll = () => {
                guessModal.style.display = 'none';
                // FIX: Restore background scrolling when modal is closed
                unlockGuessModal();
				document.body.style.overflowY = ''; 
            };
				
		// 2. Event Listener for Doors (CLEANED UP AND FIXED)
			doors.forEach(door => {
			door.addEventListener('click', function(e) {
			e.stopPropagation();
			if (this.classList.contains('revealed')) return;
			
			// --- DATA RETRIEVAL ---
			const bourbonContainer = this.closest('.bottle-container'); 
			const correctDay = bourbonContainer.dataset.correctDay; 
			
			const details = fullBourbonList[correctDay] || {};
			const proofValue = details.proof || 'N/A';
			const nameFromData = details.name || '';
			
			const linkElement = bourbonContainer.querySelector('.btn');
			const bourbonLinkHref = linkElement ? linkElement.href : '#';

			let bourbonName = nameFromData;
			let bourbonImageSrc = '';
			
			const imageElement = bourbonContainer.querySelector('.bourbon-content img');
			if (imageElement) {
				bourbonImageSrc = imageElement.src;
			}

			// --- LINK REPLACEMENT LOGIC (CRITICAL FIX: Consolidate to one check/action) ---
			// 1. Get the current reference to the element in the DOM
			let currentNameElement = document.getElementById('modalBourbonName');
			
			// 2. If it's the original strong tag (not yet an A tag), replace it once.
			if (currentNameElement && currentNameElement.tagName !== 'A') {
				const newLink = document.createElement('a');
				newLink.id = 'modalBourbonName';
				newLink.href = bourbonLinkHref;
				newLink.target = '_blank'; 
				newLink.style.fontWeight = 'bold'; 
				newLink.style.color = 'inherit';
				newLink.style.textDecoration = 'underline'; 
				
				currentNameElement.parentNode.replaceChild(newLink, currentNameElement);
				currentNameElement = newLink; // Update the local variable to the new link
				// Since modalBourbonName is defined outside the loop, we should update it if it was a `let/var` or rely on the document.getElementById inside the door's click handler
				// For safety, let's keep relying on document.getElementById('modalBourbonName') inside this handler.
			}
			
			// --- DATA DISPLAY ---
			
			// 3. Update the content of the link (whether it's the new <a> or the existing <a>)
			if (currentNameElement) {
				currentNameElement.textContent = bourbonName || 'this bottle';
				// Also ensure the href is correct on repeat clicks, as link shuffling may change data
				if (currentNameElement.tagName === 'A') {
					 currentNameElement.href = bourbonLinkHref;
				}
			}
			
			// Display Proof in modal introduction
			const modalBourbonProof = document.getElementById('modalBourbonProof');
			if (modalBourbonProof) {
				modalBourbonProof.textContent = ` (Proof: ${proofValue})`; 
			}
			
			// Update the second instance of the name in the guess prompt
			const modalBourbonNameGuessPrompt = document.getElementById('modalBourbonNameGuessPrompt');
			if (modalBourbonNameGuessPrompt) {
				modalBourbonNameGuessPrompt.textContent = bourbonName || 'this bottle';
			}
			
			const modalBourbonImage = document.getElementById('modalBourbonImage'); // Re-query since this is only scoped to the outside IF block
			if (modalBourbonImage) {
				modalBourbonImage.src = bourbonImageSrc;
				modalBourbonImage.style.display = 'block'; 
			}
			
			// --- MODAL OPEN FIX ---
			unlockGuessModal(); 
			currentDoor = this; 
			resultMessage.textContent = '';
			dayGuessInput.value = ''; 
			
			// FIX: Removed window.requestAnimationFrame for synchronous display
			guessModal.style.display = 'flex';
		});
	});

            // 3. Handle Guess Submission
            if (submitButton) {
                submitButton.addEventListener('click', () => {
                    dayGuessInput.blur();
                    if (!currentDoor) return;

                    const guess = parseInt(dayGuessInput.value);
                    const bottleContainer = currentDoor.closest('.bottle-container');
                    // Retrieve the correct answer from the data attribute
                    const correctAnswer = parseInt(bottleContainer.dataset.correctDay);

                    if (isNaN(guess) || guess < 1 || guess > 12) {
                        resultMessage.textContent = 'Please enter a valid number between 1 and 12.';
                        return;
                    }
					lockGuessModal();

                    if (guess === correctAnswer) {
						// 🔑 Look up the proof value using the correct day number (key)
						const bourbonDetails = fullBourbonList[correctAnswer] || {};
						const proofValue = bourbonDetails.proof || 'N/A';
						const bourbonName = bourbonDetails.name || 'Unknown Bourbon';
						resultMessage.innerHTML = `
						<div style="font-size: 1.5rem; color: #B83232; font-weight: bold; margin: 10px 0;">
							🎉 YES! CORRECT! 🎉
						</div>
						${bourbonName} is mini-bottle bumber:${correctAnswer}!
						`;
							// Correct Guess: Reveal the bourbon
                        currentDoor.classList.add('revealed'); // Hide the door
                        const numberPlate = bottleContainer.querySelector('.hidden-number-plate');
                        if (numberPlate) {
                            numberPlate.textContent = correctAnswer;
                            numberPlate.classList.add('show-number');
                        }
                       // resultMessage.textContent = `🎉 Correct! 🎉 This is bottle ${correctAnswer}. (Proof: **${proofValue}**)`;
                        // Disable the click handler for this door after revealing
                        window.requestAnimationFrame(() => {
                            currentDoor.style.pointerEvents = 'none';
                            launchConfetti();
                        });
						
						setTimeout(() => {
							closeModalAndRestoreScroll();
							}, 10000);
                    } else {
                        // Incorrect Guess: Show message, do not reveal
                        resultMessage.innerHTML = `❌ Incorrect ❌ That's not the right bottle number. Try another bottle!`;
                    }
                });
                dayGuessInput.addEventListener('keyup', (e) => {
                    // Check for the Enter key (key code 13 for older browsers, 'Enter' for modern)
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        e.preventDefault(); // Stop the default action (like form submission)
                        submitButton.click(); // Programmatically click the submit button
                    }
                });
            }


            if (guessCloseButton) {
                guessCloseButton.addEventListener('click', closeModalAndRestoreScroll);
            }

            // Close the modal if the user clicks anywhere outside of it
            window.addEventListener('click', (event) => {
                if (event.target === guessModal) {
                    closeModalAndRestoreScroll();
                }
            });
        }
        
        // --- END NEW: BOURBON GUESSING GAME LOGIC ---
    } // CLOSES if (window.location.pathname.endsWith('all-bottles.html'))

    // --- END CARD RANDOMIZATION & BOURBON MATCHING LOGIC (CONDITIONAL) ---
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetProgress);
    }
    if (resetPageBtn) {
        resetPageBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    
    
    // --- NAVIGATION / MENU LOGIC ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuClose = document.getElementById('menuClose');
    const menuLinks = document.querySelectorAll('.mobile-menu a');

    if (hamburgerBtn && mobileMenu && menuClose) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            mobileMenu.setAttribute('aria-hidden', 'false');
        });

        menuClose.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            mobileMenu.setAttribute('aria-hidden', 'true');
        });

        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('open') &&
                !mobileMenu.contains(e.target) &&
                e.target !== hamburgerBtn &&
                !hamburgerBtn.contains(e.target)) {
                mobileMenu.classList.remove('open');
                mobileMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // --- CONFIRMATION MODAL LOGIC ---
    let confirmedLinkHref = null;
    let confirmedLinkSpoilerKey = null;

    function openConfirmModal(title, message, href, spoilerKey) {
        if (!confirmModal) return;

        confirmedLinkHref = href;
        confirmedLinkSpoilerKey = spoilerKey;

        confirmTitle.textContent = title;
        confirmMessage.innerHTML = message;
        confirmModal.setAttribute("aria-hidden", "false");

        if (mobileMenu) {
            mobileMenu.classList.remove('open');
            mobileMenu.setAttribute('aria-hidden', 'true');
        }
    }

    function closeConfirmModal() {
        if (confirmModal) {
            confirmModal.setAttribute("aria-hidden", "true");
            confirmedLinkHref = null; 
            confirmedLinkSpoilerKey = null;
        }
    }

    // Set up listeners for the confirmation buttons
    if (confirmNo) confirmNo.addEventListener('click', closeConfirmModal);
    if (confirmYes) confirmYes.addEventListener('click', () => {
        if (confirmedLinkHref) {
            // 1. Save confirmation status to local storage
            if (confirmedLinkSpoilerKey) {
                // Now saveSpoilerConfirmation is essentially disabled (see above function)
                saveSpoilerConfirmation(confirmedLinkSpoilerKey);
            }
            // 2. Navigate
            window.location.href = confirmedLinkHref;
        }
        closeConfirmModal();
    });

    // Intercept menu clicks
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const requiresConfirm = link.dataset.requiresConfirm === 'true';
            const spoilerKey = link.dataset.spoilerKey;

            if (requiresConfirm) {
                e.preventDefault();

                // MODIFIED: checkSpoilerConfirmation now always returns false, 
                // so the 'if' condition below is effectively ignored.
                if (spoilerKey && checkSpoilerConfirmation(spoilerKey)) {
                    // User already confirmed this spoiler type, navigate immediately
                    window.location.href = link.href;
                    return; 
                }

                // If not confirmed (or if checkSpoilerConfirmation returns false), show modal
                const title = link.dataset.confirmTitle || "Confirm Navigation";
                const message = link.dataset.confirmMessage || "Are you sure you want to visit this page?";
                openConfirmModal(title, message, link.href, spoilerKey);
            }
        });
    });
    
    // FIX: Allow clicking outside confirmation modal to close
    if (confirmModal) {
        confirmModal.addEventListener("click", (e) => {
            if (e.target === confirmModal) {
                closeConfirmModal();
            }
        });
    }

    // --- MAIN MODAL LOGIC (Bottle Details) ---

    function openModal(node) {
        if (!modalBody) return;
        modalBody.innerHTML = "";
        if (node && node.cloneNode) {
            const clone = node.cloneNode(true);
            const plate = clone.querySelector('.number-plate');
            if (plate) {
                plate.remove();
            }
            modalBody.appendChild(clone);
        }
        if (modal) modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        if (modal) modal.setAttribute("aria-hidden", "true");
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    
    // FIX: Allow clicking outside bottle detail modal to close
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // --- CANVAS / SCRATCH LOGIC ---

    function localPos(canvas, clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        return { x: clientX - r.left, y: clientY - r.top };
    }

    function checkRevealed(card) {
        const s = card._scratch;
        if (!s || s.revealed) return;
        try {
            const imageData = s.ctx.getImageData(0, 0, s.cssW, s.cssH);
            const data = imageData.data;
            let clear = 0;
            const len = data.length;
            const step = 4 * 40;
            let total = 0;
            for (let i = 3; i < len; i += step) {
                total++;
                if (data[i] === 0) clear++;
            }
            if ((clear / total) > 0.4) {
                s.revealed = true;
                card.classList.add("revealed");
                saveProgress(card.dataset.day);
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

            const imgSrc = card.dataset.img;
            if (imgSrc) {
                card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;
                card.style.backgroundSize = "cover";
                card.style.backgroundPosition = "center";
            }

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
                canvas,
                ctx,
                cssW,
                cssH,
                brush: Math.max(25, Math.round(Math.max(cssW, cssH) * 0.10)),
                revealed: false
            };

            if (scratchedDays[day]) {
                card.classList.add("revealed");
                card._scratch.revealed = true;
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

        function eraseAt(x, y) {
            s.ctx.beginPath();
            s.ctx.arc(x, y, s.brush, 0, Math.PI * 2);
            s.ctx.fill();
        }

        function onDown(x, y) {
            if (s.revealed) return;
            drawing = true;
            last = { x, y };
        }

        function onMove(x, y) {
            if (!drawing || s.revealed) return;

            const dist = Math.hypot(x - last.x, y - last.y);
            const steps = Math.ceil(dist / (s.brush * 0.25));
            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                eraseAt(last.x + (x - last.x) * t, last.y + (y - last.y) * t);
            }
            last = { x, y };

            moveCounter++;
            if (moveCounter % 20 === 0) {
                checkRevealed(card);
            }
        }

        function onUp() {
            if (drawing) {
                drawing = false;
                last = null;
                checkRevealed(card);
            }
        }

        canvas.addEventListener("pointerdown", e => {
            if (e.pointerType === "mouse") e.preventDefault();
            const p = localPos(canvas, e.clientX, e.clientY);
            onDown(p.x, p.y);
        });

        canvas.addEventListener("pointermove", e => {
            if (drawing && e.cancelable) {
                if (e.pointerType === "mouse" || e.pointerType === "touch") {
                    e.preventDefault();
                    const p = localPos(canvas, e.clientX, e.clientY);
                    onMove(p.x, p.y);
                }
            }
        });

        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onUp);
    }

    function setupClickableCardLogic(card) {
        const detailLink = card.querySelector('.btn');
        if (detailLink) {
            detailLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    cards.forEach(card => {
        const canvas = card.querySelector(".scratch");

        if (canvas) {
            const scratchState = initCanvas(card);
            setupScratchLogic(card, scratchState);
        } else if (card.classList.contains('revealed')) {
            setupClickableCardLogic(card);
        }
        
        // Attach the modal click handler ONCE to the card element itself, 
        card.addEventListener("click", (e) => {
            if (e.target.closest('a') !== null) return; 

            if (card.classList.contains("revealed")) {
                const contentNode = card.querySelector(".content");
                if (contentNode) openModal(contentNode);
            }
        });
    });

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

    // --- BACK TO TOP LOGIC ---
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // Show button after scrolling 300px
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
    }
    
    // --- TEMPORARY SNOW GENERATOR ---
    (function createSnow(num = 75, initialDurationSeconds = 5) {
        const container = document.getElementById('snow-container');
        if (!container) return;
        
        let activeFlakes = 0;
        const SNOW_COLORS = ['#FFFFFF', '#F0F8FF', '#CCFFFF', '#99FFFF', '#B0E0E6']; 
        const SNOW_CHARS = ['❄', '❅', '❆', '✶', '✷', '✵']; 

        function handleFlakeEnd(event) {
            if (event.animationName === 'fall-fixed') {
                event.target.removeEventListener('animationend', handleFlakeEnd);
                event.target.remove();
                activeFlakes--;
                
                if (flakesGenerated >= totalFlakesToGenerate && activeFlakes <= 0) {
                    removeContainer();
                }
            }
        }

        function removeContainer() {
            container.innerHTML = '';
            container.remove();
            console.log(`Snowfall effect complete and container removed.`);
        }

        let generationInterval;
        let flakesGenerated = 0;
        const totalFlakesToGenerate = num; 
        const intervalTime = (initialDurationSeconds * 1000) / totalFlakesToGenerate; 

        function generateFlake() {
            if (flakesGenerated >= totalFlakesToGenerate) {
                clearInterval(generationInterval);
                console.log(`Snow generation stopped. Waiting for ${activeFlakes} flakes to clear.`);
                if (activeFlakes <= 0) removeContainer();
                return;
            }

            const el = document.createElement('div');
            el.className = 'snowflake';
            el.textContent = SNOW_CHARS[Math.floor(Math.random() * SNOW_CHARS.length)]; 

            const left = Math.random() * 100;
            const size = 15 + Math.random() * 10; 
            const dur = 6 + Math.random() * 6; // Fall duration: 6s to 12s
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
        }

        generationInterval = setInterval(generateFlake, intervalTime);
        generateFlake(); 

    })(75, 5); 
});