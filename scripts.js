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

            // Extract proof string directly from the <p> tag
            let proof = 'N/A';
            const pTag = card.querySelector('.content p');
            if (pTag) {
                proof = pTag.textContent.trim();
            } else if (card.dataset.proof) {
                proof = `${card.dataset.proof} Proof`;
            }

            // Capture Review URL from the content link
            const reviewLinkElement = card.querySelector('.content a.btn');
            const reviewUrl = reviewLinkElement ? reviewLinkElement.href : '#';

            const imgSrc = card.dataset.img;
            const modalImgSrc = card.dataset.modalImg;

            bourbonData[day] = {
                name,
                proof: proof || 'N/A',
                imgSrc,
                modalImgSrc,
                reviewUrl
            };
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

    // Load progress immediately on init
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
            modalBody.appendChild(contentArea);
        } else {
            contentArea = clone.querySelector('.content') || clone;
            modalBody.appendChild(contentArea);
        }

        // --- MODIFICATION for Number Plate in Modal ---
        if (!bourbonContainer && originalCard) {
            let cardPlate = originalCard.querySelector('.number-plate');
            if (cardPlate) {
                const clonedPlate = cardPlate.cloneNode(true);
                clonedPlate.style.position = 'absolute';
                clonedPlate.style.top = '10px';
                clonedPlate.style.right = '40px';
                clonedPlate.style.zIndex = '99999';
                document.getElementById('modal').querySelector('.modal-inner').appendChild(clonedPlate);
            }
        }

        let imgElement = modalBody.querySelector('img');
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
    if (modal) modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

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
            const day = card.dataset.day;
            const isRevealed = !!scratchedDays[day];

            // ---------------------------------------------------------
            // CRITICAL FIX: Attach Click Event Listener BEFORE returns
            // ---------------------------------------------------------
            card.addEventListener("click", (e) => {
                // Prevent modal opening if clicking the "Review" link
                if (e.target.closest('a') !== null) return;

                // Open modal if the card is revealed (visually or logically)
                if (card.classList.contains("revealed")) {
                    const contentNode = card.querySelector(".content");
                    if (contentNode) openModal(contentNode);
                }
            });

            // Handle Already Revealed State
            if (isRevealed) {
                const contentImg = card.querySelector(".content img");
                if (contentImg) {
                    contentImg.src = card.dataset.img;
                }
                card.classList.add("revealed");

                // Remove scratch element on load if already revealed
                if (scratch) scratch.remove();

                // Exit function; swipe logic not needed, but click listener is active
                return;
            }

            // Safety check: if not revealed yet but scratch is missing
            if (!scratch) return;

            // --- Swipe Logic ---
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
                if (contentImg && card.dataset.img) {
                    contentImg.src = card.dataset.img;
                }

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

        const initializeIndexPage = () => {
            cards.forEach(card => {
                setupSlideLogic(card);
            });
        };

        window.addEventListener('load', () => {
            setTimeout(initializeIndexPage, 100);
        });

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                setTimeout(initializeIndexPage, 100);
            }
        });
    }

    // --- BOURBON GUESSING GAME LOGIC (All-Bottles Page Only) ---
    if (window.location.pathname.endsWith('all-bottles.html')) {
        let fullBourbonList = {};
        try {
            const storedData = localStorage.getItem(BOURBON_DATA_KEY);
            fullBourbonList = storedData ? JSON.parse(storedData) : {};
        } catch (e) {
            console.error("Failed to load full bourbon data.");
        }

        const grid = document.getElementById('grid');
        if (grid) {
            let cardElements = Array.from(grid.querySelectorAll('.card'));
            shuffleArray(cardElements);
            cardElements.forEach(card => grid.appendChild(card));
        }

        const doors = document.querySelectorAll('.door');
        doors.forEach(door => {
            const container = door.closest('.bottle-container');
            const correctDay = container.dataset.correctDay;

            if (matchedDays[correctDay]) {
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
                const bursts = [{ x: 0.2, y: 0.9 }, { x: 0.8, y: 0.9 }];
                bursts.forEach(origin => {
                    confetti({ particleCount: 75, spread: 60, origin, zIndex: 10000 });
                });
            } else {
                console.warn("Confetti library not loaded.");
            }
        };

        // Note: The rest of the guessing game logic (handling clicks on doors, opening guess modal, etc.)
        // was not fully provided in the snippet, but would normally go here.
        // Assuming your existing logic handles the .door clicks separately.
    }
});
