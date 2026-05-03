// --- VARIABLES GLOBALES ---
let players = [];
let currentPlayerIndex = -1; // -1 car personne n'a encore pioché au lancement
let nextPlayerIndex = 0;     // C'est le Joueur 0 qui commence
let deck = []; // Cartes restantes
let discardPile = []; // Cartes déjà jouées
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3", "#FF8C00", "#8B4513", "#7FFF00", "#00CED1"];

// --- CHARGEMENT ET INITIALISATION ---
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
    
    if (deck.length === 0) return; // Sécurité si le chargement échoue
    
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
            <div class="gnole-counter">
                <span class="btn-gnole" onclick="modifyGnole(${index}, -1)">-</span>
                <span>💀 ${p.gnoles}</span>
                <span class="btn-gnole" onclick="modifyGnole(${index}, 1)">+</span>
            </div>
            <div class="mini-card-container" id="player-effects-${index}"></div>
        `;
        board.appendChild(pDiv);
        
        // AFFICHAGE DES EFFETS (MODIFIÉ)
        const effectContainer = document.getElementById(`player-effects-${index}`);
        p.effects.forEach((eff, effIndex) => {
            // Si la carte a "persistent: true", on lui donne la classe dorée
            const persistentClass = eff.persistent ? 'persistent-card' : '';
            // On ajoute un onclick pour pouvoir utiliser/défausser la carte
            effectContainer.innerHTML += `<div class="mini-card ${persistentClass}" onclick="consumeEffect(${index}, ${effIndex})" title="Cliquez pour utiliser cette carte">${eff.title}</div>`;
        });
    });
}

function consumeEffect(playerIndex, effectIndex) {
    const cardTitle = players[playerIndex].effects[effectIndex].title;
    // Petite confirmation pour éviter les miss-clicks
    if (confirm(`Voulez-vous utiliser/défausser la carte "${cardTitle}" de ${players[playerIndex].name} ?`)) {
        players[playerIndex].effects.splice(effectIndex, 1); // Retire la carte du tableau
        renderBoard(); // Met à jour l'affichage
    }
}

// Remplace addGnole pour gérer l'ajout et le retrait
function modifyGnole(index, amount) {
    players[index].gnoles += amount;
    if (players[index].gnoles < 0) {
        players[index].gnoles = 0; // Sécurité pour ne pas avoir de score négatif
    }
    renderBoard();
}

function updateTurnIndicator() {
    // Affiche qui DOIT piocher
    document.getElementById('turn-indicator').innerHTML = `Prochain à piocher : <span style="color:${players[nextPlayerIndex].color}">${players[nextPlayerIndex].name}</span>`;
    document.getElementById('draw-btn').innerText = `PIOCHER (${deck.length} restantes)`;
}

function drawCard() {
    if (deck.length === 0) {
        alert("Le paquet est vide ! On remélange la défausse.");
        deck = [...discardPile];
        discardPile = [];
        shuffleDeck(deck);
    }

    currentPlayerIndex = nextPlayerIndex;
    const playerWhoDrew = players[currentPlayerIndex];

    const card = deck.pop(); 
    discardPile.push(card); 

    const cardEl = document.getElementById('current-card');
    cardEl.classList.remove('card-animation');
    void cardEl.offsetWidth; 
    cardEl.classList.add('card-animation');

    document.getElementById('card-title').innerText = card.title;
    document.getElementById('card-desc').innerText = card.desc;
    document.getElementById('card-type-label').innerText = card.type.toUpperCase();

    // LOGIQUE DE LA PURGE (MODIFIÉE)
    if (card.type === "purge") {
        // Au lieu de tout vider, on ne garde QUE les cartes persistantes
        players.forEach(p => {
            p.effects = p.effects.filter(eff => eff.persistent === true);
        });
        document.getElementById('global-cards').innerHTML = ""; // On nettoie les effets de groupe
    } 
    else if (card.type === "malus" || card.type === "bonus") {
        if (card.scope === "player") {
            playerWhoDrew.effects.push(card); 
        } else {
            document.getElementById('global-cards').innerHTML += `<div class="mini-card">${card.title}</div>`;
        }
    }

    nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    renderBoard();
    updateTurnIndicator();
}