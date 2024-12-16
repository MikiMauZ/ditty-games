class SpiraliaDitty {
    constructor() {
        this.players = [];
        this.currentPlayer = 0;
        this.diceResult = 0;
        this.gameOver = false;
        this.diceRolled = false;
        this.canModifyDice = false;
        this.movementPhase = false;
        this.boardPositions = [];
        this.maxCrystals = 15;  // Nuevo límite máximo de cristales
        this.isModalActive = false; // Nueva bandera para controlar el estado del modal
        
        this.specialCells = {
            portal: [7, 14, 21, 28, 35, 42, 49, 56],
            bridge: [6, 12],
            sanctuary: [19],
            vortex: [31],
            labyrinth: [42],
            void: [58]
        };

        this.cellDescriptions = {
            portal: "Portal Espiral: Paga 2 cristales para transportarte al siguiente portal",
            bridge: "Puente Dimensional: Paga 3 cristales para moverte al otro puente",
            sanctuary: "Santuario: Recupera 5 cristales pero pierdes el siguiente turno",
            vortex: "Vórtice Temporal: Paga 4 cristales o quedarás atrapado",
            labyrinth: "Laberinto Astral: Paga 3 cristales o retrocede a la casilla 30",
            void: "Vacío Primordial: Paga 5 cristales o regresa a la casilla 1"
        };
    }

    startGame(numPlayers) {
        document.getElementById('player-select').style.display = 'none';
        
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.display = 'block';
        setTimeout(() => {
            gameContainer.classList.add('visible');
        }, 50);

        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        this.players = Array(numPlayers).fill().map((_, i) => ({
            position: 0,
            crystals: 10,  // Cristales iniciales reducidos a 10
            color: colors[i],
            skippingTurn: false,
            trapped: false
        }));

        this.currentPlayer = 0;
        this.gameOver = false;
        this.setupEventListeners();
        this.drawBoard();
        this.updateUI();
        this.showNotification(`¡Comienza el juego con ${numPlayers} jugadores!`);
    }

    setupEventListeners() {
        const buttons = {
            'meditate-btn': () => this.meditate(),
            'roll-one-btn': () => this.rollDice(1),
            'roll-two-btn': () => this.rollDice(2),
            'modify-up-btn': () => this.modifyDice(1),
            'modify-down-btn': () => this.modifyDice(-1),
            'move-btn': () => this.movePlayer(),
            'restart-btn': () => this.restartGame()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) {
                button.onclick = handler.bind(this);
            }
        });
    }

    showNotification(text, duration = 3000) {
        const notification = document.getElementById('event-notification');
        notification.textContent = text;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }

    showModal(title, text, buttons = []) {
        if (this.isModalActive) {
            console.warn("El modal ya está activo. No se mostrará nuevamente.");
            return;
        }
    
        this.isModalActive = true; // Activar la bandera de control
        console.log("showModal llamado con título:", title);
    
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');
        const modalButtons = document.getElementById('modal-buttons');
    
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalButtons.innerHTML = ''; // Limpiar botones anteriores
    
        buttons.forEach((button) => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
    
            btn.onclick = () => {
                console.log("Botón presionado:", button.text);
                if (typeof button.action === 'function') {
                    button.action();
                }
                this.hideModal();
            };
    
            modalButtons.appendChild(btn);
        });
    
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        console.log("Modal mostrado.");
    }
    
    
    hideModal() {
        console.log("hideModal llamado.");
        const modal = document.getElementById('modal');
    
        modal.style.setProperty('opacity', '0', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
    
        setTimeout(() => {
            modal.style.removeProperty('display');
            modal.style.removeProperty('opacity');
            modal.style.removeProperty('visibility');
            this.isModalActive = false; // Desactivar bandera
            console.log("Modal ocultado y estilos restaurados.");
        }, 300);
    }
    
    

    calculateBoardPositions(boardSize, cellSize, margin) {
        const positions = [];
        const startX = margin;
        const startY = boardSize - margin - cellSize;
        
        const rows = 7;
        const cols = 9;
        
        const spacingX = (boardSize - (2 * margin) - (cols * cellSize)) / (cols - 1);
        const spacingY = (boardSize - (2 * margin) - (rows * cellSize)) / (rows - 1);
        
        for (let row = rows - 1; row >= 0; row--) {
            const isReversed = (rows - 1 - row) % 2 === 1;
            
            for (let col = 0; col < cols; col++) {
                const actualCol = isReversed ? cols - 1 - col : col;
                
                positions.push({
                    x: startX + actualCol * (cellSize + spacingX),
                    y: startY - (rows - 1 - row) * (cellSize + spacingY)
                });
            }
        }
        
        this.boardPositions = positions.slice(0, 64);
        return this.boardPositions;
    }

    drawConnectionLines(positions, board) {
        for (let i = 0; i < positions.length - 1; i++) {
            if (i < 63) {
                const line = document.createElement('div');
                line.className = 'path-line';
                
                const start = positions[i];
                const end = positions[i + 1];
                
                const length = Math.sqrt(
                    Math.pow(end.x - start.x, 2) + 
                    Math.pow(end.y - start.y, 2)
                );
                
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                
                line.style.width = `${length}px`;
                line.style.left = `${start.x + 35}px`;
                line.style.top = `${start.y + 35}px`;
                line.style.transform = `rotate(${angle}rad)`;
                
                board.appendChild(line);
            }
        }
    }

    drawBoard() {
        const board = document.getElementById('spiral-path');
        board.innerHTML = '';
        
        const boardSize = 800;
        const cellSize = 70;
        const margin = 40;
        
        const positions = this.calculateBoardPositions(boardSize, cellSize, margin);
        this.drawConnectionLines(positions, board);
        
        positions.forEach((pos, i) => {
            if (i <= 63) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                const span = document.createElement('span');
                span.textContent = i;
                cell.appendChild(span);
                
                for (const [type, cells] of Object.entries(this.specialCells)) {
                    if (cells.includes(i)) {
                        cell.classList.add(type);
                        cell.setAttribute('data-tooltip', this.cellDescriptions[type]);
                    }
                }
                
                cell.style.left = `${pos.x}px`;
                cell.style.top = `${pos.y}px`;
                
                board.appendChild(cell);
            }
        });

        // Dibujar jugadores
        this.players.forEach((player, i) => {
            const playerToken = document.createElement('div');
            playerToken.className = 'player';
            playerToken.id = `player-${i}`;
            playerToken.style.backgroundColor = player.color;
            playerToken.setAttribute('data-player', `J${i + 1}`);
            board.appendChild(playerToken);
        });

        this.updatePlayerPositions();
    }

    updatePlayerPositions() {
        const offsetPositions = [
            { x: -15, y: -15 }, // Arriba izquierda
            { x: 15, y: -15 },  // Arriba derecha
            { x: -15, y: 15 },  // Abajo izquierda
            { x: 15, y: 15 }    // Abajo derecha
        ];

        this.players.forEach((player, i) => {
            const token = document.getElementById(`player-${i}`);
            if (token && player.position < this.boardPositions.length) {
                const basePosition = this.boardPositions[player.position];
                const offset = offsetPositions[i];

                token.style.left = `${basePosition.x + offset.x + 35}px`;
                token.style.top = `${basePosition.y + offset.y + 35}px`;
            }
        });
    }

    updateUI() {
        const playerInfo = document.getElementById('player-info');
        playerInfo.innerHTML = this.players.map((player, i) => `
            <div class="player-card ${i === this.currentPlayer ? 'active' : ''}" style="border: 2px solid ${player.color}">
                <div>Jugador ${i + 1}</div>
                <div>Posición: ${player.position}</div>
                <div>Cristales: ${player.crystals}</div>
                ${player.skippingTurn ? '<div>Saltará el siguiente turno</div>' : ''}
                ${player.trapped ? '<div>¡Atrapado!</div>' : ''}
            </div>
        `).join('');

        document.getElementById('current-player').textContent = this.currentPlayer + 1;
        
        const player = this.players[this.currentPlayer];
        document.getElementById('roll-two-btn').disabled = player.crystals < 2 || this.diceRolled;
        document.getElementById('roll-one-btn').disabled = this.diceRolled;
        document.getElementById('modify-up-btn').disabled = !this.canModifyDice || player.crystals < 1;
        document.getElementById('modify-down-btn').disabled = !this.canModifyDice || player.crystals < 1;
        document.getElementById('move-btn').disabled = !this.movementPhase;
        document.getElementById('meditate-btn').disabled = this.diceRolled;
    }

    // Dentro de la clase SpiraliaDitty...

    meditate() {
        const player = this.players[this.currentPlayer];
        player.crystals = Math.min(this.maxCrystals, player.crystals + 3);
        this.showNotification(`Jugador ${this.currentPlayer + 1} medita y recupera 3 cristales`);
        this.nextTurn();
    }

    rollDice(count) {
        if (this.diceRolled) return;
    
        const dice = document.querySelectorAll('.die');
        const results = Array(count).fill().map(() => Math.floor(Math.random() * 6) + 1);
        
        dice.forEach(die => die.classList.add('rolling'));
        
        setTimeout(() => {
            dice.forEach((die, i) => {
                die.classList.remove('rolling');
                die.textContent = i < results.length ? results[i] : '?';
            });
            
            this.diceResult = results.reduce((a, b) => a + b, 0);
            
            if (count === 2) {
                this.players[this.currentPlayer].crystals -= 2;
            } else {
                this.players[this.currentPlayer].crystals = Math.min(
                    this.maxCrystals, 
                    this.players[this.currentPlayer].crystals + 1
                );
            }
            
            this.diceRolled = true;
            this.canModifyDice = true;
            this.movementPhase = true;
            this.showNotification(`Resultado de los dados: ${this.diceResult}`);
            this.updateUI();
        }, 600);
    }

    modifyDice(amount) {
        if (!this.canModifyDice || this.players[this.currentPlayer].crystals < 2) return; // Verifica si es posible modificar la tirada y si hay suficientes cristales
    
        if (amount === 1 || amount === -1) { // Solo permite modificar en ±1
            this.players[this.currentPlayer].crystals -= 2; // Consume 2 cristales por modificación
            this.diceResult += amount; // Ajusta el resultado de la tirada
            this.canModifyDice = false; // Solo permite una modificación por turno
            this.showNotification(`Resultado modificado a: ${this.diceResult} (Costo: 2 cristales)`);
            this.updateUI();
        } else {
            this.showNotification("Modificación inválida. Solo puedes sumar o restar 1.");
        }
    }
    

    movePlayer() {
        if (!this.movementPhase) return;

        const player = this.players[this.currentPlayer];
        let newPosition = player.position + this.diceResult;
        
        if (newPosition > 63) {
            newPosition = 63 - (newPosition - 63);
            this.showNotification("¡Te pasaste! Retrocediendo...");
        }
        
        player.position = Math.max(0, newPosition);
        this.updatePlayerPositions();
        
        setTimeout(() => {
            this.checkSpecialCell();
        }, 300);

        this.movementPhase = false;
        this.canModifyDice = false;
        this.updateUI();
    }

    finishTurn() {
        const currentPlayer = this.players[this.currentPlayer];
        
        if (currentPlayer.position === 62 && currentPlayer.crystals >= 1) {  // Cambio a casilla 62
            this.gameOver = true;
            this.showModal(
                "¡Victoria!",
                `¡El Jugador ${this.currentPlayer + 1} ha ganado el juego!`,
                [{
                    text: "Nueva Partida",
                    action: () => this.restartGame()
                }]
            );
            return;
        }
        this.nextTurn();
    }
    

    nextTurn() {
        if (!this.gameOver) {
            let nextPlayer;
            let attempts = 0;
            
            do {
                this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
                nextPlayer = this.players[this.currentPlayer];
                attempts++;
                
                if (attempts >= this.players.length) {
                    this.players.forEach(p => {
                        p.skippingTurn = false;
                        p.trapped = false;
                    });
                    break;
                }
            } while (nextPlayer.skippingTurn || nextPlayer.trapped);

            if (nextPlayer.skippingTurn) {
                nextPlayer.skippingTurn = false;
            }

            this.checkTrappedPlayers();

            this.diceRolled = false;
            this.canModifyDice = false;
            this.movementPhase = false;
            this.diceResult = 0;
            document.querySelectorAll('.die').forEach(die => die.textContent = '?');
            this.updateUI();
            
            this.showNotification(`Turno del Jugador ${this.currentPlayer + 1}`);
        }
    }

    checkTrappedPlayers() {
        this.players.forEach((player, index) => {
            if (player.trapped) {
                const someoneInSamePosition = this.players.some(
                    (p, i) => i !== index && p.position === player.position
                );
                if (someoneInSamePosition) {
                    player.trapped = false;
                    this.showNotification(`¡Jugador ${index + 1} ha sido liberado del Vórtice!`);
                }
            }
        });
    }
    // Dentro de la clase SpiraliaDitty...

    checkSpecialCell() {
        const player = this.players[this.currentPlayer];
        const position = player.position;

        if (this.specialCells.portal.includes(position)) {
            this.handlePortal();
        } else if (this.specialCells.bridge.includes(position)) {
            this.handleBridge();
        } else if (this.specialCells.sanctuary.includes(position)) {
            this.handleSanctuary();
        } else if (this.specialCells.vortex.includes(position)) {
            this.handleVortex();
        } else if (this.specialCells.labyrinth.includes(position)) {
            this.handleLabyrinth();
        } else if (this.specialCells.void.includes(position)) {
            this.handleVoid();
        } else {
            this.checkPlayerCollision();
        }
    }

    handlePortal() {
        const player = this.players[this.currentPlayer];
        const currentPosition = player.position;

        this.showModal(
            "Portal Espiral",
            "¿Deseas pagar 2 cristales para transportarte al siguiente portal?",
            [
                {
                    text: "Sí (2 cristales)",
                    action: () => {
                        if (player.crystals >= 2) {
                            player.crystals -= 2;
                            const nextPortalIndex = this.specialCells.portal.findIndex(p => p > currentPosition);
                            if (nextPortalIndex !== -1) {
                                player.position = this.specialCells.portal[nextPortalIndex];
                                this.updatePlayerPositions();
                                this.showNotification("¡Te has transportado a través del portal!");
                            }
                        }
                        this.finishTurn();
                    }
                },
                {
                    text: "No",
                    action: () => this.finishTurn()
                }
            ]
        );
    }

    handleBridge() {
        const player = this.players[this.currentPlayer];
        const currentPosition = player.position;
        const otherBridge = this.specialCells.bridge.find(b => b !== currentPosition);

        this.showModal(
            "Puente Dimensional",
            "¿Deseas pagar 3 cristales para moverte al otro puente?",
            [
                {
                    text: "Sí (3 cristales)",
                    action: () => {
                        if (player.crystals >= 3) {
                            player.crystals -= 3;
                            player.position = otherBridge;
                            this.updatePlayerPositions();
                            this.showNotification("¡Has cruzado el puente dimensional!");
                        }
                        this.finishTurn();
                    }
                },
                {
                    text: "No",
                    action: () => this.finishTurn()
                }
            ]
        );
    }

    handleSanctuary() {
        const player = this.players[this.currentPlayer];
        player.crystals = Math.min(this.maxCrystals, player.crystals + 5);
        player.skippingTurn = true;
        this.showNotification("¡Has llegado al Santuario! +5 cristales, pero perderás el siguiente turno");
        this.finishTurn();
    }
    

    handleVortex() {
        const player = this.players[this.currentPlayer];
        this.showModal(
            "Vórtice Temporal",
            "¡Has caído en el Vórtice! Paga 4 cristales o quedarás atrapado hasta que otro jugador pase por aquí",
            [
                {
                    text: "Pagar 4 cristales",
                    action: () => {
                        if (player.crystals >= 4) {
                            player.crystals -= 4;
                            this.showNotification("Has resistido el Vórtice Temporal");
                        } else {
                            player.trapped = true;
                            this.showNotification("¡Has quedado atrapado en el Vórtice!");
                        }
                        this.finishTurn();
                    }
                },
                {
                    text: "Quedar atrapado",
                    action: () => {
                        player.trapped = true;
                        this.showNotification("¡Has quedado atrapado en el Vórtice!");
                        this.finishTurn();
                    }
                }
            ]
        );
    }

    handleLabyrinth() {
        const player = this.players[this.currentPlayer];
        this.showModal(
            "Laberinto Astral",
            "¡Has entrado al Laberinto! Paga 3 cristales o retrocederás a la casilla 30",
            [
                {
                    text: "Pagar 3 cristales",
                    action: () => {
                        if (player.crystals >= 3) {
                            player.crystals -= 3;
                            this.showNotification("Has mantenido el rumbo en el Laberinto");
                        } else {
                            player.position = 30;
                            this.updatePlayerPositions();
                            this.showNotification("¡Te has perdido en el Laberinto!");
                        }
                        this.finishTurn();
                    }
                },
                {
                    text: "Retroceder",
                    action: () => {
                        player.position = 30;
                        this.updatePlayerPositions();
                        this.showNotification("¡Te has perdido en el Laberinto!");
                        this.finishTurn();
                    }
                }
            ]
        );
    }

    handleVoid() {
        const player = this.players[this.currentPlayer];
        this.showModal(
            "Vacío Primordial",
            "¡Has caído en el Vacío! Paga 5 cristales o regresarás a la casilla 1",
            [
                {
                    text: "Pagar 5 cristales",
                    action: () => {
                        if (player.crystals >= 5) {
                            player.crystals -= 5;
                            this.showNotification("¡Has resistido el poder del Vacío!");
                        } else {
                            player.position = 1;
                            this.updatePlayerPositions();
                            this.showNotification("¡El Vacío te ha enviado al inicio!");
                        }
                        this.finishTurn();
                    }
                },
                {
                    text: "Regresar al inicio",
                    action: () => {
                        player.position = 1;
                        this.updatePlayerPositions();
                        this.showNotification("¡El Vacío te ha enviado al inicio!");
                        this.finishTurn();
                    }
                }
            ]
        );
    }
    // Dentro de la clase SpiraliaDitty...

    checkPlayerCollision() {
        console.log("Verificando colisión...");
        const currentPlayer = this.players[this.currentPlayer];
        const otherPlayerInSamePosition = this.players.find(
            (p, i) => i !== this.currentPlayer && p.position === currentPlayer.position
        );
    
        if (otherPlayerInSamePosition) {
            console.log("¡Confluencia detectada! Mostrando modal...");
            this.showModal(
                "¡Confluencia!",
                "Has caído en una casilla ocupada. ¿Qué deseas hacer?",
                [
                    {
                        text: "Retroceder",
                        action: () => {
                            console.log("Jugador seleccionó retroceder.");
                            currentPlayer.position = Math.max(0, currentPlayer.position - 1);
                            this.updatePlayerPositions();
                            this.finishTurn();
                        }
                    },
                    {
                        text: "Coexistir",
                        action: () => {
                            console.log("Jugador seleccionó coexistir.");
                            if (currentPlayer.crystals >= 2) {
                                currentPlayer.crystals -= 2;
                                this.showNotification("Has coexistido pagando 2 cristales.");
                                this.finishTurn();
                            } else {
                                this.showNotification("No tienes suficientes cristales para coexistir.");
                            }
                        }
                    }
                ]
            );
        } else {
            console.log("No hay colisión. Terminando turno.");
            this.finishTurn();
        }
    }

    
    

    restartGame() {
        document.getElementById('player-select').style.display = 'block';
        
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.remove('visible');
        setTimeout(() => {
            gameContainer.style.display = 'none';
        }, 500);

        this.players = [];
        this.currentPlayer = 0;
        this.diceResult = 0;
        this.gameOver = false;
        this.diceRolled = false;
        this.canModifyDice = false;
        this.movementPhase = false;
        this.showNotification("¡Selecciona el número de jugadores para una nueva partida!");
    }
}

// Inicializar el juego
window.addEventListener('load', () => {
    window.game = new SpiraliaDitty();
});


