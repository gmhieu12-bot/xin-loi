/**
 * Matrix Apology — script.js
 * Thuần HTML/CSS/JS, ES6+, không dùng thư viện ngoài.
 *
 * Luồng chính:
 * 1. Matrix Rain chạy ngay khi load.
 * 2. Sau 5 giây → hiện message box + hiệu ứng gõ chữ.
 * 3. Sau khi gõ xong → hiện 2 nút.
 * 4. Nút "Chưa đâu" → chạy trốn chuột/cảm ứng.
 * 5. Nút "Tha lỗi" → tim bay + dòng cảm ơn.
 */

'use strict';

/* ============================================================
   1. MATRIX RAIN
   ============================================================ */
(function initMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  const ctx    = canvas.getContext('2d');

  // Bộ ký tự matrix (tiếng Nhật + số + ASCII)
  const CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()+=-[]{}|;:,./<>?';

  const FONT_SIZE  = 16;        // px
  const COLOR_HEAD = '#ffffff'; // đầu cột sáng trắng
  const COLOR_MAIN = '#ff69b4'; // thân cột hồng neon
  const FADE_ALPHA = 0.05;      // độ mờ mỗi frame (thấp = vệt dài hơn)

  let columns = 0;
  let drops   = [];             // vị trí y (tính bằng số hàng) của mỗi cột

  /** Khởi tạo / resize canvas */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const newCols = Math.floor(canvas.width / FONT_SIZE);

    // Giữ lại drop cũ nếu có, thêm mới nếu cần
    if (newCols > columns) {
      for (let i = columns; i < newCols; i++) {
        drops.push(Math.random() * -canvas.height / FONT_SIZE | 0);
      }
    } else {
      drops.length = newCols;
    }
    columns = newCols;
  }

  /** Vẽ một frame */
  function draw() {
    // Lớp phủ mờ dần tạo hiệu ứng vệt
    ctx.fillStyle = `rgba(0, 0, 0, ${FADE_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px 'JetBrains Mono', Consolas, monospace`;

    for (let i = 0; i < columns; i++) {
      const char = CHARS[Math.random() * CHARS.length | 0];
      const x    = i * FONT_SIZE;
      const y    = drops[i] * FONT_SIZE;

      // Ký tự đầu cột sáng hơn
      const isHead = Math.random() > 0.92;
      ctx.fillStyle  = isHead ? COLOR_HEAD : COLOR_MAIN;
      ctx.shadowBlur = isHead ? 10 : 4;
      ctx.shadowColor = '#ff69b4';

      ctx.fillText(char, x, y);

      // Reset cột sau khi chạy đến cuối màn hình (có xác suất ngẫu nhiên)
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    ctx.shadowBlur = 0; // reset shadow để không ảnh hưởng UI
  }

  // Dùng requestAnimationFrame để giữ 60 FPS
  let lastTime = 0;
  const FPS_INTERVAL = 1000 / 60;

  function loop(timestamp) {
    requestAnimationFrame(loop);
    if (timestamp - lastTime < FPS_INTERVAL) return;
    lastTime = timestamp;
    draw();
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
})();


/* ============================================================
   2. TYPEWRITER — hiệu ứng gõ chữ từng ký tự
   ============================================================ */

/** Nội dung cần gõ (mảng các dòng) */
const LINES = [
  '> Initializing...',
  '> Loading feelings...',
  '> Searching for mistakes...',
  '✓ Mistakes found.',
  '',
  'try {',
  '    say("Anh xin lỗi em.");',
  '    say("Anh biết mình đã làm em buồn.");',
  '    say("Anh xin lỗi em nhiều lắm...");',
  '} catch(BrokenHeartException){',
  '    foreverMissYou();',
  '}',
];

/**
 * Gõ từng ký tự vào element target.
 * Trả về Promise resolve khi gõ xong toàn bộ.
 * @param {HTMLElement} el     - element nhận text
 * @param {string[]}    lines  - mảng các dòng
 * @param {number}      speed  - ms mỗi ký tự
 */
