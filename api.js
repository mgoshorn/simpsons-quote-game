// Number of quotes to load per request - max is 9
const loadNumber = 9;

// Collection of elements that need to be accessed by scripts
const elements = {
    mainHeader: document.querySelector('header > h1'),
    secondaryHeader: document.querySelector('header > h2'),
    contentArea: document.getElementById('content-area'),
    characterArea: document.getElementById('character-area'),
    quoteArea: document.getElementById('quote-box'),
    score: document.getElementById('score'),
    characters: document.getElementById('character-area').children
}

// Object which holds game state
const game = {
    score: 0,
    quotesAsked: 0,
    correctAnswers: 0,
    currentQuote: undefined,
    currentOptions: [],
    currentCorrectAnswer: undefined,
    ready: false
}

// Map of characters by character name, holds full character data
const characters = new Map();

// Array of character names, for convenient random access to character map
const characterNames = [];

/**
 * Initiates the intro which plays on page load
 */
const initiateIntro = function() {
    elements.mainHeader.addEventListener('animationend', function unhideH2() {
        elements.secondaryHeader.classList.remove('hidden');
        elements.mainHeader.removeEventListener('animationend', unhideH2);
    });

    elements.secondaryHeader.addEventListener('transitionend', function unhideContentArea() {
        elements.contentArea.classList.remove('hidden');
        elements.secondaryHeader.removeEventListener('transitionend', unhideContentArea);
    });

    elements.mainHeader.classList.remove('hidden');
}

/**
 * Loads data from API and adds it to the characters map and characterNames array
 */
const loadData = async function() {
    const endpoint = `https://thesimpsonsquoteapi.glitch.me/quotes?count=${loadNumber}`;
    const response = await fetch(endpoint);
    const data = await response.json();

    data.forEach( o => {
        // If a mapping exists, add the quote to quote set
        if(characters.has(o.character)) {
            characters.get(o.character).quotes.add(o.quote);
        } else {
            // If a mapping does not exist, create the mapping, quote set, and set all information
            const quotes = new Set();
            characters.set(o.character, {...o, quotes: quotes });
            quotes.add(o.quote);
            // Add character to characterNames array if not present
            if (!characterNames.includes(o.character)) 
                characterNames.push(o.character);
        }
    });
}

/**
 * Sets quote and character options into current game state
 */
const setNextRoundQuote = function() {
    // Get random character
    const roundNames = getCharacterSet();
    game.currentCorrectAnswer = roundNames[0];
    shuffle(roundNames);
    game.currentOptions = [...roundNames];
    game.currentQuote = getRandomQuote(characters.get(game.currentCorrectAnswer).quotes);
}

/**
 * Gets a random quote given a set of quotes
 * @param {Set} set 
 */
const getRandomQuote = function(set) {
    const index = Math.floor(Math.random() * set.size);
    let counter = 0;
    for(let key of set.keys()) {
        if (counter++ === index) {
            return key;
        }
    }
}

/**
 * Gets an array of 4 random unique character names from the characterNames array
 */
const getCharacterSet = function() {
    const maxValue = characterNames.length;
    const characterIndices = [];
    while (characterIndices.length < 4) {
        const index = Math.floor(Math.random() * maxValue);
        if (!characterIndices.includes(index)) characterIndices.push(index);
    }
    return characterIndices.map(i => characterNames[i]);
}

/**
 * Sets up initial game data and UI for first questions
 */
const gameSetup = async function() {
    initiateIntro();

    while(characters.size < 4 && characterNames.length < 4) {
        await loadData();
    }

    setNextRoundQuote();
    updateViewForNextRound();

    for(let i = 0; i < elements.characters.length; i++) {
        elements.characters[i].addEventListener('click', processSelection);
    }

    game.ready = true;
}

/**
 * Process a click on a character card
 */
const processSelection = function() {
    if (!game.ready) return;
    game.ready = false;
    const selection = this.dataset.character;
    
    // Set classes which change character card backgrounds to red or green
    for(let e of elements.characters) {
        if (e.dataset.character === game.currentCorrectAnswer) {
            e.classList.add('correct');
        } else {
            e.classList.add('incorrect');
        }
    }

    // Add a point to player score if they selected correctly
    if(selection === game.currentCorrectAnswer) {
        game.score++;
        updateScores();
    }

    // Begin handlers to process UI animations and state updates
    setTimeout(() => {
        // Hide quote area offscreen
        elements.quoteArea.classList.add('offscreen');
        
        // Prep shuffled array of indicies to randomize the drop off of character cards 
        const order = [0, 1, 2, 3];
        shuffle(order);
        for(let i = 0; i < order.length; i++) {

            // Sets a timeout for each character card, staggering them using i
            setTimeout(() => {
                
                // Place character card off screen
                elements.characters[order[i]].classList.add('offscreen');

                // Start resetting view for next quote after final card is offscreen
                if (i == order.length - 1) {
                    setTimeout( async () => {

                        // Load more data - API is small so this could probably be avoided after a few times
                        await loadData();

                        // Set quote data for next round
                        setNextRoundQuote();

                        // Update elements for next round
                        updateViewForNextRound();
                        game.ready = true;
                    }, 200);
                }
            }, 100*i)
        }
    }, 400);
}

/**
 * Updates UI elements to be sync with current game state
 * to be called in transition between rounds
 */
const updateViewForNextRound = function() {
    // Sets quote to new quote
    elements.quoteArea.innerText = game.currentQuote;
    const options = elements.characters;

    // Set character portraits to match current game state character options
    for (let i = 0; i < options.length && i < game.currentOptions.length; i++) {
        options[i].children[0].src = characters.get(game.currentOptions[i]).image;
        options[i].dataset.character = game.currentOptions[i];

        // Set flip class for character portraits based on their directionality
        if (characters.get(game.currentOptions[i]).characterDirection === 'Left') {
            options[i].classList.remove('flip');
        } else {
            options[i].classList.add('flip');
        }
    }

    // Remove offscreen class to bring quote back on screen
    elements.quoteArea.classList.remove('offscreen');
    
    // Remove classes which colored correct/incorrect answers and offscreen to return
    // portraits to the screen
    for(let i = 0; i < elements.characters.length; i++) {
        elements.characters[i].classList.remove('correct');
        elements.characters[i].classList.remove('incorrect');
        elements.characters[i].classList.remove('offscreen');
    }

}

/**
 * Updates score in UI to match game state
 */
const updateScores = function() {
    elements.score.innerText = game.score;
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

gameSetup();