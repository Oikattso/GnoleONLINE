// --- VARIABLES GLOBALES ---
let players = [];
let currentPlayerIndex = -1;
let nextPlayerIndex = 0;
let allCards = []; 
let deck = []; 
let globalEffects = []; 
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3", "#FF8C00", "#8B4513", "#7FFF00", "#00CED1"];

// --- CHARGEMENT ET INITIALISATION ---
async function loadCards() {
    try {
        const response = await fetch('cards.json');
        const data = await response.json();
        // Attribution d'un ID unique à chaque carte importée
        allCards = data.map((card, index) => ({ ...card, id: index }));
        deck = [...allCards];
        shuffleDeck(deck);
    } catch (error) {
        console.error("Erreur JSON :", error);
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
    await loadCards(); 
    
    if (deck.length === 0) return; 
    
    document.getElementById('rules-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    renderBoard();
    updateDeckUI();
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
            <div class="gnole-counter">
                <span class="btn-gnole" onclick="modifyGnole(${index}, -1)">-</span>
                <span>💀 ${p.gnoles}</span>
                <span class="btn-gnole" onclick="modifyGnole(${index}, 1)">+</span>
            </div>
            <div class="mini-card-container" id="player-effects-${index}"></div>
        `;
        board.appendChild(pDiv);
        
        const effectContainer = document.getElementById(`player-effects-${index}`);
        p.effects.forEach((eff, effIndex) => {
            const persistentClass = eff.persistent ? 'persistent-card' : '';
            effectContainer.innerHTML += `<div class="mini-card ${persistentClass}" onclick="openCardModal(${index}, ${effIndex})">${eff.title}</div>`;
        });
    });

    // Affichage des effets de groupe
    const globalArea = document.getElementById('global-cards');
    globalArea.innerHTML = "";
    globalEffects.forEach(eff => {
        globalArea.innerHTML += `<div class="mini-card">${eff.title}</div>`;
    });
}

function modifyGnole(index, amount) {
    players[index].gnoles += amount;
    if (players[index].gnoles < 0) {
        players[index].gnoles = 0; 
    }
    renderBoard();
}

function updateDeckUI() {
    document.getElementById('count-number').innerText = deck.length;
    
    if (deck.length === 0) {
        document.getElementById('visual-deck').classList.add('hidden');
        document.getElementById('reshuffle-btn').classList.remove('hidden');
        document.getElementById('turn-indicator').innerText = "⚠️ Plus de cartes !";
    } else {
        document.getElementById('visual-deck').classList.remove('hidden');
        document.getElementById('reshuffle-btn').classList.add('hidden');
        document.getElementById('turn-indicator').innerHTML = `Prochain à piocher : <span style="color:${players[nextPlayerIndex].color}">${players[nextPlayerIndex].name}</span>`;
    }
}

function drawCard() {
    if (deck.length === 0) return; 

    currentPlayerIndex = nextPlayerIndex;
    const playerWhoDrew = players[currentPlayerIndex];

    const card = deck.pop(); 

    const cardEl = document.getElementById('current-card');
    cardEl.classList.remove('card-animation');
    void cardEl.offsetWidth; 
    cardEl.classList.add('card-animation');

    document.getElementById('card-title').innerText = card.title;
    document.getElementById('card-desc').innerText = card.desc;
    document.getElementById('card-type-label').innerText = card.type.toUpperCase();

    // Logique des effets et de la purge
    if (card.type === "purge") {
        players.forEach(p => { p.effects = p.effects.filter(eff => eff.persistent === true); });
        globalEffects = []; 
    } 
    else if (card.type === "malus" || card.type === "bonus") {
        if (card.scope === "player") {
            playerWhoDrew.effects.push(card); 
        } else {
            globalEffects.push(card); 
        }
    }

    nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    renderBoard();
    updateDeckUI();
}

// --- GESTION DU DECK ET DU REMÉLANGE ---
function reshuffleDeck() {
    let activeIds = new Set();
    
    // Lister les cartes actives
    players.forEach(p => { p.effects.forEach(eff => activeIds.add(eff.id)); });
    globalEffects.forEach(eff => activeIds.add(eff.id));
    
    // Reconstruire le deck 
    deck = allCards.filter(card => !activeIds.has(card.id));
    shuffleDeck(deck);
    
    const cardEl = document.getElementById('current-card');
    cardEl.classList.remove('card-animation');
    void cardEl.offsetWidth; 
    cardEl.classList.add('card-animation');
    
    document.getElementById('card-title').innerText = "MÉLANGÉ !";
    document.getElementById('card-desc').innerText = "Le paquet a été reconstitué (effets en cours exclus).";
    document.getElementById('card-type-label').innerText = "INFO";
    
    updateDeckUI();
}

// --- GESTION DU MODAL DES CARTES ---
function openCardModal(playerIndex, effectIndex) {
    const card = players[playerIndex].effects[effectIndex];
    
    document.getElementById('modal-card-title').innerText = card.title;
    document.getElementById('modal-card-desc').innerText = card.desc;
    document.getElementById('modal-type-label').innerText = card.type.toUpperCase();
    
    const actionsDiv = document.getElementById('modal-actions');
    actionsDiv.innerHTML = ""; 
    
    if (card.persistent) {
        actionsDiv.innerHTML = `<button class="btn-use" onclick="confirmCardUsage(${playerIndex}, ${effectIndex})">Utiliser le Joker</button>`;
    }
    
    document.getElementById('card-detail-modal').classList.remove('hidden');
}

function confirmCardUsage(playerIndex, effectIndex) {
    const cardTitle = players[playerIndex].effects[effectIndex].title;
    
    if (confirm(`Êtes-vous sûr de vouloir consommer le joker "${cardTitle}" ? (Action définitive)`)) {
        players[playerIndex].effects.splice(effectIndex, 1); 
        renderBoard(); 
        closeCardModal(); 
    }
}

function closeCardModal() {
    document.getElementById('card-detail-modal').classList.add('hidden');
}