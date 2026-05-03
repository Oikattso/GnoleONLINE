let players = [];
let currentPlayerIndex = 0;
let deck = []; // Cartes restantes
let discardPile = []; // Cartes déjà jouées
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3", "#FF8C00", "#8B4513", "#7FFF00", "#00CED1"];

// --- CHARGEMENT DES CARTESPUIS INITIALISATION ---
async function loadCards() {
    try {
        const response = await fetch('cards.json');
        const data = await response.json();
        deck = [...data];
        shuffleDeck(deck);
        console.log("Cartes chargées :", deck.length);
    } catch (error) {
        console.error("Erreur lors du chargement du JSON :", error);
        alert("Impossible de charger les cartes. Vérifiez que vous utilisez un serveur local ou un hébergeur.");
    }
}

function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- CONFIGURATION JOUEURS ---
document.getElementById('player-count').addEventListener('change', (e) => {
    const container = document.getElementById('player-names-inputs');
    container.innerHTML = "";
    const count = Math.min(Math.max(e.target.value, 3), 10);
    for(let i=0; i < count; i++) {
        container.innerHTML += `<input type="text" placeholder="Joueur ${i+1}" class="name-input">`;
    }
});

function showRules() {
    const inputs = document.querySelectorAll('.name-input');
    players = Array.from(inputs).map((input, index) => ({
        name: input.value || `Joueur ${index+1}`,
        color: colors[index],
        gnoles: 0,
        effects: []
    }));
    
    if (players.length < 3) {
        alert("Il faut au moins 3 joueurs !");
        return;
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('rules-screen').classList.remove('hidden');
}

async function startGame() {
    await loadCards(); // On attend que les cartes soient chargées avant de lancer
    document.getElementById('rules-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    renderBoard();
    updateTurnIndicator();
}

// --- LOGIQUE DU JEU ---
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = "";
    players.forEach((p, index) => {
        const pDiv = document.createElement('div');
        pDiv.className = `player-pion ${index === currentPlayerIndex ? 'active-player' : ''}`;
        pDiv.innerHTML = `
            <div class="pion-circle" style="background:${p.color}"></div>
            <span>${p.name}</span>
            <div class="gnole-counter" onclick="addGnole(${index})">💀 ${p.gnoles}</div>
            <div class="mini-card-container" id="player-effects-${index}"></div>
        `;
        board.appendChild(pDiv);
        
        const effectContainer = document.getElementById(`player-effects-${index}`);
        p.effects.forEach(eff => {
            effectContainer.innerHTML += `<div class="mini-card">${eff.title}</div>`;
        });
    });
}

function addGnole(index) {
    players[index].gnoles++;
    renderBoard();
}

function updateTurnIndicator() {
    document.getElementById('turn-indicator').innerHTML = `Tour de : <span style="color:${players[currentPlayerIndex].color}">${players[currentPlayerIndex].name}</span>`;
    document.getElementById('draw-btn').innerText = `PIOCHER (${deck.length} restantes)`;
}

function drawCard() {
    if (deck.length === 0) {
        alert("Le paquet est vide ! On remélange la défausse.");
        deck = [...discardPile];
        discardPile = [];
        shuffleDeck(deck);
    }

    const card = deck.pop(); // On tire la dernière carte du paquet mélangé
    discardPile.push(card); // On la met dans la défausse

    // Visuel
    const cardEl = document.getElementById('current-card');
    cardEl.classList.remove('card-animation');
    void cardEl.offsetWidth; // Reset animation
    cardEl.classList.add('card-animation');

    document.getElementById('card-title').innerText = card.title;
    document.getElementById('card-desc').innerText = card.desc;
    document.getElementById('card-type-label').innerText = card.type.toUpperCase();

    // Logique des types
    if (card.type === "purge") {
        players.forEach(p => p.effects = []);
        document.getElementById('global-cards').innerHTML = "";
    } 
    else if (card.type === "malus" || card.type === "bonus") {
        if (card.scope === "player") {
            players[currentPlayerIndex].effects.push(card);
        } else {
            document.getElementById('global-cards').innerHTML += `<div class="mini-card">${card.title}</div>`;
        }
    }

    // Prochain joueur
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    renderBoard();
    updateTurnIndicator();
}