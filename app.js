// ============================================================
//  APP.JS — Modern Animated Tic-Tac-Toe
// ============================================================

(function() {
    'use strict';

    // ---------- DOM REFS ----------
    const cells = document.querySelectorAll('.cell');
    const resetBtn = document.getElementById('resetBtn');
    const resetOverlayBtn = document.getElementById('resetOverlayBtn');
    const newBtn = document.getElementById('newBtn');
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlaySub = document.getElementById('overlaySub');
    const overlayIcon = document.getElementById('overlayIcon');
    const turnIndicator = document.getElementById('turnIndicator');
    const turnDot = document.getElementById('turnDot');
    const turnLabel = document.getElementById('turnLabel');
    const scoreX = document.getElementById('scoreX');
    const scoreO = document.getElementById('scoreO');
    const scoreDraw = document.getElementById('scoreDraw');
    const clearScoreBtn = document.getElementById('clearScoreBtn');
    const board = document.querySelector('.board');
    const confettiLayer = document.getElementById('confettiLayer');
    const bgAnimation = document.getElementById('bgAnimation');

    // ---------- STATE ----------
    let turnO = true; // true = O, false = X
    let count = 0;
    let gameActive = true;
    let winPattern = null;
    let scores = { X: 0, O: 0, draw: 0 };

    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    const WIN_SUB = [
        'Brilliant! ✨', 'Crushed it! 💪', 'Legend! 🏆',
        'Perfect! 🌟', 'Unstoppable! 🚀', 'Genius! 🧠',
        'Flawless! 👑', 'Dominant! ⚡'
    ];

    const DRAW_SUB = [
        'Great minds! 🧠', 'So close! 🤯', 'Battle! ⚔️',
        'Stalemate! 🛡️', 'Epic! 🔥'
    ];

    // ---------- UTILITY ----------
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ---------- BACKGROUND PARTICLES ----------
    function initBgParticles() {
        const count = 35;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            const size = 20 + Math.random() * 90;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (18 + Math.random() * 30) + 's';
            p.style.animationDelay = (Math.random() * 25) + 's';
            p.style.background = `radial-gradient(circle, rgba(255,255,255,${0.02 + Math.random() * 0.04}), transparent 70%)`;
            bgAnimation.appendChild(p);
        }
    }
    initBgParticles();

    // ---------- CONFETTI ----------
    function fireConfetti(count = 140) {
        const colors = ['#f5576c', '#ff6b8a', '#4facfe', '#43e97b', '#fbbf24',
            '#f093fb', '#a78bfa', '#34d399', '#fb923c', '#f472b6',
            '#60a5fa', '#f87171', '#a3e635'
        ];
        confettiLayer.innerHTML = '';
        const pieces = [];

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            const w = 6 + Math.random() * 12;
            const h = 12 + Math.random() * 20;
            el.style.width = w + 'px';
            el.style.height = h + 'px';
            el.style.background = randomFrom(colors);
            el.style.left = Math.random() * 100 + '%';
            el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            el.style.animationDuration = (2.2 + Math.random() * 3.5) + 's';
            el.style.animationDelay = (Math.random() * 1.4) + 's';
            el.style.transform = `rotate(${Math.random() * 360}deg)`;
            confettiLayer.appendChild(el);
            pieces.push(el);
        }

        // auto-clean
        setTimeout(() => {
            confettiLayer.innerHTML = '';
        }, 6500);
    }

    // ---------- SCORE UPDATE ----------
    function updateScoreDisplay() {
        scoreX.textContent = scores.X;
        scoreO.textContent = scores.O;
        scoreDraw.textContent = scores.draw;

        // pop animation on updated score
        const all = [scoreX, scoreO, scoreDraw];
        all.forEach(el => {
            el.classList.remove('pop');
            // reflow
            void el.offsetWidth;
            el.classList.add('pop');
        });
    }

    function addScore(winner) {
        if (winner === 'X') scores.X++;
        else if (winner === 'O') scores.O++;
        else scores.draw++;
        updateScoreDisplay();
    }

    // ---------- TURN INDICATOR ----------
    function updateTurnIndicator() {
        const isX = !turnO;
        turnIndicator.classList.remove('turn-x', 'turn-o');
        if (isX) {
            turnIndicator.classList.add('turn-x');
            turnLabel.textContent = "X's turn";
        } else {
            turnIndicator.classList.add('turn-o');
            turnLabel.textContent = "O's turn";
        }
    }

    // ---------- BOARD STATE ----------
    function disableCells() {
        cells.forEach(c => c.disabled = true);
    }

    function enableCells() {
        cells.forEach(c => {
            c.disabled = false;
            c.innerText = '';
            c.className = 'cell';
            c.style.transform = '';
        });
    }

    function clearGlow() {
        cells.forEach(c => c.classList.remove('win-glow', 'draw-fade', 'pop'));
        board.classList.remove('win-x', 'win-o', 'draw');
    }

    // ---------- CHECK WINNER ----------
    function checkWinner() {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const va = cells[a].innerText;
            const vb = cells[b].innerText;
            const vc = cells[c].innerText;
            if (va && va === vb && vb === vc) {
                winPattern = pattern;
                return va;
            }
        }
        return null;
    }

    // ---------- GAME OVER ----------
    function endGame(winner) {
        gameActive = false;
        disableCells();

        if (winner) {
            // highlight winning cells
            winPattern.forEach(idx => {
                cells[idx].classList.add('win-glow');
                if (winner === 'X') cells[idx].classList.add('x');
                else cells[idx].classList.add('o');
            });

            // board glow
            board.classList.add(winner === 'X' ? 'win-x' : 'win-o');

            // overlay
            const sub = randomFrom(WIN_SUB);
            overlayTitle.innerHTML = `🎉 <span class="highlight-${winner.toLowerCase()}">${winner}</span> Wins!`;
            overlaySub.textContent = sub;
            overlayIcon.textContent = winner === 'X' ? '❌' : '⭕';

            // confetti
            fireConfetti(160);

            // score
            addScore(winner);

        } else {
            // draw
            cells.forEach(c => c.classList.add('draw-fade'));
            board.classList.add('draw');

            const sub = randomFrom(DRAW_SUB);
            overlayTitle.innerHTML = `🤝 <span class="highlight-draw">Draw!</span>`;
            overlaySub.textContent = sub;
            overlayIcon.textContent = '🤝';

            // small confetti burst for draw
            fireConfetti(60);

            addScore(null);
        }

        // show overlay
        overlay.classList.remove('hide');
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    }

    // ---------- HANDLE MOVE ----------
    function handleMove(index) {
        if (!gameActive) return;
        const cell = cells[index];
        if (cell.innerText) return;

        const symbol = turnO ? 'O' : 'X';
        cell.innerText = symbol;
        cell.classList.add(symbol.toLowerCase());
        cell.classList.add('pop');
        cell.disabled = true;

        // remove pop after anim
        setTimeout(() => cell.classList.remove('pop'), 450);

        count++;
        turnO = !turnO;
        updateTurnIndicator();

        const winner = checkWinner();
        if (winner) {
            endGame(winner);
            return;
        }

        if (count === 9) {
            endGame(null);
            return;
        }

        // subtle board pulse hint
        board.style.transition = 'box-shadow 0.3s ease';
        board.style.boxShadow = '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 60px rgba(79,172,254,0.04)';
        setTimeout(() => {
            board.style.boxShadow = '';
        }, 400);
    }

    // ---------- RESET GAME ----------
    function resetGame() {
        gameActive = true;
        turnO = true;
        count = 0;
        winPattern = null;
        enableCells();
        clearGlow();
        updateTurnIndicator();

        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.classList.add('hide');
        }, 450);

        confettiLayer.innerHTML = '';

        // reset board style
        board.style.boxShadow = '';
        board.style.transition = '';
    }

    // ---------- CLEAR SCORES ----------
    function clearScores() {
        scores = { X: 0, O: 0, draw: 0 };
        updateScoreDisplay();
        // quick flash feedback
        document.querySelectorAll('.score-value').forEach(el => {
            el.style.transition = 'color 0.3s ease';
            el.style.color = 'rgba(255,255,255,0.1)';
            setTimeout(() => {
                el.style.color = '';
            }, 400);
        });
    }

    // ---------- EVENT LISTENERS ----------
    cells.forEach((cell, idx) => {
        cell.addEventListener('click', () => handleMove(idx));
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMove(idx);
        }, { passive: false });
    });

    resetBtn.addEventListener('click', resetGame);
    resetOverlayBtn.addEventListener('click', resetGame);
    newBtn.addEventListener('click', resetGame);
    clearScoreBtn.addEventListener('click', clearScores);

    // keyboard: R = reset, C = clear scores
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                resetGame();
            }
        }
        if (e.key === 'c' || e.key === 'C') {
            if (!e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                clearScores();
            }
        }
        if ((e.key === 'Enter' || e.key === ' ') && overlay.classList.contains('show')) {
            e.preventDefault();
            resetGame();
        }
    });

    // ---------- INIT ----------
    resetGame();
    updateScoreDisplay();

    // ---------- EXTRA: window resize friendly ----------
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // nothing heavy, just keep things smooth
        }, 200);
    });

    // ---------- EXPOSE FOR CONSOLE DEBUG ----------
    window.__ttt = {
        reset: resetGame,
        scores: () => ({ ...scores }),
        clearScores,
        state: () => ({ turnO, count, gameActive })
    };

    console.log('🎮 Tic-Tac-Toe loaded!');
    console.log('  ⌨️  R  = Reset game');
    console.log('  ⌨️  C  = Clear scores');
    console.log('  ⌨️  Enter/Space = close overlay');

})();
