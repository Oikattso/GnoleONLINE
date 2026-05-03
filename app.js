// --- VARIABLES GLOBALES ---
let players = [];
let currentPlayerIndex = -1;
let nextPlayerIndex = 0;
let allCards = []; 
let deck = []; 
let globalEffects = []; 
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3", "#FF8C00", "#8B4513", "#7FFF00", "#00CED1"];

// --- CHARGEMENT ---
async function loadCards() {
    try {
        const response = await fetch('cards.json');
        const data = await response.json();
        allCards = data.map((card, index) => ({ ...card, id: index }));
        deck = [...allCards];
        shuffleDeck(deck);
    } catch (error) {
        console.error("Erreur JSON :", error);
        alert("Impossible de charger les cartes.");
    }
}

function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- CONFIGURATION ---
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
    
    if (players.length < 3) return alert("Il faut au moins 3 joueurs !");
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

// --- LOGIQUE CIRCULAIRE ET AFFICHAGE ---
function renderBoard() {
    const container = document.getElementById('players-circle-container');
    container.innerHTML = "";
    
   // Calcul mathématique pour le cercle (Ellipse adaptée à l'écran)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // NOUVELLE FORMULE : Éloigne un peu plus les joueurs du centre
    // Et ajoute une sécurité (Math.min) pour qu'ils ne sortent jamais de l'écran
    const radiusX = Math.max(380, Math.min(500, (window.innerWidth / 2) - 150));
    const radiusY = Math.max(300, Math.min(400, (window.innerHeight / 2) - 140));

    players.forEach((p, index) => {
        // Placement en cercle
        const angle = (index / players.length) * (2 * Math.PI) - (Math.PI / 2); // -PI/2 pour commencer en haut
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        const pDiv = document.createElement('div');
        pDiv.className = `player-pion ${index === currentPlayerIndex ? 'active-player' : ''}`;
        
        // Positionnement absolu via CSS in-line
        pDiv.style.left = `${x}px`;
        pDiv.style.top = `${y}px`;
        pDiv.style.transform = "translate(-50%, -50%)"; // Centre le pion sur son point précis

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
        container.appendChild(pDiv);
        
        const effectContainer = document.getElementById(`player-effects-${index}`);
        p.effects.forEach((eff, effIndex) => {
            const persistentClass = eff.persistent ? 'persistent-card' : '';
            effectContainer.innerHTML += `<div class="mini-card ${persistentClass}" onclick="openCardModal(${index}, ${effIndex})">${eff.title}</div>`;
        });
    });

    // Effets de groupe au centre
    const globalArea = document.getElementById('global-cards');
    globalArea.innerHTML = "";
    globalEffects.forEach((eff, effIndex) => {
        // On vérifie aussi si c'est une carte persistante (dorée) au cas où !
        const persistentClass = eff.persistent ? 'persistent-card' : '';
        // On passe 'global' au lieu de l'index d'un joueur
        globalArea.innerHTML += `<div class="mini-card ${persistentClass}" onclick="openCardModal('global', ${effIndex})">${eff.title}</div>`;
    });
}
// Recalculer le cercle si on redimensionne la fenêtre (très pratique !)
window.addEventListener('resize', () => {
    if(!document.getElementById('game-screen').classList.contains('hidden')) {
        renderBoard();
    }
});

function modifyGnole(index, amount) {
    players[index].gnoles = Math.max(0, players[index].gnoles + amount);
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

    if (card.type === "purge") {
        players.forEach(p => { p.effects = p.effects.filter(eff => eff.persistent === true); });
        globalEffects = []; 
    } 
    else if (card.type === "malus" || card.type === "bonus") {
        if (card.scope === "player") playerWhoDrew.effects.push(card); 
        else globalEffects.push(card); 
    }

    nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    renderBoard();
    updateDeckUI();
}

function reshuffleDeck() {
    let activeIds = new Set();
    players.forEach(p => { p.effects.forEach(eff => activeIds.add(eff.id)); });
    globalEffects.forEach(eff => activeIds.add(eff.id));
    
    deck = allCards.filter(card => !activeIds.has(card.id));
    shuffleDeck(deck);
    
    const cardEl = document.getElementById('current-card');
    cardEl.classList.remove('card-animation');
    void cardEl.offsetWidth; 
    cardEl.classList.add('card-animation');
    
    document.getElementById('card-title').innerText = "MÉLANGÉ !";
    document.getElementById('card-desc').innerText = "Le paquet a été reconstitué (effets exclus).";
    document.getElementById('card-type-label').innerText = "INFO";
    updateDeckUI();
}

// --- MODAL ---
function openCardModal(target, effectIndex) {
    // Si la cible est 'global', on cherche dans globalEffects. Sinon, dans les effets du joueur.
    const card = target === 'global' ? globalEffects[effectIndex] : players[target].effects[effectIndex];
    
    document.getElementById('modal-card-title').innerText = card.title;
    document.getElementById('modal-card-desc').innerText = card.desc;
    document.getElementById('modal-type-label').innerText = card.type.toUpperCase();
    
    // On prépare le bouton avec le bon paramètre (soit 'global', soit le numéro du joueur)
    const targetParam = target === 'global' ? "'global'" : target;
    const actionsDiv = document.getElementById('modal-actions');
    
    actionsDiv.innerHTML = card.persistent ? `<button class="btn-use" onclick="confirmCardUsage(${targetParam}, ${effectIndex})">Utiliser le Joker</button>` : ""; 
    
    document.getElementById('card-detail-modal').classList.remove('hidden');
}

function confirmCardUsage(target, effectIndex) {
    // On identifie de quelle liste on doit retirer la carte
    const cardArray = target === 'global' ? globalEffects : players[target].effects;
    
    if (confirm(`Êtes-vous sûr de vouloir consommer le joker "${cardArray[effectIndex].title}" ?`)) {
        cardArray.splice(effectIndex, 1); // Retire la carte de la bonne liste
        renderBoard(); 
        closeCardModal(); 
    }
}

function closeCardModal() { 
    document.getElementById('card-detail-modal').classList.add('hidden'); 
}
