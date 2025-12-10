document.addEventListener("DOMContentLoaded", () => {
    // --- GLOBAL SELECTORS ---
    const modal = document.getElementById("modal"); // Generic modal (Index page)
    const modalBody = document.getElementById("modal-body");
    const modalClose = document.getElementById("modalClose");
    const grid = document.getElementById('grid'); 

    // --- CONSTANTS & PERSISTENCE ---
    const STORAGE_KEY = 'scratchedDays';
    const BOURBON_DATA_KEY = 'allBourbonData';
    const MATCHED_DAYS_KEY = 'matchedDays';
    let scratchedDays = {};
    let matchedDays = {};

    // --- HELPER FUNCTIONS ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Scrapes data from HTML cards to save to LocalStorage (runs on Index)
    function createAndSaveBourbonData() {
        const bourbonData = {};
        const cards = document.querySelectorAll('.card[data-day]');

        cards.forEach(card => {
            const day = card.dataset.day;
            const name = card.querySelector('h3').textContent;

            let proof = 'N/A';
            const pTag = card.querySelector('.content p');
            if (pTag) proof = pTag.textContent.trim();
            else if (card.dataset.proof) proof = `${card.dataset.proof} Proof`;

            const reviewLinkElement = card.querySelector('.content a.btn');
            const reviewUrl = reviewLinkElement ? reviewLinkElement.href : '#';
            const imgSrc = card.dataset.img;
            const modalImgSrc = card.dataset.modalImg;

            bourbonData[day] = { name, proof: proof || 'N/A', imgSrc, modalImgSrc, reviewUrl };
        });

        try {
            if (Object.keys(bourbonData).length > 0) {
                localStorage.setItem(BOURBON_DATA_KEY, JSON.stringify(bourbonData));
            }
        } catch (e) {
            console.error("Error saving bourbon data:", e);
        }
    }
	// --- PRELOAD LOGIC (Speed Boost) ---
		// Start downloading the high-res image as soon as the user hovers over a card
		const allCards = document.querySelectorAll('.card');
		allCards.forEach(card => {
			card.addEventListener('mouseenter', () => {
				const modalImg = card.dataset.modalImg;
				if (modalImg) {
					const preload = new Image();
					preload.src = modalImg; // Browser caches this automatically
				}
			}, { once: true }); // Ensure this only runs once per card
			
			// Also trigger on touchstart for mobile users to get a slight head start
			card.addEventListener('touchstart', () => {
				const modalImg = card.dataset.modalImg;
				if (modalImg) {
					const preload = new Image();
					preload.src = modalImg;
				}
			}, { once: true, passive: true });
		});
    // Only run data creation if we are on a page that has data-day cards (Index)
    if (document.querySelector('.card[data-day]')) {
        createAndSaveBourbonData();
    }

    function loadProgress() {
        try {
            const storedScratched = localStorage.getItem(STORAGE_KEY);
            scratchedDays = storedScratched ? JSON.parse(storedScratched) : {};
            const storedMatched = localStorage.getItem(MATCHED_DAYS_KEY);
            matchedDays = storedMatched ? JSON.parse(storedMatched) : {};
        } catch (e) {
            console.error("Error loading progress:", e);
        }
    }

    loadProgress();

    function saveProgress(key, day) {
        if (!day) return;
        let storage = key === STORAGE_KEY ? scratchedDays : matchedDays;
        storage[day] = true;
        try {
            localStorage.setItem(key, JSON.stringify(storage));
        } catch (e) {
            console.error("Error saving progress:", e);
        }
    }

    function resetProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(MATCHED_DAYS_KEY);
            localStorage.removeItem('semiSpoiler');
            localStorage.removeItem('majorSpoiler');
            window.location.reload();
        } catch (e) {
            console.error("Error clearing progress:", e);
        }
    }

    // --- GENERIC MODAL (Used for Index & Reveal Pages) ---
    const closeModal = () => {
        if (!modal) return;
        modal.setAttribute("aria-hidden", "true");
        
        // Remove any injected number plates to prevent stacking
        const modalInner = modal.querySelector('.modal-inner');
        if (modalInner) {
            const existingPlate = modalInner.querySelector('.number-plate');
            if (existingPlate) existingPlate.remove();
        }
    };

    function openModal(node) {
        if (!modalBody || !node || !node.cloneNode) return;

        // 1. Clean up previous content
        modalBody.innerHTML = "";
        
        // 2. Clean up previous number plates
        const modalInner = document.getElementById('modal').querySelector('.modal-inner');
        const existingPlate = modalInner.querySelector('.number-plate');
        if (existingPlate) existingPlate.remove();

        const originalCard = node.closest('.card');
        let modalImgSrc = originalCard ? originalCard.dataset.modalImg : null;

        const clone = node.cloneNode(true);
        const bourbonContainer = clone.querySelector('.bottle-container');
        let contentArea;

        // Determine if we are cloning a complex Matching Card or a Simple Index Card
        if (bourbonContainer) {
            contentArea = bourbonContainer.querySelector('.bourbon-content').cloneNode(true);
            modalBody.appendChild(contentArea);
        } else {
            contentArea = clone.querySelector('.content') || clone;
            modalBody.appendChild(contentArea);
        }

        // 3. Inject Number Plate (Updated to work for all pages)
        if (originalCard) {
            let cardPlate = originalCard.querySelector('.number-plate');
            
            // Check if the plate exists and is meant to be visible (has show-number if it's a hidden type)
            const isHiddenType = cardPlate && cardPlate.classList.contains('hidden-number-plate');
            const isVisible = cardPlate && (!isHiddenType || cardPlate.classList.contains('show-number'));

            if (cardPlate && isVisible) {
                const clonedPlate = cardPlate.cloneNode(true);
                clonedPlate.style.position = 'absolute';
                clonedPlate.style.top = '10px';
                clonedPlate.style.right = '50px'; 
                clonedPlate.style.zIndex = '99990'; 
                
                // Ensure the clone is visible even if it was hidden in the card flow
                if (isHiddenType) {
                    clonedPlate.style.display = 'block';
                }

                modalInner.appendChild(clonedPlate);
            }
        }

	// 4. Update Image Source to High Res Modal Version (The "Blur-Up" Fix)
			let imgElement = modalBody.querySelector('img');
			if (imgElement && modalImgSrc) {
				// A. Add a class to indicate we are waiting (for CSS styling)
				imgElement.classList.add('img-loading');

				// B. Load the high-res image in the background
				const highRes = new Image();
				highRes.src = modalImgSrc;
				
				// C. Once loaded, swap the src and remove the loading class
				highRes.onload = () => {
					imgElement.src = modalImgSrc;
					imgElement.classList.remove('img-loading');
				};
			}

        // 5. Force elements to display block (since they are hidden in grid view)
        const h3 = contentArea.querySelector('h3');
        const p = contentArea.querySelector('p');
        const btn = contentArea.querySelector('.btn');

        if (h3) h3.style.display = 'block';
        if (p) p.style.display = 'block';
        if (btn) btn.style.display = 'inline-block';

        if (modal) modal.setAttribute("aria-hidden", "false");
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modal) modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // --- GLOBAL BUTTONS ---
    const resetBtnEl = document.getElementById('resetProgressBtn');
    const resetPageBtnEl = document.getElementById('resetPageBtn');
    
    // Index Page Reset
    if (resetBtnEl) resetBtnEl.addEventListener('click', resetProgress);
    // Matching Page Reset
    if (resetPageBtnEl) resetPageBtnEl.addEventListener('click', resetProgress);

    // --- MENU LOGIC ---
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
                confirmTitle.textContent = link.dataset.confirmTitle || "Confirm Navigation";
                confirmMessage.innerHTML = link.dataset.confirmMessage || "Are you sure you want to visit this page?";
                confirmedLinkHref = link.href;
                if (confirmModalEl) confirmModalEl.setAttribute("aria-hidden", "false");
                if (mobileMenu) mobileMenu.classList.remove('open');
            }
        });
    });

    // ==========================================
    // LOGIC 1: INDEX PAGE (SWIPE DOORS)
    // ==========================================
    const isIndexPage = document.querySelector('.scratch') !== null;
    
    if (isIndexPage) {
        const REVEAL_THRESHOLD_PERCENT = 60;
        const cards = Array.from(document.querySelectorAll(".card"));

        function setupSlideLogic(card) {
            const scratch = card.querySelector(".scratch");
            const day = card.dataset.day;
            const isRevealed = !!scratchedDays[day];

            card.addEventListener("click", (e) => {
                if (e.target.closest('a') !== null) return;
                // Only open modal if revealed
                if (card.classList.contains("revealed")) {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            });

            if (isRevealed) {
                const contentImg = card.querySelector(".content img");
                if (contentImg) contentImg.src = card.dataset.img;
                card.classList.add("revealed");
                if (scratch) scratch.remove();
                return;
            }

            if (!scratch) return;

            let startX = null;
            let startY = null;
            let currentX = 0;
            let pointerId = null;

            const updateDoorPosition = (deltaX, currentCardWidth) => {
                const percentage = (deltaX / currentCardWidth) * 100;
                const clampedPercentage = Math.min(100, Math.max(0, percentage));
                scratch.style.transform = `translateX(${clampedPercentage}%)`;
                currentX = deltaX;
            };

            const revealCard = () => {
                card.classList.add("revealed");
                saveProgress(STORAGE_KEY, day);
                scratch.style.pointerEvents = 'none';

                const contentImg = card.querySelector(".content img");
                if (contentImg && card.dataset.img) contentImg.src = card.dataset.img;

                if (scratch) scratch.remove();

                setTimeout(() => {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }, 350);
            };

            const onStart = (clientX, id, e) => {
                if (card.classList.contains("revealed")) return;
                const cardWidth = card.getBoundingClientRect().width;
                if (cardWidth === 0) return;
                startX = clientX;
                startY = e.clientY;
                currentX = 0;
                scratch.style.transition = 'none';
                pointerId = id;
            };

            const onMove = (clientX, clientY, e) => {
                if (startX === null || card.classList.contains("revealed")) return;
                const deltaX = clientX - startX;
                const deltaY = Math.abs(clientY - startY);
                if (deltaX > 5 && deltaX > deltaY) {
                    e.preventDefault();
                    const cardWidth = card.getBoundingClientRect().width;
                    updateDoorPosition(deltaX, cardWidth);
                }
            };

            const onEnd = () => {
                if (startX === null || card.classList.contains("revealed")) return;
                const cardWidth = card.getBoundingClientRect().width;
                scratch.style.transition = 'transform 0.3s ease-in-out';
                const percentageSwiped = (currentX / cardWidth) * 100;
                if (percentageSwiped >= REVEAL_THRESHOLD_PERCENT) {
                    revealCard();
                } else {
                    scratch.style.transform = 'translateX(0)';
                }
                startX = null;
                pointerId = null;
            };

            scratch.addEventListener("pointerdown", e => {
                e.target.setPointerCapture(e.pointerId);
                onStart(e.clientX, e.pointerId, e);
            });
            scratch.addEventListener("pointermove", e => {
                if (pointerId !== null && e.pointerId === pointerId) {
                    onMove(e.clientX, e.clientY, e);
                }
            });
            scratch.addEventListener("pointerup", onEnd);
            scratch.addEventListener("pointercancel", onEnd);
        }

        const initializeIndexPage = () => cards.forEach(card => setupSlideLogic(card));
        window.addEventListener('load', () => setTimeout(initializeIndexPage, 100));
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) setTimeout(initializeIndexPage, 100);
        });
    }

    // ==========================================
    // LOGIC 2: MATCHING GAME (all-bottles.html)
    // ==========================================
    const isMatchingGame = document.querySelector('.door') !== null;

    if (isMatchingGame) {
        // --- TIMER VARIABLE TO PREVENT BUG ---
        let autoCloseTimer = null;

        let fullBourbonList = {};
        try {
            const storedData = localStorage.getItem(BOURBON_DATA_KEY);
            fullBourbonList = storedData ? JSON.parse(storedData) : {};
        } catch (e) {
            console.error("Failed to load full bourbon data.");
        }

        if (grid) {
            try {
                let cardElements = Array.from(grid.querySelectorAll('.card'));
                shuffleArray(cardElements);
                cardElements.forEach(card => grid.appendChild(card));
            } catch (err) {
                console.error("Shuffle failed", err);
            } finally {
                grid.style.visibility = 'visible';
                grid.style.opacity = '1';
            }
        }

        const doors = document.querySelectorAll('.door');
        doors.forEach(door => {
            const container = door.closest('.bottle-container');
            const correctDay = container.dataset.correctDay;
            if (matchedDays[correctDay]) {
                door.classList.add('revealed');
                door.style.pointerEvents = 'none';
                
                // Persistence for Badge
                container.setAttribute('data-matched', 'true');
                
                const numberPlate = container.querySelector('.hidden-number-plate');
                if (numberPlate) {
                    numberPlate.textContent = correctDay;
                    numberPlate.classList.add('show-number');
                }
            }
        });

        // --- GAME MODAL LOGIC (Guessing) ---
        const guessModal = document.getElementById('guessModal');
        const guessCloseButton = guessModal ? guessModal.querySelector('.close-button') : null;
        
        // SELECT ALL GRID BUTTONS
        const numberButtons = document.querySelectorAll('.num-btn');
        
        const resultMessage = document.getElementById('resultMessage');
        const modalBourbonImage = document.getElementById('modalBourbonImage');
        const modalBourbonNameGuessPrompt = document.getElementById('modalBourbonNameGuessPrompt');
        const modalBourbonName = document.getElementById('modalBourbonName');
        const modalBourbonProof = document.getElementById('modalBourbonProof');
        const modalBourbonNameLink = document.getElementById('modalBourbonNameLink');

        let currentDoor = null;
        let currentCorrectDay = null;

        const toggleGameModal = (show) => {
            // *** CLEAR TIMER WHENEVER MODAL STATE CHANGES ***
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                autoCloseTimer = null;
            }

            if (!guessModal) return;
            if (show) {
                guessModal.setAttribute("aria-hidden", "false"); 
                guessModal.style.display = "flex"; 
                guessModal.style.visibility = "visible";
                guessModal.style.opacity = "1";
            } else {
                guessModal.setAttribute("aria-hidden", "true");
                guessModal.style.display = "none";
                guessModal.style.visibility = "hidden";
                guessModal.style.opacity = "0";
            }
        };

        // --- DOOR CLICK HANDLER ---
        document.querySelectorAll('.door').forEach(door => {
            door.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); 
                const container = door.closest('.bottle-container');
                const name = container.dataset.bourbonName;
                const correctDay = container.dataset.correctDay;
                const imgSrc = container.querySelector('img').src;
                const proofText = container.querySelector('p').textContent;
                const reviewUrl = container.querySelector('.btn').href;

                currentDoor = door;
                currentCorrectDay = correctDay;

                if (modalBourbonImage) modalBourbonImage.src = imgSrc;
                if (modalBourbonName) modalBourbonName.textContent = name;
                if (modalBourbonNameGuessPrompt) modalBourbonNameGuessPrompt.textContent = name;
                if (modalBourbonProof) modalBourbonProof.textContent = proofText;
                if (modalBourbonNameLink) modalBourbonNameLink.href = reviewUrl;

                if (resultMessage) resultMessage.textContent = '';
                resultMessage.style.color = "#1A3D36"; // Reset color

                // *** UNLOCK BUTTONS WHEN OPENING A NEW DOOR ***
                numberButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                });

                toggleGameModal(true);
            });
        });

        if (guessCloseButton) guessCloseButton.addEventListener('click', () => toggleGameModal(false));
        window.addEventListener('click', (e) => { if (e.target === guessModal) toggleGameModal(false); });

        // --- GRID BUTTON HANDLER ---
        numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const guess = parseInt(e.target.dataset.value, 10);
                handleGuess(guess);
            });
        });

        function handleGuess(guess) {
            // 1. LOCK ALL BUTTONS IMMEDIATELY 
            numberButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            });

            if (guess === parseInt(currentCorrectDay, 10)) {
                // --- CORRECT ---
                resultMessage.innerHTML = "<strong>Correct bottle! Cheers!</strong>";
                resultMessage.style.color = "green";
                
                if (currentDoor) {
                    currentDoor.classList.add('revealed');
                    currentDoor.style.pointerEvents = 'none';
                    
                    const container = currentDoor.closest('.bottle-container');
                    container.setAttribute('data-matched', 'true');
                    
                    const numberPlate = container.querySelector('.hidden-number-plate');
                    if (numberPlate) {
                        numberPlate.textContent = currentCorrectDay;
                        numberPlate.classList.add('show-number');
                    }
                }
                
                saveProgress(MATCHED_DAYS_KEY, currentCorrectDay);
                if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10001 });

            } else {
                // --- INCORRECT ---
                const modalContent = document.querySelector('#guessModal .modal-content');
                if (modalContent) {
                    modalContent.classList.add('shake');
                    setTimeout(() => modalContent.classList.remove('shake'), 400);
                }

                resultMessage.textContent = "Wrong bottle! Try another one...";
                resultMessage.style.color = "#B83232";
            }
            
            // --- CLOSE MODAL AFTER 4 SECONDS (Assign to timer variable) ---
            autoCloseTimer = setTimeout(() => toggleGameModal(false), 4000); 
        }
    }

    // ==========================================
    // LOGIC 3: ENSURE GRID VISIBILITY (For pages without doors)
    // ==========================================
    if (!isIndexPage && !isMatchingGame && grid) {
        grid.style.visibility = 'visible';
        grid.style.opacity = '1';
    }

    // ==========================================
    // LOGIC 4: CLICKABLE CARDS (Universal Handler)
    // ==========================================
    const clickableCards = document.querySelectorAll('.card[data-clickable="true"]');
    
    clickableCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;
            if (e.target.closest('.door')) return;

            const door = card.querySelector('.door');
            if (door && !door.classList.contains('revealed')) {
                return; 
            }

            const contentNode = card.querySelector('.content');
            if (contentNode) openModal(contentNode);
        });
    });

});