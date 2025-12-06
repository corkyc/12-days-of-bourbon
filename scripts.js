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
		const cards = document.querySelectorAll('.card[data-day]');

		cards.forEach(card => {
			const day = card.dataset.day;
			const name = card.querySelector('h3').textContent;
			const proof = card.dataset.proof || 'N/A';
			// Check if img source is directly in 'content' or needs to be inferred
			const imgSrc = card.querySelector('.content img') ? card.querySelector('.content img').src : card.dataset.img;

			bourbonData[day] = { name, proof, imgSrc };
		});

		try {
			localStorage.setItem(BOURBON_DATA_KEY, JSON.stringify(bourbonData));
		} catch (e) {
			console.error("Error saving bourbon data:", e);
		}
	}
    
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
            window.location.reload();
        } catch (e) {
            console.error("Error clearing progress:", e);
        }
    }

    // --- GENERIC MODAL & UI FUNCTIONS ---

    const closeModal = () => modal ? modal.setAttribute("aria-hidden", "true") : null;

    function openModal(node) {
        if (!modalBody || !node || !node.cloneNode) return;
        
        // Find the original card that was clicked to access its data attributes
        const originalCard = node.closest('.card');
        // Check for the modal image source on the main card or the inner container
        let modalImgSrc = originalCard ? originalCard.dataset.modalImg : null;
        if (!modalImgSrc) {
            const container = node.querySelector('.bottle-container');
            if(container) {
                // If this is the all-bottles page, the full image is in the bourbon-content img
                modalImgSrc = container.querySelector('.bourbon-content img')?.src || null;
            }
        }

        modalBody.innerHTML = "";
        const clone = node.cloneNode(true);
        const plate = clone.querySelector('.number-plate');
        if (plate) plate.remove();
        
        // Check if a specific modal image is defined and apply it
        const imgElement = clone.querySelector('img');
        if (imgElement && modalImgSrc) {
            // This replaces the "reveal" image (images/revealBourbon.jpg) with the "modal" image
            imgElement.src = modalImgSrc; 
        }

        // Ensure content details are explicitly displayed in the modal
        const h3 = clone.querySelector('h3');
        const p = clone.querySelector('p');
        const btn = clone.querySelector('.btn');
        if (h3) h3.style.display = 'block';
        if (p) p.style.display = 'block';
        if (btn) btn.style.display = 'inline-block';
        
        // If the cloned content includes the bottle-container wrapper (like on all-bottles.html),
        // we extract the inner bourbon-content and put that in the modal body instead.
        const bourbonContent = clone.querySelector('.bourbon-content');
        if (bourbonContent) {
             modalBody.appendChild(bourbonContent);
        } else {
             modalBody.appendChild(clone);
        }
        
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
        if (confirmedLinkHref) {
            // Check for spoiler key and save confirmation in local storage
            const link = Array.from(menuLinks).find(l => l.href === confirmedLinkHref);
            if (link && link.dataset.spoilerKey) {
                 try {
                     localStorage.setItem(link.dataset.spoilerKey, 'true');
                 } catch (e) {
                     console.error("Error setting spoiler key:", e);
                 }
            }
            // FIX: Ensure navigation happens right here
            window.location.href = confirmedLinkHref;
        }
        closeConfirmModal();
    });
    if (confirmModalEl) confirmModalEl.addEventListener("click", (e) => {
        if (e.target === confirmModalEl) closeConfirmModal();
    });
    
    // Auto-confirm logic for menu links based on local storage
    menuLinks.forEach(link => {
        if (link.dataset.requiresConfirm === 'true' && link.dataset.spoilerKey) {
            try {
                if (localStorage.getItem(link.dataset.spoilerKey) === 'true') {
                    // Remove confirmation requirement if already confirmed
                    link.dataset.requiresConfirm = 'false';
                }
            } catch(e) {
                 console.error("Error reading spoiler key:", e);
            }
        }
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.requiresConfirm === 'true') {
                e.preventDefault();
                confirmTitle.textContent = link.dataset.confirmTitle || "Confirm Navigation";
                confirmMessage.innerHTML = link.dataset.confirmMessage || "Are you sure you want to visit this page?";
                // Store the link href to be used later by confirmYes
                confirmedLinkHref = link.href;
                if (confirmModalEl) confirmModalEl.setAttribute("aria-hidden", "false");
                if (mobileMenu) mobileMenu.classList.remove('open');
            } else if (link.dataset.spoilerKey) {
                // If it no longer requires confirmation, set the spoiler key anyway
                 try {
                     localStorage.setItem(link.dataset.spoilerKey, 'true');
                 } catch (e) {
                     console.error("Error setting spoiler key:", e);
                 }
            }
        });
    });

    // --- SLIDE/SWIPE REVEAL LOGIC (Index Page Only) ---
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        
        const REVEAL_THRESHOLD_PERCENT = 10;
        
        function setupSlideLogic(card) {
            const scratch = card.querySelector(".scratch");
            if (!scratch) return;

            const day = card.dataset.day;
            const isRevealed = !!scratchedDays[day];
            
            if (isRevealed) {
                card.classList.add("revealed");
                return;
            }

            let startX = null;
            let currentX = 0;
            let cardWidth = card.clientWidth;
            let pointerId = null; // Used for pointer events

            const updateDoorPosition = (deltaX) => {
                const percentage = (deltaX / cardWidth) * 100;
                const clampedPercentage = Math.min(100, Math.max(0, percentage));
                scratch.style.transform = `translateX(${clampedPercentage}%)`;
                currentX = deltaX;
            };
            
            const revealCard = () => {
                card.classList.add("revealed");
                saveProgress(day);
                scratch.style.pointerEvents = 'none';
                
                // Show modal after a brief delay to allow animation to complete
                setTimeout(() => {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }, 350); 
            };

            const onStart = (clientX, id) => {
                if (card.classList.contains("revealed")) return;
                startX = clientX;
                currentX = 0;
                cardWidth = card.clientWidth; // Recalculate on start
                scratch.style.transition = 'none';
                pointerId = id;
            };

            const onMove = (clientX, e) => {
                if (startX === null || card.classList.contains("revealed")) return;
                const deltaX = clientX - startX;
                if (deltaX > 0) { // Only allow swiping right
                    
                    // Prevent default action during move to stop browser scrolling/cancelling
                    e.preventDefault(); 

                    updateDoorPosition(deltaX);
                }
            };

            const onEnd = () => {
                if (startX === null || card.classList.contains("revealed")) return;
                scratch.style.transition = 'transform 0.3s ease-in-out';
                
                const percentageSwiped = (currentX / cardWidth) * 100;

                if (percentageSwiped >= REVEAL_THRESHOLD_PERCENT) {
                    revealCard();
                } else {
                    // Snap back
                    scratch.style.transform = 'translateX(0)';
                }
                startX = null;
                pointerId = null;
            };

            // --- Pointer Events (Unified Touch/Mouse/Pen) ---
            scratch.addEventListener("pointerdown", e => {
                e.target.setPointerCapture(e.pointerId);
                // Prevent default on down just in case
                e.preventDefault(); 
                
                onStart(e.clientX, e.pointerId);
            });

            scratch.addEventListener("pointermove", e => {
                if (pointerId !== null && e.pointerId === pointerId) {
                    // Pass the entire event object to onMove for preventDefault
                    onMove(e.clientX, e); 
                }
            });

            scratch.addEventListener("pointerup", onEnd);
            scratch.addEventListener("pointercancel", onEnd);
            
            // --- Click handler for modal on revealed cards ---
            card.addEventListener("click", (e) => {
                // If the click target is the door (meaning it wasn't fully opened) or an anchor, ignore
                if (e.target === scratch || e.target.closest('a') !== null) return;
                
                if (card.classList.contains("revealed")) {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            });

        }
        
        // Initial setup for all cards
        cards.forEach(card => {
            setupSlideLogic(card);
        });
        
        // No need for a complex canvas resize handler now.
    } 
    
    // --- UNIVERSAL REVEALED CARD CLICK HANDLER (for all-bottles pages) ---
    // This runs on all pages that have .card.revealed[data-clickable="true"]
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('all-bottles.html') || currentPath.endsWith('all-bottles-numbers.html')) {
        const revealedCards = document.querySelectorAll('.card.revealed[data-clickable="true"]');
        revealedCards.forEach(card => {
            // Attach a click listener to the card (excluding links inside)
            card.addEventListener('click', (e) => {
                // Ignore clicks on links or buttons inside the card
                if (e.target.closest('a') || e.target.closest('button')) return;
                
                // Get the main content node for the modal
                const contentNode = card.querySelector('.content') || card;

                // For all-bottles.html, the Bourbon Matching page, we show the guess modal instead
                if (currentPath.endsWith('all-bottles.html')) {
                    const door = card.querySelector('.door');
                    if (door && !door.classList.contains('revealed')) {
                         // The click listener is already inside all-bottles.html logic below, 
                         // but since we are handling clicks here, we need to defer to the guessing logic.
                         const container = card.querySelector('.bottle-container');
                         if (container) {
                             // Find the actual door to click to trigger the specific guessing game logic.
                             const actualDoor = container.querySelector('.door');
                             if (actualDoor) actualDoor.click();
                         }
                         return;
                    }
                }
                
                // For all-bottles-numbers.html (Complete Reveal), open the details modal
                openModal(contentNode);
            });
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

        const launchConfetti = () => {
            // Function requires the canvas-confetti library script to be present in all-bottles.html
            if (typeof confetti !== 'undefined') {
                const bursts = [{x: 0.2, y: 0.9}, {x: 0.8, y: 0.9}];
                bursts.forEach(origin => {
                    confetti({ particleCount: 75, spread: 60, origin, zIndex: 10000 });
                });
            } else {
                 console.warn("Confetti library not loaded.");
            }
        };
        
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
        
        doors.forEach(door => {
            door.addEventListener('click', function(e) {
                e.stopPropagation();
                if (this.classList.contains('revealed')) return;
                
                const bourbonContainer = this.closest('.bottle-container'); 
                const correctDay = bourbonContainer.dataset.correctDay; 
                const bourbonName = bourbonContainer.dataset.bourbonName;
                
                // Fetch the link element from the bourbon content
                const linkElement = bourbonContainer.querySelector('.bourbon-content .btn');
                const bourbonLinkHref = linkElement ? linkElement.href : '#';
                
                // Fetch details from local storage for proof/flavor
                const details = fullBourbonList[correctDay] || {};
                const proof = details.proof || 'N/A';
                
                
                let currentNameElement = document.getElementById('modalBourbonName');
                
                if (currentNameElement) {
                     currentNameElement.textContent = bourbonName || 'this bottle';
                     currentNameElement.href = bourbonLinkHref;
                }
                
                const modalBourbonProof = document.getElementById('modalBourbonProof');
                if (modalBourbonProof) modalBourbonProof.textContent = ` (Proof: ${proof})`; 
                if (modalBourbonNameGuessPrompt) modalBourbonNameGuessPrompt.textContent = bourbonName || 'this bottle';
                
                const imageElement = bourbonContainer.querySelector('.bourbon-content img');
                if (modalBourbonImage && imageElement) {
                    modalBourbonImage.src = imageElement.src;
                    modalBourbonImage.style.display = 'block'; 
                }
                
                unlockGuessModal(); 
                currentDoor = this; 
                resultMessage.textContent = '';
                dayGuessInput.value = ''; 
                
                if (guessModal) guessModal.style.display = 'flex';
            });
        });

        if (submitButton) {
            submitButton.addEventListener('click', () => {
                dayGuessInput.blur();
                if (!currentDoor) return;

                const guess = parseInt(dayGuessInput.value);
                const bottleContainer = currentDoor.closest('.bottle-container');
                const correctAnswer = parseInt(bottleContainer.dataset.correctDay);
                const bourbonName = bottleContainer.dataset.bourbonName;


                if (isNaN(guess) || guess < 1 || guess > 12) {
                    resultMessage.textContent = 'Please enter a valid number between 1 and 12.';
                    // FIX: Ensure the modal remains unlocked so user can correct the input
                    unlockGuessModal();
                    return;
                }
                lockGuessModal();

                if (guess === correctAnswer) {
                    
                    resultMessage.innerHTML = `<div style="font-size: 1.5rem; color: #B83232; font-weight: bold; margin: 10px 0;">🎉 YES! CORRECT! 🎉</div>${bourbonName} is mini-bottle number ${correctAnswer}!`;

                    // Mark the door as revealed and show the number plate
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
                    
                    // Delay close to show success and confetti animation
                    setTimeout(closeModalAndRestoreScroll, 3000); 
                } else {
                    resultMessage.innerHTML = `❌ Incorrect ❌ That's not the right mini-bottle number. Try another bottle!`;
                    // FIX: Unlock the modal immediately after an incorrect guess
                    unlockGuessModal();
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
        
    } 

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

        generationInterval = setInterval(generateFlflake, intervalTime);
        generateFlake();
    })(75, 5);

    loadProgress();
});