function typewriter(el, lines, speed = 40) {
  return new Promise(resolve => {
    let lineIdx = 0;
    let charIdx = 0;
    let fullText = '';

    // Cursor nhấp nháy ở cuối
    const cursor = '█';

    function typeNext() {
      if (lineIdx >= lines.length) {
        // Xong — xoá cursor
        el.textContent = fullText;
        resolve();
        return;
      }

      const line = lines[lineIdx];

      if (charIdx <= line.length) {
        // Thêm ký tự tiếp theo
        const partial = fullText + line.slice(0, charIdx) + cursor;
        el.textContent = partial;
        charIdx++;

        // Tốc độ gõ thay đổi nhẹ cho tự nhiên
        const delay = line[charIdx - 1] === '.' ? speed * 4 :
                      line[charIdx - 1] === ',' ? speed * 2 : speed;
        setTimeout(typeNext, delay);
      } else {
        // Hết dòng, xuống dòng mới
        fullText += line + '\n';
        lineIdx++;
        charIdx = 0;
        setTimeout(typeNext, speed * 3);
      }
    }

    typeNext();
  });
}


/* ============================================================
   3. KHỞI ĐỘNG SAU 5 GIÂY
   ============================================================ */
setTimeout(async () => {
  const messageBox  = document.getElementById('message-box');
  const typedText   = document.getElementById('typed-text');
  const btnContainer = document.getElementById('btn-container');

  // Hiện hộp message
  messageBox.classList.remove('hidden');

  // Gõ chữ
  await typewriter(typedText, LINES, 38);

  // Đặt nút về vị trí trung tâm ban đầu
  const btnNo = document.getElementById('btn-no');
  positionBtnNoCenter();

  // Hiện nút
  btnContainer.classList.remove('hidden');
  initNoButton();
}, 5000);


/* ============================================================
   4. NÚT "CHƯA ĐÂU" — chạy trốn chuột/cảm ứng
   ============================================================ */

/** Đặt nút Chưa đâu về vị trí ban đầu (gần btn-yes) */
function positionBtnNoCenter() {
  const btnNo = document.getElementById('btn-no');
  const rect  = document.getElementById('btn-container').getBoundingClientRect();

  btnNo.style.left = `${rect.left + rect.width * 0.62}px`;
  btnNo.style.top  = `${rect.top  + rect.height * 0.3}px`;
}

/** Khởi tạo hành vi trốn chạy */
function initNoButton() {
  const btnNo = document.getElementById('btn-no');
  const ESCAPE_DISTANCE = 120; // px — khi chuột vào vùng này thì chạy
  const MARGIN = 20;           // khoảng cách an toàn với mép màn hình

  /**
   * Di chuyển nút đến vị trí ngẫu nhiên tránh xa clientX, clientY.
   */
  function escape(clientX, clientY) {
    const btnW = btnNo.offsetWidth;
    const btnH = btnNo.offsetHeight;
    const maxX = window.innerWidth  - btnW - MARGIN;
    const maxY = window.innerHeight - btnH - MARGIN;

    // Thử tối đa 10 lần để tìm vị trí đủ xa
    let nx, ny, attempts = 0;
    do {
      nx = MARGIN + Math.random() * maxX;
      ny = MARGIN + Math.random() * maxY;
      attempts++;
    } while (
      attempts < 10 &&
      Math.hypot(nx - clientX, ny - clientY) < ESCAPE_DISTANCE
    );

    btnNo.style.left       = `${nx}px`;
    btnNo.style.top        = `${ny}px`;
    btnNo.style.transition = 'left 0.25s ease, top 0.25s ease';
  }

  // Desktop: mousemove
  document.addEventListener('mousemove', e => {
    const rect = btnNo.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

    if (dist < ESCAPE_DISTANCE) {
      escape(e.clientX, e.clientY);
    }
  });

  // Mobile: touchstart / touchmove
  function handleTouch(e) {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = btnNo.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dist = Math.hypot(touch.clientX - cx, touch.clientY - cy);
    if (dist < ESCAPE_DISTANCE + 40) {
      escape(touch.clientX, touch.clientY);
    }
  }
  document.addEventListener('touchstart', handleTouch, { passive: true });
  document.addEventListener('touchmove',  handleTouch, { passive: true });
}


