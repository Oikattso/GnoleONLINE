// 1. SYSTÈME DE LANGUES (TRADUCTIONS)
let currentLang = 'fr';
let jsonFileToLoad = 'cards.json';

const translations = {
    fr: {
        desc: "<strong>Bienvenue dans la version digitale de la Gnole !</strong><br>Avant de commencer, préparez vos verres (alcool, jus de citron, ou breuvage de votre choix) et rejoignez le salon vocal Discord. Le Maître du Jeu partagera son écran. Prêts ? Entrez vos pseudos.",
        playerCount: "Nombre de joueurs (3-10) :",
        btnContinue: "CONTINUER",
        rulesTitle: "RAPPEL DES RÈGLES",
        rulesContent: `<ul>
            <li>On ne dit pas "boire" mais <strong>"GNOLER"</strong>. (Oubli = 1 coup).</li>
            <li>On pioche chacun son tour.</li>
            <li>Consommez le nombre de gorgées indiqué.</li>
            <li><strong>Safe Word :</strong> Utilisable à tout moment, n'en abusez pas pour garder le fun.</li>
            <li><strong>Alternative :</strong> Si pas d'alcool, remplacez par du jus de citron pur ou une boisson détestée. Ne vous mettez pas en danger.</li>
        </ul>`,
        btnStart: "LANCER LA PARTIE",
        alertMin: "Il faut au moins 3 joueurs !",
        alertFail: "Impossible de charger les cartes. Vérifiez votre serveur/hébergement.",
        nextTurn: "Prochain à piocher :",
        emptyDeck: "⚠️ Plus de cartes !",
        reshuffleTitle: "MÉLANGÉ !",
        reshuffleDesc: "Le paquet a été reconstitué (effets actifs exclus).",
        jokerConfirm: "Êtes-vous sûr de vouloir consommer le joker",
        useJokerBtn: "Utiliser le Joker",
        flagSrc: "flag_en.png", // Le drapeau à afficher pour CHANGER de langue
        json: "cards.json"
    },
    en: {
        desc: "<strong>Welcome to the digital version of Gnole!</strong><br>Before starting, get your drinks ready (alcohol, lemon juice, or your preferred beverage) and join the Discord voice channel. The Game Master will share their screen. Ready? Enter your nicknames.",
        playerCount: "Number of players (3-10):",
        btnContinue: "CONTINUE",
        rulesTitle: "RULES REMINDER",
        rulesContent: `<ul>
            <li>Don't say "drink", say <strong>"GNOLE"</strong>. (Forgot = 1 sip).</li>
            <li>Take turns drawing cards.</li>
            <li>Consume the indicated number of sips.</li>
            <li><strong>Safe Word:</strong> Can be used anytime, don't abuse it to keep it fun.</li>
            <li><strong>Alternative:</strong> If no alcohol, replace with pure lemon juice or a hated drink. Don't put yourself in danger.</li>
        </ul>`,
        btnStart: "START GAME",
        alertMin: "You need at least 3 players!",
        alertFail: "Failed to load cards. Check your server/hosting.",
        nextTurn: "Next to draw:",
        emptyDeck: "⚠️ No more cards!",
        reshuffleTitle: "RESHUFFLED!",
        reshuffleDesc: "The deck has been rebuilt (active effects excluded).",
        jokerConfirm: "Are you sure you want to consume the joker",
        useJokerBtn: "Use Joker",
        flagSrc: "flag_fr.png", // Le drapeau à afficher pour CHANGER de langue
        json: "cards_en.json"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    const t = translations[currentLang];
    
    // Mise à jour de l'interface d'accueil
    document.getElementById('ui-desc').innerHTML = t.desc;
    document.getElementById('ui-player-count').innerText = t.playerCount;
    document.getElementById('ui-btn-continue').innerText = t.btnContinue;
    document.getElementById('ui-rules-title').innerText = t.rulesTitle;
    document.getElementById('ui-rules-content').innerHTML = t.rulesContent;
    document.getElementById('ui-btn-start').innerText = t.btnStart;
    
    // Mise à jour du bouton drapeau et du fichier ciblé
    document.getElementById('lang-toggle').src = t.flagSrc;
    jsonFileToLoad = t.json;
}

// 2. VARIABLES GLOBALES DU JEU
let players = [];
let currentPlayerIndex = -1;
let nextPlayerIndex = 0;
let allCards = []; 
let deck = []; 
let globalEffects = []; 
const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3", "#FF8C00", "#8B4513", "#7FFF00", "#00CED1"];

// 3. CHARGEMENT ET INITIALISATION
async function loadCards() {
    try {
        const response = await fetch(jsonFileToLoad); // Utilise la langue choisie
        const data = await response.json();
        allCards = data.map((card, index) => ({ ...card, id: index }));
        deck = [...allCards];
        shuffleDeck(deck);
    } catch (error) {
        console.error("Erreur JSON :", error);
        alert(translations[currentLang].alertFail);
    }
}

function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Génération des inputs pour les pseudos
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
    
    if (players.length < 3) return alert(translations[currentLang].alertMin);
    
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

// 4. LOGIQUE CIRCULAIRE ET AFFICHAGE
function renderBoard() {
    const container = document.getElementById('players-circle-container');
    container.innerHTML = "";
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Correction de l'espacement pour éviter de mordre sur la table centrale
    const radiusX = Math.max(380, Math.min(500, (window.innerWidth / 2) - 150));
    const radiusY = Math.max(300, Math.min(400, (window.innerHeight / 2) - 140));

    players.forEach((p, index) => {
        const angle = (index / players.length) * (2 * Math.PI) - (Math.PI / 2);
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);

        const pDiv = document.createElement('div');
        pDiv.className = `player-pion ${index === currentPlayerIndex ? 'active-player' : ''}`;
        pDiv.style.left = `${x}px`;
        pDiv.style.top = `${y}px`;
        pDiv.style.transform = "translate(-50%, -50%)"; 

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

    // Effets de groupe au centre (maintenant cliquables !)
    const globalArea = document.getElementById('global-cards');
    globalArea.innerHTML = "";
    globalEffects.forEach((eff, effIndex) => {
        const persistentClass = eff.persistent ? 'persistent-card' : '';
        globalArea.innerHTML += `<div class="mini-card ${persistentClass}" onclick="openCardModal('global', ${effIndex})">${eff.title}</div>`;
    });
}

// Recalculer le cercle si on redimensionne la fenêtre
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
    const t = translations[currentLang]; // Récupère la langue actuelle
    
    if (deck.length === 0) {
        document.getElementById('visual-deck').classList.add('hidden');
        document.getElementById('reshuffle-btn').classList.remove('hidden');
        document.getElementById('turn-indicator').innerText = t.emptyDeck;
    } else {
        document.getElementById('visual-deck').classList.remove('hidden');
        document.getElementById('reshuffle-btn').classList.add('hidden');
        document.getElementById('turn-indicator').innerHTML = `${t.nextTurn} <span style="color:${players[nextPlayerIndex].color}">${players[nextPlayerIndex].name}</span>`;
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
    
    const t = translations[currentLang]; // Traduction dynamique
    document.getElementById('card-title').innerText = t.reshuffleTitle;
    document.getElementById('card-desc').innerText = t.reshuffleDesc;
    document.getElementById('card-type-label').innerText = "INFO";
    updateDeckUI();
}

// 5. MODAL (Détails des cartes & Jokers)
function openCardModal(target, effectIndex) {
    // Différenciation entre un joueur et les effets de groupe
    const card = target === 'global' ? globalEffects[effectIndex] : players[target].effects[effectIndex];
    
    document.getElementById('modal-card-title').innerText = card.title;
    document.getElementById('modal-card-desc').innerText = card.desc;
    document.getElementById('modal-type-label').innerText = card.type.toUpperCase();
    
    const actionsDiv = document.getElementById('modal-actions');
    const targetParam = target === 'global' ? "'global'" : target;
    const t = translations[currentLang];
    
    actionsDiv.innerHTML = card.persistent ? `<button class="btn-use" onclick="confirmCardUsage(${targetParam}, ${effectIndex})">${t.useJokerBtn}</button>` : ""; 
    
    document.getElementById('card-detail-modal').classList.remove('hidden');
}

function confirmCardUsage(target, effectIndex) {
    const cardArray = target === 'global' ? globalEffects : players[target].effects;
    const t = translations[currentLang];
    
    // Utilise la traduction pour le pop-up de confirmation
    if (confirm(`${t.jokerConfirm} "${cardArray[effectIndex].title}" ?`)) {
        cardArray.splice(effectIndex, 1); 
        renderBoard(); 
        closeCardModal(); 
    }
}

function closeCardModal() { 
    document.getElementById('card-detail-modal').classList.add('hidden'); 
}
