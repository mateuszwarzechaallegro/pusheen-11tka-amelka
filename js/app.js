/* ============================================
   PUSHEEN BIRTHDAY ADVENTURE - APP LOGIC
   Nawigacja między stronami + efekty
   ============================================ */

const App = {
  currentPage: 0,
  totalPuzzles: 0, // będzie zwiększane w miarę dodawania zagadek

  init() {
    this.restoreFromHash();
    this.spawnParticles();
    Crossword.init();
  },

  /** Przejdź do wybranej strony */
  goToPage(pageNum) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const target = document.querySelector(`[data-page="${pageNum}"]`);
    if (target) {
      target.classList.add('active');
      this.currentPage = pageNum;
      window.location.hash = `page-${pageNum}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  /** Przywróć stronę z hasha URL */
  restoreFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/^#page-(\d+)$/);
    if (match) {
      const page = parseInt(match[1], 10);
      this.goToPage(page);
    }
  },

  /** Aktualizuj pasek postępu na stronach zagadek */
  updateProgress(solved, total) {
    const fills = document.querySelectorAll('.progress-fill');
    const pct = total > 0 ? (solved / total) * 100 : 0;
    fills.forEach(f => {
      f.style.width = `${pct}%`;
    });
  },

  /** Pokaż overlay sukcesu po rozwiązaniu zagadki */
  showSuccess(message, nextPage) {
    let overlay = document.querySelector('.success-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'success-overlay';
      overlay.innerHTML = `
        <div class="success-card">
          <span class="success-emoji">🎉🐱</span>
          <h3>Brawo!</h3>
          <p class="success-message"></p>
          <button class="btn btn-primary success-next-btn">Dalej →</button>
        </div>
      `;
      document.getElementById('app').appendChild(overlay);
    }

    overlay.querySelector('.success-message').textContent = message;
    overlay.classList.add('active');

    const btn = overlay.querySelector('.success-next-btn');
    btn.onclick = () => {
      overlay.classList.remove('active');
      if (nextPage !== undefined) {
        this.goToPage(nextPage);
      }
    };
  },

  /** Tło — unoszące się emoji */
  spawnParticles() {
    const container = document.getElementById('particles');
    const emojis = ['⭐', '🌸', '💜', '🐾', '✨', '🎀', '💫', '🎂'];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'particle';
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDelay = `${Math.random() * 6}s`;
      span.style.animationDuration = `${4 + Math.random() * 4}s`;
      span.style.fontSize = `${0.8 + Math.random() * 1.2}rem`;
      container.appendChild(span);
    }
  },

  /** Pomocnik: sprawdź odpowiedź (case-insensitive, trimmed) */
  checkAnswer(input, correctAnswers) {
    const normalized = input.trim().toLowerCase();
    if (Array.isArray(correctAnswers)) {
      return correctAnswers.some(a => a.toLowerCase() === normalized);
    }
    return normalized === correctAnswers.toLowerCase();
  }
};

/* ============================================
   CROSSWORD PUZZLE ENGINE
   ============================================ */
const Crossword = {
  // Definicja krzyżówki: polska krzyżówka z hasłem
  // Wszystkie hasła idą poziomo, kolumna "hasło" jest podświetlona
  SECRET_WORD: 'SOWA',
  SECRET_COL: 5, // kolumna (0-indexed) w której czytamy hasło

  words: [
    { num: 1,  answer: 'PIP',       clue: 'Mały, szary i bardzo puszysty brat Pusheena.',                           secretIdx: -1 },
    { num: 2,  answer: 'SYRENĄ',    clue: 'Kiedy Pusheen ma rybi ogon, staje się...',                                secretIdx: 0  },
    { num: 3,  answer: 'LENIWIEC',  clue: 'Najwolniejszy przyjaciel Pusheena, który kocha się przytulać.',           secretIdx: 4  },
    { num: 4,  answer: 'MRUCZY',    clue: 'Kocia mama lub kocie dziecko robi to, gdy jest bardzo szczęśliwe (dźwięk).', secretIdx: -1 },
    { num: 5,  answer: 'BO',        clue: 'Mały, żółty ptaszek, który zawsze towarzyszy ekipie.',                    secretIdx: 1  },
    { num: 6,  answer: 'PĄCZEK',    clue: 'Coś słodkiego z dziurką w środku i kolorową posypką.',                    secretIdx: -1 },
    { num: 7,  answer: 'URODZINY',  clue: 'Najlepszy dzień w roku, kiedy dostaje się prezenty i tort!',              secretIdx: -1 },
    { num: 8,  answer: 'BABECZKA',  clue: 'Słodki wypiek z kremem, który Pusheen często trzyma w łapkach.',           secretIdx: -1 },
    { num: 9,  answer: 'CHEEK',     clue: 'Żółty chomik o bardzo uroczych, różowych policzkach.',                     secretIdx: -1 },
    { num: 10, answer: 'ARBUZ',     clue: 'Ulubiony, wielki i soczysty owoc Pusheena na lato.',                      secretIdx: 0  },
    { num: 11, answer: 'DOM',       clue: 'Pusheen ma tam swoje legowisko, miseczki i wszystkie skarby.',            secretIdx: -1 },
    { num: 12, answer: 'WŁÓCZKA',   clue: 'Najlepszy przyjaciel do zabawy, który odwija się z kłębka.',              secretIdx: -1 },
  ],

  // Obliczone pozycje startu (kolumna) dla każdego wyrazu, tak by secretIdx-ta litera
  // trafiała w SECRET_COL. Pozostałe wycentrowane.
  grid: [],       // 2D tablica komórek
  gridRows: 0,
  gridCols: 0,
  wordPositions: [], // { row, startCol, word }
  solvedWords: new Set(),
  activeWordIdx: -1,
  cells: {},       // klucz "r-c" → { el, input, row, col, wordIndices[], letter, isSecret }

  init() {
    const gridEl = document.getElementById('crossword-grid');
    if (!gridEl) return;

    this.computeLayout();
    this.buildGrid();
    this.buildClues();
  },

  computeLayout() {
    const SC = this.SECRET_COL;
    this.wordPositions = [];
    let maxCol = 0;

    this.words.forEach((w, idx) => {
      let startCol;
      if (w.secretIdx >= 0) {
        // Litera w.secretIdx-ta musi trafić w kolumnę SC
        startCol = SC - w.secretIdx;
      } else {
        // Wycentruj słowo tak, by przechodziło przez kolumnę SC
        // (o ile się da)
        const halfLen = Math.floor(w.answer.length / 2);
        startCol = SC - halfLen;
        if (startCol < 0) startCol = 0;
      }

      const endCol = startCol + w.answer.length - 1;
      if (endCol > maxCol) maxCol = endCol;

      this.wordPositions.push({
        row: idx, // każdy wyraz w osobnym wierszu
        startCol,
        word: w
      });
    });

    this.gridRows = this.words.length;
    this.gridCols = maxCol + 1;
  },

  buildGrid() {
    const gridEl = document.getElementById('crossword-grid');
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${this.gridCols}, 32px)`;
    gridEl.style.gridTemplateRows = `repeat(${this.gridRows}, 32px)`;

    this.cells = {};

    // Zbierz wszystkie aktywne komórki
    const activeCells = new Set();
    this.wordPositions.forEach((wp, idx) => {
      for (let c = 0; c < wp.word.answer.length; c++) {
        const col = wp.startCol + c;
        const key = `${wp.row}-${col}`;
        activeCells.add(key);
      }
    });

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const key = `${r}-${c}`;
        const cellDiv = document.createElement('div');
        cellDiv.className = 'crossword-cell';
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;

        if (!activeCells.has(key)) {
          cellDiv.classList.add('empty');
          gridEl.appendChild(cellDiv);
          continue;
        }

        cellDiv.classList.add('active-cell');

        // Znajdź, do którego wyrazu należy ta komórka
        const wp = this.wordPositions[r];
        const letterIdx = c - wp.startCol;
        const letter = wp.word.answer[letterIdx];
        const isSecret = (c === this.SECRET_COL && wp.word.secretIdx >= 0);

        if (isSecret) {
          cellDiv.classList.add('secret-cell');
        }

        // Numer na pierwszej komórce wyrazu
        if (c === wp.startCol) {
          const numSpan = document.createElement('span');
          numSpan.className = 'cell-number';
          numSpan.textContent = wp.word.num;
          cellDiv.appendChild(numSpan);
        }

        // Input
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.autocapitalize = 'characters';
        input.spellcheck = false;
        input.dataset.row = r;
        input.dataset.col = c;
        input.setAttribute('aria-label', `Wiersz ${r + 1}, kolumna ${c + 1}`);

        input.addEventListener('input', (e) => this.onInput(e, r, c));
        input.addEventListener('keydown', (e) => this.onKeyDown(e, r, c));
        input.addEventListener('focus', () => this.onFocus(r, c));

        cellDiv.appendChild(input);
        gridEl.appendChild(cellDiv);

        this.cells[key] = {
          el: cellDiv,
          input,
          row: r,
          col: c,
          wordIdx: r,
          letter: letter.toUpperCase(),
          isSecret
        };
      }
    }
  },

  buildClues() {
    const listEl = document.getElementById('crossword-clue-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    this.words.forEach((w, idx) => {
      const li = document.createElement('li');
      li.className = 'clue-item';
      li.dataset.wordIdx = idx;
      li.innerHTML = `<span class="clue-number">${w.num}.</span><span>${this.escapeHtml(w.clue)}</span>`;
      li.addEventListener('click', () => this.highlightWord(idx));
      listEl.appendChild(li);
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  highlightWord(wordIdx) {
    // Usuń poprzednie podświetlenie
    Object.values(this.cells).forEach(cell => {
      cell.el.classList.remove('highlighted', 'focused');
    });
    document.querySelectorAll('.clue-item').forEach(li => li.classList.remove('active-clue'));

    this.activeWordIdx = wordIdx;
    const wp = this.wordPositions[wordIdx];

    // Podświetl komórki wyrazu
    for (let c = 0; c < wp.word.answer.length; c++) {
      const col = wp.startCol + c;
      const key = `${wp.row}-${col}`;
      if (this.cells[key]) {
        this.cells[key].el.classList.add('highlighted');
      }
    }

    // Podświetl wskazówkę
    const clueItem = document.querySelector(`.clue-item[data-word-idx="${wordIdx}"]`);
    if (clueItem) clueItem.classList.add('active-clue');

    // Ustaw focus na pierwszej pustej komórce wyrazu
    for (let c = 0; c < wp.word.answer.length; c++) {
      const col = wp.startCol + c;
      const key = `${wp.row}-${col}`;
      if (this.cells[key] && !this.cells[key].input.value) {
        this.cells[key].input.focus();
        return;
      }
    }
    // Jeśli wszystkie wypełnione, focus na pierwszą
    const firstKey = `${wp.row}-${wp.startCol}`;
    if (this.cells[firstKey]) {
      this.cells[firstKey].input.focus();
    }
  },

  onFocus(row, col) {
    // Podświetl wyraz w tym wierszu
    if (this.activeWordIdx !== row) {
      this.highlightWord(row);
    }
    // Zaznacz aktywną komórkę
    Object.values(this.cells).forEach(cell => cell.el.classList.remove('focused'));
    const key = `${row}-${col}`;
    if (this.cells[key]) {
      this.cells[key].el.classList.add('focused');
    }
  },

  onInput(e, row, col) {
    const input = e.target;
    let val = input.value.toUpperCase();

    // Obsługa polskich znaków — zachowaj
    if (val.length > 1) {
      val = val.slice(-1);
    }
    input.value = val;

    if (val) {
      // Przejdź do następnej komórki w tym wierszu
      this.moveToNextCell(row, col);
    }

    this.checkWord(row);
  },

  onKeyDown(e, row, col) {
    const wp = this.wordPositions[row];
    if (!wp) return;

    if (e.key === 'Backspace') {
      const key = `${row}-${col}`;
      const cell = this.cells[key];
      if (cell && !cell.input.value) {
        // Cofnij do poprzedniej komórki
        e.preventDefault();
        this.moveToPrevCell(row, col);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.moveToNextCell(row, col);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.moveToPrevCell(row, col);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.moveToRow(row + 1, col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.moveToRow(row - 1, col);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const nextWordIdx = e.shiftKey
        ? (row - 1 + this.words.length) % this.words.length
        : (row + 1) % this.words.length;
      this.highlightWord(nextWordIdx);
    }
  },

  moveToNextCell(row, col) {
    const wp = this.wordPositions[row];
    if (!wp) return;
    const endCol = wp.startCol + wp.word.answer.length - 1;
    for (let c = col + 1; c <= endCol; c++) {
      const key = `${row}-${c}`;
      if (this.cells[key]) {
        this.cells[key].input.focus();
        return;
      }
    }
  },

  moveToPrevCell(row, col) {
    const wp = this.wordPositions[row];
    if (!wp) return;
    for (let c = col - 1; c >= wp.startCol; c--) {
      const key = `${row}-${c}`;
      if (this.cells[key]) {
        this.cells[key].input.focus();
        return;
      }
    }
  },

  moveToRow(newRow, col) {
    if (newRow < 0 || newRow >= this.gridRows) return;
    const key = `${newRow}-${col}`;
    if (this.cells[key]) {
      this.cells[key].input.focus();
      this.highlightWord(newRow);
    }
  },

  normalizeChar(ch) {
    // Normalizacja: traktuj polskie znaki diakrytyczne
    return ch.toUpperCase();
  },

  checkWord(row) {
    const wp = this.wordPositions[row];
    if (!wp) return;

    let allFilled = true;
    let allCorrect = true;
    const answer = wp.word.answer.toUpperCase();

    for (let c = 0; c < answer.length; c++) {
      const col = wp.startCol + c;
      const key = `${row}-${col}`;
      const cell = this.cells[key];
      if (!cell) continue;

      const val = cell.input.value.toUpperCase();
      if (!val) {
        allFilled = false;
        allCorrect = false;
      } else if (val !== answer[c]) {
        allCorrect = false;
      }
    }

    if (allFilled && allCorrect) {
      if (!this.solvedWords.has(row)) {
        this.solvedWords.add(row);
        // Oznacz komórki jako poprawne
        for (let c = 0; c < answer.length; c++) {
          const col = wp.startCol + c;
          const key = `${row}-${col}`;
          const cell = this.cells[key];
          if (cell) {
            cell.el.classList.add('correct');
            cell.input.readOnly = true;
          }
        }
        // Oznacz pytanie jako rozwiązane
        const clueItem = document.querySelector(`.clue-item[data-word-idx="${row}"]`);
        if (clueItem) clueItem.classList.add('solved-clue');

        // Aktualizuj progress
        const pct = (this.solvedWords.size / this.words.length) * 100;
        const progressEl = document.getElementById('crossword-progress');
        if (progressEl) progressEl.style.width = `${pct}%`;

        // Sprawdź czy wszystkie rozwiązane
        if (this.solvedWords.size === this.words.length) {
          this.revealSecret();
        }
      }
    }
  },

  revealSecret() {
    // Podświetl tylko komórki hasła (te z secretIdx >= 0)
    this.wordPositions.forEach((wp) => {
      if (wp.word.secretIdx >= 0) {
        const key = `${wp.row}-${this.SECRET_COL}`;
        const cell = this.cells[key];
        if (cell) {
          cell.el.classList.add('secret-revealed');
        }
      }
    });

    // Pokaż sekcję z hasłem
    setTimeout(() => {
      const secretDiv = document.getElementById('crossword-secret');
      const wordDisplay = document.getElementById('secret-word-display');

      if (wordDisplay) {
        wordDisplay.innerHTML = '';
        for (const ch of this.SECRET_WORD) {
          const span = document.createElement('span');
          span.className = 'secret-letter';
          span.textContent = ch;
          wordDisplay.appendChild(span);
        }
      }
      if (secretDiv) {
        secretDiv.classList.remove('hidden');
        secretDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 800);
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  PizzaGame.init();
  MemoryGame.init();
  CrumbHunt.init();
});

// Obsługa nawigacji przeglądarki (back/forward)
window.addEventListener('hashchange', () => App.restoreFromHash());

/* ============================================
   PIZZA GAME (Zagadka 2)
   ============================================ */
const PizzaGame = {
  score: 0,
  target: 10,
  gameActive: false,
  pizzaTimeout: null,
  gameArea: null,
  scoreDisplay: null,
  progressEl: null,
  goodEmojis: ['🧁', '🍩', '🍕', '🍰', '🍪', '🍫', '🍬', '🍭', '🎂', '🍔'],
  badEmoji: '🥣',

  init() {
    this.gameArea = document.getElementById('pizza-game-area');
    this.scoreDisplay = document.getElementById('pizza-score');
    this.progressEl = document.getElementById('pizza-progress');
    if (!this.gameArea) return;

    // Podepnij przycisk START od razu
    const btn = document.getElementById('pizza-start-btn');
    if (btn) {
      btn.addEventListener('click', () => this.startGame());
    }

    // Pauzuj grę gdy użytkownik opuści stronę 3
    const page3 = document.querySelector('[data-page="3"]');
    if (page3) {
      const observer = new MutationObserver(() => {
        if (!page3.classList.contains('active') && this.gameActive) {
          this.pauseGame();
        }
      });
      observer.observe(page3, { attributes: true, attributeFilter: ['class'] });
    }
  },

  startGame() {
    const overlay = document.getElementById('pizza-start-overlay');
    if (overlay) overlay.style.display = 'none';
    this.gameActive = true;
    this.spawnPizza();
  },

  pauseGame() {
    this.gameActive = false;
    clearTimeout(this.pizzaTimeout);
  },

  getRandomPosition() {
    const areaWidth = this.gameArea.clientWidth;
    const areaHeight = this.gameArea.clientHeight;
    const x = Math.random() * (areaWidth - 50);
    const y = Math.random() * (areaHeight - 50);
    return { x, y };
  },

  spawnPizza() {
    if (!this.gameActive) return;

    // Usuń stary element
    const old = this.gameArea.querySelector('.pizza-item');
    if (old) old.remove();

    // 20% szans na pustą miskę (negatywny punkt)
    const isBad = Math.random() < 0.2;

    const item = document.createElement('div');
    item.className = 'pizza-item';
    if (isBad) {
      item.textContent = this.badEmoji;
      item.classList.add('bad-item');
    } else {
      item.textContent = this.goodEmojis[Math.floor(Math.random() * this.goodEmojis.length)];
    }

    const pos = this.getRandomPosition();
    item.style.left = pos.x + 'px';
    item.style.top = pos.y + 'px';

    const catchHandler = (e) => {
      if (e.type === 'touchstart') e.preventDefault();
      if (isBad) {
        this.catchBad(item);
      } else {
        this.catchGood(item);
      }
    };

    item.addEventListener('click', catchHandler);
    item.addEventListener('touchstart', catchHandler);

    this.gameArea.appendChild(item);

    clearTimeout(this.pizzaTimeout);
    this.pizzaTimeout = setTimeout(() => this.spawnPizza(), 1200);
  },

  catchGood(el) {
    if (!this.gameActive) return;

    this.score++;
    this.scoreDisplay.textContent = this.score;

    // Aktualizuj progress bar
    const pct = (this.score / this.target) * 100;
    if (this.progressEl) this.progressEl.style.width = `${pct}%`;

    el.remove();
    clearTimeout(this.pizzaTimeout);

    if (this.score >= this.target) {
      this.endGame();
    } else {
      setTimeout(() => this.spawnPizza(), 100);
    }
  },

  catchBad(el) {
    if (!this.gameActive) return;

    this.score = Math.max(0, this.score - 1);
    this.scoreDisplay.textContent = this.score;

    const pct = (this.score / this.target) * 100;
    if (this.progressEl) this.progressEl.style.width = `${pct}%`;

    // Efekt wizualny — krótkie czerwone mignięcie
    el.classList.add('bad-hit');
    setTimeout(() => el.remove(), 300);

    clearTimeout(this.pizzaTimeout);
    setTimeout(() => this.spawnPizza(), 400);
  },

  endGame() {
    this.gameActive = false;
    clearTimeout(this.pizzaTimeout);

    const remaining = this.gameArea.querySelectorAll('.pizza-item');
    remaining.forEach(el => el.remove());

    // Pokaż sekcję wygranej
    const winSection = document.getElementById('pizza-win-section');
    if (winSection) {
      winSection.classList.remove('hidden');
      winSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

/* ============================================
   MEMORY GAME (Zagadka 3)
   ============================================ */
const MemoryGame = {
  icons: ['🍦', '🍩', '🧶', '🛌', '🧁', '🥐', '☁️', '🌙'],
  cards: [],
  hasFlippedCard: false,
  lockBoard: false,
  firstCard: null,
  secondCard: null,
  matchedPairs: 0,
  gridEl: null,
  scoreDisplay: null,
  progressEl: null,

  init() {
    this.gridEl = document.getElementById('memory-game-grid');
    this.scoreDisplay = document.getElementById('memory-score');
    this.progressEl = document.getElementById('memory-progress');
    if (!this.gridEl) return;

    this.createBoard();
  },

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  createBoard() {
    this.gridEl.innerHTML = '';
    this.matchedPairs = 0;
    this.hasFlippedCard = false;
    this.lockBoard = false;
    this.firstCard = null;
    this.secondCard = null;

    if (this.scoreDisplay) this.scoreDisplay.textContent = '0';
    if (this.progressEl) this.progressEl.style.width = '0%';

    this.cards = this.shuffle([...this.icons, ...this.icons]);

    this.cards.forEach(icon => {
      const card = document.createElement('div');
      card.classList.add('memory-card');
      card.dataset.icon = icon;

      card.innerHTML = `
        <div class="memory-front-face">${icon}</div>
        <div class="memory-back-face"></div>
      `;

      card.addEventListener('click', () => this.flipCard(card));
      this.gridEl.appendChild(card);
    });
  },

  flipCard(card) {
    if (this.lockBoard) return;
    if (card === this.firstCard) return;
    if (card.classList.contains('memory-flip')) return;

    card.classList.add('memory-flip');

    if (!this.hasFlippedCard) {
      this.hasFlippedCard = true;
      this.firstCard = card;
      return;
    }

    this.secondCard = card;
    this.checkForMatch();
  },

  checkForMatch() {
    const isMatch = this.firstCard.dataset.icon === this.secondCard.dataset.icon;
    isMatch ? this.disableCards() : this.unflipCards();
  },

  disableCards() {
    this.firstCard.classList.add('memory-matched');
    this.secondCard.classList.add('memory-matched');

    this.matchedPairs++;
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.matchedPairs;

    const pct = (this.matchedPairs / this.icons.length) * 100;
    if (this.progressEl) this.progressEl.style.width = `${pct}%`;

    if (this.matchedPairs === this.icons.length) {
      setTimeout(() => this.endGame(), 800);
    }

    this.resetBoard();
  },

  unflipCards() {
    this.lockBoard = true;
    setTimeout(() => {
      this.firstCard.classList.remove('memory-flip');
      this.secondCard.classList.remove('memory-flip');
      this.resetBoard();
    }, 900);
  },

  resetBoard() {
    this.hasFlippedCard = false;
    this.lockBoard = false;
    this.firstCard = null;
    this.secondCard = null;
  },

  endGame() {
    const winSection = document.getElementById('memory-win-section');
    if (winSection) {
      winSection.classList.remove('hidden');
      winSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

/* ============================================
   CRUMB HUNT GAME (Zagadka 4)
   ============================================ */
const CrumbHunt = {
  area: null,
  donutCount: 599,

  init() {
    this.area = document.getElementById('crumb-hunt-area');
    if (!this.area) return;
    this.buildField();
  },

  buildField() {
    this.area.innerHTML = '';

    const donutEmojis = ['🍩'];
    const items = [];

    // Generate donuts
    for (let i = 0; i < this.donutCount; i++) {
      items.push({ type: 'donut', emoji: donutEmojis[Math.floor(Math.random() * donutEmojis.length)] });
    }

    // Add the hidden eye
    items.push({ type: 'eye' });

    // Shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    items.forEach(item => {
      const el = document.createElement('span');
      el.className = 'crumb-item';

      if (item.type === 'eye') {
        el.textContent = '👁️';
        el.classList.add('crumb-eye');
        el.title = '';
        el.addEventListener('click', () => this.foundEye(el));
      } else {
        el.textContent = item.emoji;
        el.classList.add('crumb-donut');
        // Random color
        const hue = Math.floor(Math.random() * 360);
        el.style.filter = `hue-rotate(${hue}deg)`;
      }

      // Random slight rotation only
      const rotation = (Math.random() - 0.5) * 40;
      el.style.transform = `rotate(${rotation}deg)`;

      this.area.appendChild(el);
    });
  },

  foundEye(el) {
    el.classList.add('crumb-found');

    // Flash effect on the area
    this.area.classList.add('crumb-found-flash');

    setTimeout(() => {
      const winSection = document.getElementById('crumb-win-section');
      if (winSection) {
        winSection.classList.remove('hidden');
        winSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 600);
  }
};