/* ============================================================
   5. NÚT "THA LỖI" — tim bay + dòng cảm ơn
   ============================================================ */
document.getElementById('btn-yes').addEventListener('click', () => {
  // Ẩn message box
  document.getElementById('message-box').classList.add('hidden');

  // Phát tim bay
  startHearts();

  // Hiện dòng cảm ơn sau 0.6s
  setTimeout(() => {
    document.getElementById('thanks-overlay').classList.remove('hidden');
  }, 600);
});

/**
 * Tạo tim bay liên tục khắp màn hình.
 */
function startHearts() {
  const container = document.getElementById('hearts-container');
  const HEARTS    = ['❤️', '💖', '💗', '💓', '💝', '🌸', '✨'];
  const TOTAL     = 60;  // tổng số tim phóng ra
  let   count     = 0;

  function spawnHeart() {
    if (count >= TOTAL) return;
    count++;

    const heart = document.createElement('span');
    heart.classList.add('heart');
    heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];

    // Vị trí ngang ngẫu nhiên
    heart.style.left     = `${Math.random() * 95}vw`;
    heart.style.fontSize = `${1.2 + Math.random() * 2}rem`;

    // Thời gian bay
    const duration = 2.5 + Math.random() * 3;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay   = `0s`;

    container.appendChild(heart);

    // Xoá sau khi animation xong
    heart.addEventListener('animationend', () => heart.remove(), { once: true });

    // Phun particle tại điểm xuất phát
    spawnParticles(
      parseFloat(heart.style.left) / 100 * window.innerWidth,
      window.innerHeight - 40
    );

    // Spawn tim kế tiếp với khoảng trễ ngẫu nhiên
    setTimeout(spawnHeart, 80 + Math.random() * 200);
  }

  spawnHeart();

  // Tiếp tục phun thêm tim vô tận (ít hơn) sau khi burst đầu
  setTimeout(() => {
    setInterval(() => {
      const heart = document.createElement('span');
      heart.classList.add('heart');
      heart.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      heart.style.left     = `${Math.random() * 95}vw`;
      heart.style.fontSize = `${1 + Math.random() * 1.5}rem`;
      const dur = 3 + Math.random() * 4;
      heart.style.animationDuration = `${dur}s`;
      container.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }, 300);
  }, TOTAL * 150);
}

/**
 * Tạo particle burst tại (x, y).
 * @param {number} x
 * @param {number} y
 */
function spawnParticles(x, y) {
  const container = document.getElementById('hearts-container');
  const COLORS    = ['#ff6b6b', '#ff8c94', '#ffaaa5', '#00ff41', '#ffffff', '#ffd6e0'];
  const COUNT     = 10;

  for (let i = 0; i < COUNT; i++) {
    const p   = document.createElement('div');
    p.classList.add('particle');

    const angle = Math.random() * Math.PI * 2;
    const dist  = 40 + Math.random() * 80;
    const tx    = Math.cos(angle) * dist;
    const ty    = Math.sin(angle) * dist - 60; // thiên về phía trên

    p.style.left       = `${x}px`;
    p.style.top        = `${y}px`;
    p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    p.style.animationDuration = `${0.6 + Math.random() * 0.8}s`;
    p.style.width  = `${4 + Math.random() * 6}px`;
    p.style.height = p.style.width;
    p.style.boxShadow = `0 0 6px ${p.style.background}`;

    container.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}
