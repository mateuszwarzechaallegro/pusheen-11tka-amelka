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
    { num: 3,  answer: 'LENIWIEC',  clue: 'Najwolniejszy przyjaciel Pusheena, który kocha się przytulać.',           secretIdx: -1 },
    { num: 4,  answer: 'MRUCZY',    clue: 'Kocia mama lub kocie dziecko robi to, gdy jest bardzo szczęśliwe (dźwięk).', secretIdx: -1 },
    { num: 5,  answer: 'BO',        clue: 'Mały, żółty ptaszek, który zawsze towarzyszy ekipie.',                    secretIdx: -1 },
    { num: 6,  answer: 'PĄCZEK',    clue: 'Coś słodkiego z dziurką w środku i kolorową posypką.',                    secretIdx: 1  },
    { num: 7,  answer: 'FILIŻANCE', clue: 'Gdy Pusheen pije herbatę, robi to w eleganckiej...',                      secretIdx: -1 },
    { num: 8,  answer: 'WIBRYSY',   clue: 'Inna nazwa kocich wąsów (bardzo trudne słowo!).',                         secretIdx: 0  },
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
document.addEventListener('DOMContentLoaded', () => App.init());

// Obsługa nawigacji przeglądarki (back/forward)
window.addEventListener('hashchange', () => App.restoreFromHash());
