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

// Start
document.addEventListener('DOMContentLoaded', () => App.init());

// Obsługa nawigacji przeglądarki (back/forward)
window.addEventListener('hashchange', () => App.restoreFromHash());
