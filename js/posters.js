/* ============================================================
   posters.js — lógica compartida de Cinser
   ============================================================ */

let _listaModal = [];
let currentIndex = 0;
let startX = 0;
let _savedScrollY = 0;

const modal    = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');

/* ── SHUFFLE ────────────────────────────────────────────────── */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ── RENDER LISTA EN CONTENEDOR ─────────────────────────────── */
function _renderList(lista, container, offset) {
    lista.forEach((peli, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'poster-wrap';

        const skeleton = document.createElement('div');
        skeleton.className = 'poster-skeleton';

        const img = document.createElement('img');
        img.alt     = peli.tit || '';
        img.loading = 'lazy';

        img.addEventListener('load',  () => skeleton.style.display = 'none');
        img.addEventListener('error', () => { skeleton.style.display = 'none'; img.style.display = 'none'; });
        img.src = peli.img || '';
        if (!peli.img) { skeleton.style.display = 'none'; img.style.display = 'none'; }

        const idx = offset + i;
        wrap.addEventListener('click', () => openModal(idx));
        wrap.appendChild(skeleton);
        wrap.appendChild(img);
        container.appendChild(wrap);
    });
}

/* ── RENDER SIMPLE (una sola lista) ─────────────────────────── */
function renderPosters(lista) {
    _listaModal = lista;
    const container = document.getElementById('posters');
    container.innerHTML = '';
    if (!lista.length) {
        container.innerHTML = '<p class="vacio">No hay películas que mostrar.</p>';
        return;
    }
    _renderList(lista, container, 0);
}

/* ── RENDER BLOQUES ─────────────────────────────────────────── */
/* bloques: [ { titulo, lista }, ... ]
   root: el elemento donde montar (por defecto #bloques o crea uno) */
function renderBloques(bloques, rootId) {
    _listaModal = bloques.flatMap(b => b.lista);

    const root = document.getElementById(rootId || 'bloques');
    root.innerHTML = '';

    let offset = 0;
    bloques.forEach(({ titulo, lista }) => {
        if (!lista.length) return;

        const bloque = document.createElement('div');
        bloque.className = 'bloque';

        const tit = document.createElement('div');
        tit.className = 'bloque-titulo';
        tit.textContent = titulo;
        bloque.appendChild(tit);

        const grid = document.createElement('div');
        grid.className = 'posters';
        bloque.appendChild(grid);

        _renderList(lista, grid, offset);
        offset += lista.length;

        root.appendChild(bloque);
    });
}

/* ── RENDER BLOQUES DE TEXTO (series sin poster, punt 1-4) ──── */
/* bloques: [ { titulo, lista }, ... ] — cada serie navega directo a pelicula.html */
function renderBloquesTexto(bloques, rootId, append) {
    const root = document.getElementById(rootId || 'bloques');
    if (!append) root.innerHTML = '';

    bloques.forEach(({ titulo, lista }) => {
        if (!lista.length) return;

        const bloque = document.createElement('div');
        bloque.className = 'bloque';

        const tit = document.createElement('div');
        tit.className = 'bloque-titulo';
        tit.textContent = titulo;
        bloque.appendChild(tit);

        const grid = document.createElement('div');
        grid.className = 'tarjetas-texto';

        lista.forEach(serie => {
            const card = document.createElement('div');
            card.className = 'tarjeta-texto';
            card.innerHTML = `
                <div class="tt-tit">${serie.tit || ''}</div>
                <div class="tt-anyo">${serie.anyo || ''}</div>
            `;
            card.addEventListener('click', () => {
                sessionStorage.setItem('cinser_peli', JSON.stringify(serie));
                sessionStorage.setItem('cinser_back', window.location.href);
                sessionStorage.setItem('cinser_scroll', String(window.scrollY));
                window.location.href = 'pelicula.html';
            });
            grid.appendChild(card);
        });

        bloque.appendChild(grid);
        root.appendChild(bloque);
    });
}

/* ── MODAL ─────────────────────────────────────────────────── */
function openModal(index) {
    currentIndex = index;
    _savedScrollY = window.scrollY;
    modal.style.display = 'flex';
    _updateModal('zoom');
    _buildDots();
}
function closeModal() {
    modal.style.display = 'none';
    setTimeout(() => window.scrollTo({ top: _savedScrollY, behavior: 'instant' }), 0);
}

function showNext() {
    currentIndex = (currentIndex + 1) % _listaModal.length;
    _updateModal('right');
}
function showPrev() {
    currentIndex = (currentIndex - 1 + _listaModal.length) % _listaModal.length;
    _updateModal('left');
}

function _updateModal(dir) {
    const peli = _listaModal[currentIndex];
    const anim = dir === 'right' ? 'slideR' : dir === 'left' ? 'slideL' : 'zoomIn';
    modalImg.src = peli.img || '';
    modalImg.alt = peli.tit || '';
    modalImg.style.animation = 'none';
    modalImg.offsetHeight;
    modalImg.style.animation = `${anim} 0.4s ease`;
    _updateDots();
}

function _buildDots() {}
function _updateDots() {}

/* Scroll rueda → navegar */
modal.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.deltaY > 0 || e.deltaX > 0) showNext(); else showPrev();
}, { passive: false });

/* Clic en poster → pelicula.html */
modalImg.addEventListener('click', () => {
    const peli = _listaModal[currentIndex];
    sessionStorage.setItem('cinser_peli', JSON.stringify(peli));
    sessionStorage.setItem('cinser_back', window.location.href);
    sessionStorage.setItem('cinser_scroll', String(_savedScrollY));
    window.location.href = 'pelicula.html';
});

/* Swipe táctil */
modalImg.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
modalImg.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff >  50) showNext();
    if (diff < -50) showPrev();
});

modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.addEventListener('keydown', e => {
    if (modal.style.display !== 'flex') return;
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'Escape')     closeModal();
});

/* Restaurar scroll al volver */
window.addEventListener('pageshow', () => {
    const saved = parseInt(sessionStorage.getItem('cinser_scroll') || '0');
    if (saved) {
        window.scrollTo({ top: saved, behavior: 'instant' });
        sessionStorage.removeItem('cinser_scroll');
    }
});

/* ── SCROLL BARRA ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const scrollEl = document.querySelector('.barra-nav-scroll');
    if (!scrollEl) return;
    document.querySelector('.scroll-btn.left')?.addEventListener('click',
        () => scrollEl.scrollBy({ left: -200, behavior: 'smooth' }));
    document.querySelector('.scroll-btn.right')?.addEventListener('click',
        () => scrollEl.scrollBy({ left: 200, behavior: 'smooth' }));
});
