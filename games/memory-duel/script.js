const grids = [document.getElementById("grid1"), document.getElementById("grid2")];
const symbols = ["🍎", "🍌", "🍇", "🍓", "🥝", "🍒", "🍍", "🥥"];
let flippedCards = [];
let currentPlayer = 0;
let playerProgress = [0, 0]; // Parejas encontradas

// Inicializar el juego
function initGame() {
  playerProgress = [0, 0];
  flippedCards = [];
  currentPlayer = 0;

  grids.forEach((grid) => {
    grid.innerHTML = "";
    generateBoard(grid);
  });
  updatePlayerIndicator();
}

// Generar tablero
function generateBoard(grid) {
  const deck = [...symbols, ...symbols];
  deck.sort(() => Math.random() - 0.5);

  deck.forEach((symbol) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.symbol = symbol;
    card.textContent = "";
    card.addEventListener("click", () => flipCard(card, grid));
    grid.appendChild(card);
  });
}

// Voltear cartas
function flipCard(card, grid) {
  if (grid !== grids[currentPlayer]) return; // Restringir jugador activo
  if (card.classList.contains("flipped") || flippedCards.length >= 2) return;

  card.textContent = card.dataset.symbol;
  card.classList.add("flipped");
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    checkMatch();
  }
}

// Comprobar pareja
function checkMatch() {
  const [card1, card2] = flippedCards;

  if (card1.dataset.symbol === card2.dataset.symbol) {
    flippedCards = [];
    playerProgress[currentPlayer]++;
    checkWin();
  } else {
    setTimeout(() => {
      card1.textContent = "";
      card2.textContent = "";
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      flippedCards = [];
      switchTurn();
    }, 1000);
  }
}

// Cambiar turno
function switchTurn() {
  currentPlayer = currentPlayer === 0 ? 1 : 0;
  updatePlayerIndicator();
}

// Actualizar indicador visual del turno
function updatePlayerIndicator() {
  grids.forEach((grid, index) => {
    grid.style.opacity = index === currentPlayer ? "1" : "0.5";
  });
}

// Verificar victoria
function checkWin() {
  if (playerProgress[currentPlayer] === symbols.length) {
    setTimeout(() => {
      alert(`¡Jugador ${currentPlayer + 1} ha ganado! 🎉`);
      initGame();
    }, 300);
  }
}

// Reiniciar
document.getElementById("restart").addEventListener("click", initGame);

// Iniciar
initGame();
