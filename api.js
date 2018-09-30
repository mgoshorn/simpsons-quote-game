const loadNumber = 9;

const elements = {
    mainHeader: document.querySelector("header > h1"),
    secondaryHeader: document.querySelector("header > h2"),
    contentArea: document.getElementById("content-area"),
    characterArea: document.getElementById('character-area'),
    quoteArea: document.getElementById('quote-box'),
    score: document.getElementById('score'),
    characters: document.getElementById('character-area').children
}

const game = {
    score: 0,
    quotesAsked: 0,
    correctAnswers: 0,
    currentQuote: undefined,
    currentOptions: [],
    currentCorrectAnswer: undefined,
    ready: false
}

const characters = new Map();
const characterNames = [];

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

const loadData = async function() {
    console.log('loading data');
    const endpoint = `https://thesimpsonsquoteapi.glitch.me/quotes?count=${loadNumber}`;
    const response = await fetch(endpoint);
    const data = await response.json();

    data.forEach( o => {
        if(characters.has(o.character)) {
            characters.get(o.character).quotes.add(o.quote);
        } else {
            const quotes = new Set();
            characters.set(o.character, {...o, quotes: quotes });
            quotes.add(o.quote);
            if (!characterNames.includes(o.character)) 
                characterNames.push(o.character);
        }
    });
}

const setNextRoundQuote = function() {
    // Get random character
    const roundNames = getCharacterSet();
    game.currentCorrectAnswer = roundNames[0];
    shuffle(roundNames);
    game.currentOptions = [...roundNames];
    game.currentQuote = getRandomQuote(characters.get(game.currentCorrectAnswer).quotes);
}

const getRandomQuote = function(set) {
    const index = Math.floor(Math.random() * set.size);
    let counter = 0;
    for(let key of set.keys()) {
        if (counter++ === index) {
            return key;
        }
    }
}

const getCharacterSet = function() {
    const maxValue = characterNames.length;
    const characterIndices = [];
    console.log(`Max value: ${maxValue}`);
    while (characterIndices.length < 4) {
        const index = Math.floor(Math.random() * maxValue);
        console.log(index);
        if (!characterIndices.includes(index)) characterIndices.push(index);
    }
    console.log(characterIndices);
    return characterIndices.map(i => characterNames[i]);
}

const gameSetup = async function() {
    let count = 0;
    while(characters.size < 4 && characterNames.length < 4 && ++count < 2) {
        await loadData();
    }

    setNextRoundQuote();
    updateViewForNextRound();

    for(let i = 0; i < elements.characters.length; i++) {
        elements.characters[i].addEventListener('click', processSelection);
    }

    game.ready = true;
}

const processSelection = function() {
    if (!game.ready) return;
    game.ready = false;
    const selection = this.dataset.character;
    
    for(let e of elements.characters) {
        if (e.dataset.character === game.currentCorrectAnswer) {
            e.classList.add('correct');
        } else {
            e.classList.add('incorrect');
        }
    }
    console.log(selection);
    console.log(game.currentCorrectAnswer);
    if(selection === game.currentCorrectAnswer) {
        game.score++;
        updateScores();
    }

    setTimeout(() => {
        elements.quoteArea.classList.add('offscreen');
        const order = [0, 1, 2, 3];
        shuffle(order);
        for(let i = 0; i < order.length; i++) {
            setTimeout(() => {
                elements.characters[order[i]].classList.add('offscreen');
                if (i == order.length - 1) {
                    setTimeout( async () => {
                        await loadData();
                        setNextRoundQuote();
                        updateViewForNextRound();
                        game.ready = true;
                    }, 200);
                }
            }, 100*i)
        }
    }, 200);
}






const updateViewForNextRound = function() {
    elements.quoteArea.innerText = game.currentQuote;
    const options = elements.characterArea.children;
    for (let i = 0; i < options.length && i < game.currentOptions.length; i++) {
        options[i].children[0].src = characters.get(game.currentOptions[i]).image;
        options[i].dataset.character = game.currentOptions[i];

        if (characters.get(game.currentOptions[i]).characterDirection === 'Left') {
            options[i].classList.remove('flip');
        } else {
            options[i].classList.add('flip');
        }
    }

    elements.quoteArea.classList.remove('offscreen');
    
    for(let i = 0; i < elements.characters.length; i++) {
        elements.characters[i].classList.remove('correct');
        elements.characters[i].classList.remove('incorrect');
        elements.characters[i].classList.remove('offscreen');
    }

}

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

initiateIntro();
gameSetup();