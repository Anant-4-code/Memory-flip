document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const levelIndicator = document.getElementById('level-indicator');
    const matchesIndicator = document.getElementById('matches-indicator');
    const totalPairsIndicator = document.getElementById('total-pairs-indicator');
    const movesIndicator = document.getElementById('moves-indicator');
    const nextLevelButton = document.getElementById('next-level-button');

    const allEmojis = [
        '😀', '😎', '🚀', '💡', '🎉', '📚', '⭐', '🎁', '💎', '🎨', 
        '🎃', '👻', '👽', '🤖', '🧠', '🔥', '🦊', '👑', '🍔', '🍕',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎳', '🎣', '🎽',
        '🥇', '🥈', '🥉', '🏆', '🎖️', '🌍', '🌞', '🌙', '⭐', '🌈',
        '🌊', '🌲', '🌷', '🍁', '🍄', '🌵', '🍀', '🍎', '🍉', '🍓' // 50 emojis
    ];

    let currentLevel = 1;
    let cardsInPlay = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let moves = 0;
    let lockBoard = false; // To prevent clicking more than 2 cards

    const STORAGE_KEY_LEVEL = 'memoryFlipCurrentLevel';
    const STORAGE_KEY_HIGHEST_LEVEL = 'memoryFlipHighestLevel';

    function saveCurrentLevel(level) {
        try {
            localStorage.setItem(STORAGE_KEY_LEVEL, level.toString());
        } catch (e) {
            console.error("Failed to save level to localStorage:", e);
        }
    }

    function loadCurrentLevel() {
        try {
            const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);
            if (savedLevel) {
                const levelNum = parseInt(savedLevel, 10);
                // Ensure the loaded level is not greater than the highest level ever achieved + 1 (or some reasonable cap)
                // This prevents jumping way ahead if localStorage is manually tampered with.
                // For now, let's trust the saved level or cap it by available emojis later.
                if (!isNaN(levelNum) && levelNum > 0) {
                    return levelNum;
                }
            }
        } catch (e) {
            console.error("Failed to load level from localStorage:", e);
        }
        return 1; // Default to level 1 if not found or invalid
    }

    function saveHighestLevelReached(level) {
        try {
            const currentHighest = parseInt(localStorage.getItem(STORAGE_KEY_HIGHEST_LEVEL) || "0", 10);
            if (level > currentHighest) {
                localStorage.setItem(STORAGE_KEY_HIGHEST_LEVEL, level.toString());
            }
        } catch (e) {
            console.error("Failed to save highest level to localStorage:", e);
        }
    }

    function startGame(level) {
        currentLevel = level; // Ensure currentLevel is updated
        saveCurrentLevel(level); // Save the current level for session resume
        saveHighestLevelReached(level); // Save if this is a new highest level

        levelIndicator.textContent = level;
        matchedPairs = 0;
        moves = 0;
        movesIndicator.textContent = moves;
        cardsInPlay = [];
        flippedCards = [];
        gameBoard.innerHTML = '';
        nextLevelButton.style.display = 'none';
        lockBoard = false;

        // Determine number of pairs for the current level
        // Level 1 (demo) = 1 pair (2 cards)
        // Level 2 = 2 pairs (4 cards)
        // Level n = n pairs (2n cards)
        totalPairs = level; 
        matchesIndicator.textContent = matchedPairs;
        totalPairsIndicator.textContent = totalPairs;

        if (totalPairs > allEmojis.length) {
            gameBoard.innerHTML = '<p class="text-2xl text-center col-span-full">Congratulations! You have completed all levels!</p>';
            // Optionally, display a final message or a restart button
            // For now, we stop here if not enough unique emojis for pairs.
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Play Again?';
            restartButton.classList.add('neon-green-bg', 'text-gray-900', 'font-bold', 'py-3', 'px-8', 'rounded-full', 'text-lg', 'start-game-button', 'mt-4');
            restartButton.addEventListener('click', () => { 
                currentLevel = 1; 
                startGame(currentLevel); 
            });
            gameBoard.appendChild(restartButton);
            return;
        }

        const emojisForLevel = allEmojis.slice(0, totalPairs);
        const cardValues = [...emojisForLevel, ...emojisForLevel]; // Create pairs

        shuffleCards(cardValues);

        // Adjust grid columns based on number of cards
        // Max 6 columns for better layout
        let cols = Math.ceil(Math.sqrt(cardValues.length));
        if (cardValues.length > 6 && cardValues.length <= 12) cols = Math.ceil(cardValues.length / 2);
        else if (cardValues.length > 12 && cardValues.length <= 18) cols = Math.ceil(cardValues.length / 3);
        else if (cardValues.length > 18 && cardValues.length <= 24) cols = cardValues.length > 20 ? 6 : Math.ceil(cardValues.length / 4);
        else if (cardValues.length > 24) cols = 6; // cap at 6 for large numbers
        if (cardValues.length === 2) cols = 2;
        if (cardValues.length === 6) cols = 3;
        if (cardValues.length === 8) cols = 4;


        gameBoard.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

        cardValues.forEach(emoji => {
            const cardElement = createCard(emoji);
            gameBoard.appendChild(cardElement);
            cardsInPlay.push(cardElement);
        });
    }

    function shuffleCards(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function createCard(emoji) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;

        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        cardBack.textContent = emoji;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        card.addEventListener('click', handleCardClick);
        return card;
    }

    function handleCardClick(event) {
        if (lockBoard) return;
        const clickedCard = event.currentTarget;
        if (clickedCard === flippedCards[0]) return; // Prevent clicking the same card twice
        if (clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;

        flipCard(clickedCard);
        flippedCards.push(clickedCard);

        if (flippedCards.length === 2) {
            moves++;
            movesIndicator.textContent = moves;
            lockBoard = true; // Lock board while checking
            checkForMatch();
        }
    }

    function flipCard(card) {
        card.classList.add('flipped');
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.emoji === card2.dataset.emoji) {
            disableMatchedCards(card1, card2);
            matchedPairs++;
            matchesIndicator.textContent = matchedPairs;
            if (matchedPairs === totalPairs) {
                // Level complete
                setTimeout(() => {
                    nextLevelButton.style.display = 'inline-block';
                    // Optionally, add a small celebration effect
                }, 500);
                 lockBoard = false; // Unlock board as level is done
            } else {
                resetFlippedCards(true); // True because it's a match
            }
        } else {
            unflipCards(card1, card2);
            resetFlippedCards(false); // False because it's not a match
        }
    }

    function disableMatchedCards(card1, card2) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        // Add glow effect
        card1.classList.add('card-match-glow');
        card2.classList.add('card-match-glow');

        // Remove glow effect after animation (0.8s)
        setTimeout(() => {
            card1.classList.remove('card-match-glow');
            card2.classList.remove('card-match-glow');
        }, 800);

        // No need to remove click listener if we check for '.matched' in handleCardClick
    }

    function unflipCards(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }, 1000); // Wait 1 second before unflipping
    }

    function resetFlippedCards(isMatch) {
        if (isMatch && matchedPairs !== totalPairs) { // only unlock if not end of level
            lockBoard = false;
        }
        if (!isMatch) {
             setTimeout(() => { lockBoard = false; }, 1000); // Unlock after unflip animation
        }
        flippedCards = [];
    }

    nextLevelButton.addEventListener('click', () => {
        currentLevel++;
        startGame(currentLevel);
    });

    // Initial game start
    currentLevel = loadCurrentLevel(); // Load saved level or default to 1
    startGame(currentLevel);
}); 