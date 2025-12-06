document.addEventListener("DOMContentLoaded", () => {
    const cards = Array.from(document.querySelectorAll(".card"));
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    const modalClose = document.getElementById("modalClose");
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    // --- CONSTANTS & PERSISTENCE ---
    const STORAGE_KEY = 'scratchedDays';
    const BOURBON_DATA_KEY = 'allBourbonData';
    const MATCHED_DAYS_KEY = 'matchedDays';
    let scratchedDays = {};
    let matchedDays = {};

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function createAndSaveBourbonData() {
		const bourbonData = {};
		const cards = document.querySelectorAll('.card[data-day]');

		cards.forEach(card => {
			const day = card.dataset.day;
			const name = card.querySelector('h3').textContent;
			// Extract proof from the content paragraph or data attribute
			let proof = card.dataset.proof; 
			if (!proof) { // Check paragraph content as fallback
			    const pTag = card.querySelector('.content p');
			    if (pTag && pTag.textContent.toLowerCase().includes('proof:')) {
			        proof = pTag.textContent.replace('Proof: ', '').replace('%', '').trim();
			    }
			}
			
            // Capture Review URL from the content link
            const reviewLinkElement = card.querySelector('.content a.btn');
            const reviewUrl = reviewLinkElement ? reviewLinkElement.href : '#';
            
			const imgSrc = card.dataset.img; 
			const modalImgSrc = card.dataset.modalImg;

			// Save the reviewUrl along with other data
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
    
	if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
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

    // --- GENERIC MODAL & UI FUNCTIONS ---

    const closeModal = () => modal ? modal.setAttribute("aria-hidden", "true") : null;

    function openModal(node) {
        if (!modalBody || !node || !node.cloneNode) return;
        
        modalBody.innerHTML = "";
        const originalCard = node.closest('.card');
        let modalImgSrc = originalCard ? originalCard.dataset.modalImg : null;

        const clone = node.cloneNode(true);
        
        const bourbonContainer = clone.querySelector('.bottle-container');
        let contentArea;
        
        if (bourbonContainer) {
            contentArea = bourbonContainer.querySelector('.bourbon-content').cloneNode(true);
            const hiddenPlate = contentArea.querySelector('.hidden-number-plate');
            if(hiddenPlate) hiddenPlate.remove();
            modalBody.appendChild(contentArea);
        } else {
            contentArea = clone.querySelector('.content') || clone;
            modalBody.appendChild(contentArea);
        }
        
        // --- MODIFICATION for Number Plate in Modal (Index Page) ---
        if (!bourbonContainer) {
            let cardPlate = originalCard.querySelector('.number-plate');
            if (cardPlate) {
                const clonedPlate = cardPlate.cloneNode(true);
                
                clonedPlate.style.position = 'absolute';
                clonedPlate.style.top = '10px';
                clonedPlate.style.right = '50px'; 
                clonedPlate.style.zIndex = '99999'; 
                
                document.getElementById('modal').querySelector('.modal-inner').appendChild(clonedPlate);
            }
        }
        // --- END MODIFICATION ---

        let imgElement = modalBody.querySelector('img');

        // Apply the high-res modal image source if available
        if (imgElement && modalImgSrc) {
            imgElement.src = modalImgSrc;
        }
        
        const h3 = contentArea.querySelector('h3');
        const p = contentArea.querySelector('p');
        const btn = contentArea.querySelector('.btn');
        
        if (h3) h3.style.display = 'block';
        if (p) p.style.display = 'block';
        if (btn) btn.style.display = 'inline-block';
        
        if (modal) modal.setAttribute("aria-hidden", "false");
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    // Add logic to update the main card image when the modal is closed
    if (modal) modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
        
        // Check if we are on the index page and if the modal is being closed
        if ((window.location.pathname.endsWith('index.html') || window.location.pathname === '/') && (e.target === modal || e.target === modalClose)) {
            // Find the card that was revealed/clicked to open the modal (not trivial, but can be done by checking the modal content source)
            // For now, let's rely on the logic inside revealCard to handle the image update before the modal opens.
            // If the user simply clicks the modal close button, the card image should already be correct.
        }
    });
    
    // Attach reset button functionality
    const resetBtnEl = document.getElementById('resetProgressBtn');
    const resetPageBtnEl = document.getElementById('resetPageBtn');
    if (resetBtnEl) resetBtnEl.addEventListener('click', resetProgress);
    if (resetPageBtnEl) resetPageBtnEl.addEventListener('click', () => window.location.reload());

    // --- NAVIGATION / MENU LOGIC (Omitted for brevity, assuming original is sufficient) ---
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
            window.location.href = confirmedLinkHref;
        }
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


    // --- SLIDE/SWIPE REVEAL LOGIC (Index Page Only) ---
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        
        const REVEAL_THRESHOLD_PERCENT = 60;
        
        function setupSlideLogic(card) {
            const scratch = card.querySelector(".scratch");
            if (!scratch) return;

            const day = card.dataset.day;
            const isRevealed = !!scratchedDays[day];
            
            if (isRevealed) {
                // If already revealed, ensure the correct image is shown on load
                const contentImg = card.querySelector(".content img");
                if (contentImg) {
                    contentImg.src = card.dataset.img;
                }
                card.classList.add("revealed");
                
                // FIX: Remove scratch element on load if already revealed
                if(scratch) scratch.remove();
                
                return;
            }

            let startX = null;
            let currentX = 0;
            let cardWidth = card.clientWidth;
            let pointerId = null; 

            const updateDoorPosition = (deltaX) => {
                const percentage = (deltaX / cardWidth) * 100;
                const clampedPercentage = Math.min(100, Math.max(0, percentage));
                scratch.style.transform = `translateX(${clampedPercentage}%)`;
                currentX = deltaX;
            };
            
            const revealCard = () => {
                card.classList.add("revealed");
                saveProgress(STORAGE_KEY, day);
                scratch.style.pointerEvents = 'none';
                
                // --- FIX: Change the content image source to the correct bourbon image ---
                const contentImg = card.querySelector(".content img");
                if (contentImg && card.dataset.img) {
                    contentImg.src = card.dataset.img;
                }
                // ------------------------------------------------------------------------
                
                // *** FIX: JS removal of the sliding door after animation ***
                // This guarantees the image is cleared, solving the artifact issue.
                setTimeout(() => {
                    if(scratch) scratch.remove();
                }, 100); // Matches the 0.3s transition duration
                // **********************************************************

                // Show modal after a brief delay to allow animation to complete
                setTimeout(() => {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }, 350); 
            };

            const onStart = (clientX, id, e) => {
                if (card.classList.contains("revealed")) return;
                startX = clientX;
                currentX = 0;
                cardWidth = card.clientWidth; 
                scratch.style.transition = 'none';
                pointerId = id;
                e.preventDefault(); 
            };

            const onMove = (clientX, e) => {
                if (startX === null || card.classList.contains("revealed")) return;
                const deltaX = clientX - startX;
                if (deltaX > 0) { // Only allow swiping right
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
                onStart(e.clientX, e.pointerId, e);
            });

            scratch.addEventListener("pointermove", e => {
                if (pointerId !== null && e.pointerId === pointerId) {
                    onMove(e.clientX, e); 
                }
            });

            scratch.addEventListener("pointerup", onEnd);
            scratch.addEventListener("pointercancel", onEnd);
            
            // --- Click handler for modal on revealed cards ---
            card.addEventListener("click", (e) => {
                if (e.target.closest('a') !== null) return;
                
                if (card.classList.contains("revealed")) {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            });
        }
        
        cards.forEach(card => {
            setupSlideLogic(card);
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
        
        // 1. Randomize Cards on Load
        const grid = document.getElementById('grid');
        if (grid) {
             let cardElements = Array.from(grid.querySelectorAll('.card'));
             shuffleArray(cardElements);
             cardElements.forEach(card => grid.appendChild(card));
        }
        
        // 2. Load Matched Progress
        const doors = document.querySelectorAll('.door');
        doors.forEach(door => {
             const container = door.closest('.bottle-container');
             const correctDay = container.dataset.correctDay;
             
             if(matchedDays[correctDay]) {
                 door.classList.add('revealed');
                 door.style.pointerEvents = 'none';
                 
                 const numberPlate = container.querySelector('.hidden-number-plate');
                 if (numberPlate) {
                    numberPlate.textContent = correctDay;
                    numberPlate.classList.add('show-number');
                 }
             }
        });


        const launchConfetti = () => {
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
        const modalBourbonImage = document.getElementById('modalBourbonImage');
        const modalBourbonNameGuessPrompt = document.getElementById('modalBourbonNameGuessPrompt');
        let currentDoor = null;
        
        const modalNameLink = document.getElementById('modalBourbonNameLink'); 

        // --- FIX: Stop click propagation for the link inside the guess modal ---
        if (modalNameLink) {
            modalNameLink.addEventListener('click', function(e) {
                // Prevents the click from bubbling up to the modal background/document, which triggers closing the modal.
                e.stopPropagation(); 
            });
        }
        // -----------------------------------------------------------------------


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
                
                // Fetch details from local storage for proof/flavor/image/link
                const details = fullBourbonList[correctDay] || {};
                const proof = details.proof || 'N/A';
                const imgSrc = details.imgSrc || ''; // Use main image for thumbnail
                const reviewUrl = details.reviewUrl || '#'; // Fetch the saved review URL
                
                
                let currentNameElement = document.getElementById('modalBourbonName');
                const nameLinkElement = document.getElementById('modalBourbonNameLink'); // Get the new link element
                
                if (currentNameElement) {
                     currentNameElement.textContent = bourbonName || 'this bottle';
                }
                
                if (nameLinkElement) {
                    nameLinkElement.href = reviewUrl; // Set the href attribute
                }
                
                const modalBourbonProof = document.getElementById('modalBourbonProof');
                const proofText = proof !== 'N/A' && !String(proof).includes('%') ? `${proof}%` : proof;
                if (modalBourbonProof) modalBourbonProof.textContent = ` (Proof: ${proofText})`;  
                if (modalBourbonNameGuessPrompt) modalBourbonNameGuessPrompt.textContent = bourbonName || 'this bottle';
                
                if (modalBourbonImage && imgSrc) {
                    modalBourbonImage.src = imgSrc;
                    modalBourbonImage.style.display = 'block'; 
                } else if (modalBourbonImage) {
                    modalBourbonImage.style.display = 'none';
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
                    unlockGuessModal();
                    return;
                }
                lockGuessModal();

                if (guess === correctAnswer) {
                    
                    resultMessage.innerHTML = `<div style="font-size: 1.5rem; color: #B83232; font-weight: bold; margin: 10px 0;">🎉 YES! CORRECT! 🎉</div>${bourbonName} is mini-bottle number ${correctAnswer}!`;

                    // Mark the door as revealed and show the number plate
                    currentDoor.classList.add('revealed');
                    currentDoor.style.pointerEvents = 'none';
                    saveProgress(MATCHED_DAYS_KEY, correctAnswer);

                    const numberPlate = bottleContainer.querySelector('.hidden-number-plate');
                    if (numberPlate) {
                        numberPlate.textContent = correctAnswer;
                        numberPlate.classList.add('show-number');
                    }
                    window.requestAnimationFrame(() => {
                        launchConfetti();
                    });
                    
                    // Delay close to show success and confetti animation
                    setTimeout(closeModalAndRestoreScroll, 3000); 
                } else {
                    resultMessage.innerHTML = `❌ Incorrect ❌ That's not the right mini-bottle number. Try another bottle!`;
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
    
    // --- UNIVERSAL REVEALED CARD CLICK HANDLER (for all-bottles and all-bottles-numbers) ---
    const currentPath = window.location.pathname;
    const isRevealPage = currentPath.endsWith('all-bottles-numbers.html');
    const isMatchingPage = currentPath.endsWith('all-bottles.html');

    if (isRevealPage || isMatchingPage) {
        const revealedCards = document.querySelectorAll('.card.revealed[data-clickable="true"]');
        revealedCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a') || e.target.closest('button')) return;
                
                const container = card.querySelector('.bottle-container');
                const door = container ? container.querySelector('.door') : null;
                
                if (isMatchingPage && door && !door.classList.contains('revealed')) {
                     door.click(); 
                     return;
                }
                
                const contentNode = card.querySelector('.content') || container;
                if (contentNode) openModal(contentNode);
            });
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

        generationInterval = setInterval(generateFlake, intervalTime);
        generateFlake();
    })(75, 5);

    loadProgress();
});