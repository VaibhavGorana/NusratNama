// playerManager.js
// NusratNama - Global Player Manager
// Drop this script on every page (before </body>).

function initFullPlayer() {
  const container = document.getElementById("nn-full-player");
  if (!container) return;

  container.innerHTML = `
    <div class="grid">
      <!-- ================= LEFT: PLAYER + META ================= -->
      <section class="player-wrap" id="playerWrap">
        <div class="player-top">
          <div class="player-aspect" id="playerBox">
            <video id="video" preload="metadata" playsinline></video>
            <div class="buffer-wrap" aria-hidden="true">
              <div class="buffered" id="buffered"></div>
              <div class="played" id="played"></div>
            </div>
          </div>
          <div class="controls" aria-label="Player Controls">
            <div class="left">
              <button class="btn" id="btnPlay" title="Play/Pause">▶️ / ⏸</button>
              <button class="btn ghost" id="btnPrev" title="Previous">⏮</button>
              <button class="btn ghost" id="btnNext" title="Next">⏭</button>
              <span class="time" id="time">00:00 / 00:00</span>
            </div>
            <div class="seek" id="seek">
              <div class="bar" id="seekBar"></div>
            </div>
            <div class="right">
              <input type="range" class="range" id="vol" min="0" max="1" step="0.01" value="0.85" aria-label="Volume" />
              <button class="btn ghost" id="btnMute" title="Mute">🔇</button>
              <button class="btn ghost" id="btnFs" title="Fullscreen">⛶</button>
              <button class="btn" id="btnMini" title="Minimize">▢</button>
            </div>
          </div>
        </div>

        <div class="meta">
          <div class="title" id="songTitle">—</div>
          <div class="artist" id="songArtist">Nusrat Fateh Ali Khan</div>
          <div class="chips" id="songTags"></div>
          <div class="actions">
            <button class="btn ghost" id="btnLike">👍 Like</button>
            <button class="btn ghost" id="btnFav">🔖 Save</button>
            <button class="btn ghost" id="btnAddPl">➕ Add to Playlist</button>
          </div>

          <div class="accordion" id="accLyrics">
            <div class="acc-head" id="toggleLyrics">
              <h3>Lyrics</h3>
              <span id="lyrChevron">▾</span>
            </div>
            <div class="acc-body" id="lyricsBody">
              <div class="lyrics" id="lyricsText">Lyrics not available for this track.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================= RIGHT: RECOMMENDATIONS / PLAYLIST ================= -->
      <aside class="side">
        <h3 id="sideTitle">Up Next</h3>
        <div class="list" id="recoList"></div>
      </aside>
    </div>
  `;
}

// run on page load
document.addEventListener("DOMContentLoaded", initFullPlayer);


(function () {
  if (window.PlayerManager) return; // single load

  const STORAGE_KEY = 'nn_current';   // saved current track + time
  const QUEUE_KEY   = 'nn_queue';     // saved queue array
  const MINI_ID     = 'nn-mini-player';

  // default tag -> css class map (extendable)
  const TAG_CLASS = {
    love: 'tag-love',
    spiritual: 'tag-spiritual',
    devotional: 'tag-spiritual',
    live: 'tag-live',
    sufi: 'tag-spiritual',
    legendary: 'tag-legendary',
    celebration: 'tag-celebration'
  };

  // Insert styles for mini + full player
  const STYLE = `
  /* --- NusratNama Global Player styles --- */
  #${MINI_ID} { position:fixed; right:18px; bottom:18px; width:360px; max-width:92vw;
    background:#0f0f0f; border:1px solid rgba(212,175,55,0.12); border-radius:14px; z-index:20000;
    box-shadow:0 18px 60px rgba(0,0,0,.45); overflow:hidden; font-family: Georgia, "Times New Roman", serif; color:#efeae1; display:none; }
  #${MINI_ID}.active { display:block; animation: slideUp .28s ease; }
  #${MINI_ID} .mini-head { display:flex; gap:10px; align-items:center; padding:8px 10px; }
  #${MINI_ID} .mini-thumb { width:56px; height:56px; object-fit:cover; border-radius:8px; flex-shrink:0; }
  #${MINI_ID} .mini-meta { flex:1; min-width:0; }
  #${MINI_ID} .mini-meta .title { color:#d4af37; font-weight:700; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #${MINI_ID} .mini-meta .artist { font-size:0.85rem; color:#bfb7ac; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #${MINI_ID} .mini-controls { display:flex; gap:8px; align-items:center; }
  #${MINI_ID} .btn { background:var(--gold,#d4af37); color:#080706; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:700; }
  #${MINI_ID} .btn.ghost { background:transparent; border:1px solid rgba(255,255,255,0.06); color:#efeae1; }
  #${MINI_ID} .mini video { width:100%; height:auto; display:block; max-height:220px; background:#000; }
  #${MINI_ID} .mini-bottom { display:flex; gap:8px; align-items:center; padding:8px 10px; border-top:1px solid rgba(255,255,255,0.03); }
  #${MINI_ID} .progress { flex:1; height:6px; background:#222; border-radius:8px; overflow:hidden; cursor:pointer; }
  #${MINI_ID} .progress > i { display:block; height:100%; width:0%; background:#d4af37; transition: width 0.12s linear; }
  #${MINI_ID} .mini-vol { width:84px; }
  #${MINI_ID} .mini-close { background:transparent; border:none; color:#e9dfc7; font-size:18px; cursor:pointer; }

  /* small resume overlay when autoplay blocked */
  #${MINI_ID} .resume { padding:10px; text-align:center; border-top:1px dashed rgba(255,255,255,0.04); }

  @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform:none; opacity:1 } }

  /* Tag colors (copy to your main CSS if you want global) */
  .tag-love { background:#d6336c22; color:#ff6b9a; padding:2px 8px; border-radius:999px; font-weight:700; }
  .tag-spiritual { background:#0ca67822; color:#63e6be; padding:2px 8px; border-radius:999px; font-weight:700; }
  .tag-live { background:#e0313133; color:#ff8787; padding:2px 8px; border-radius:999px; font-weight:700; }
  .tag-legendary { background:#f59f0033; color:#ffd43b; padding:2px 8px; border-radius:999px; font-weight:700; }
  .tag-celebration { background:#f59f0033; color:#ffd43b; padding:2px 8px; border-radius:999px; font-weight:700; }
  `;

  // inject style once
  function injectStyle() {
    if (document.getElementById('nn-player-styles')) return;
    const s = document.createElement('style');
    s.id = 'nn-player-styles';
    s.innerHTML = STYLE;
    document.head.appendChild(s);
  }

  // create root mini DOM
  function createMiniDOM() {
    if (document.getElementById(MINI_ID)) return document.getElementById(MINI_ID);
    const wrap = document.createElement('div');
    wrap.id = MINI_ID;
    wrap.innerHTML = `
      <div class="mini-head">
        <img class="mini-thumb" id="nn-mini-thumb" src="" alt="cover">
        <div class="mini-meta">
          <div class="title" id="nn-mini-title">No track</div>
          <div class="artist" id="nn-mini-artist">—</div>
        </div>
        <div class="mini-controls">
          <button class="btn ghost" id="nn-mini-prev" title="Previous">⏮</button>
          <button class="btn" id="nn-mini-play" title="Play/Pause">▶</button>
          <button class="btn ghost" id="nn-mini-next" title="Next">⏭</button>
        </div>
        <button class="mini-close" id="nn-mini-close" title="Close">✖</button>
      </div>
      <video id="nn-mini-video" playsinline></video>
      <div class="mini-bottom">
        <div class="progress" id="nn-mini-progress"><i id="nn-mini-progress-i"></i></div>
        <input id="nn-mini-vol" class="mini-vol" type="range" min="0" max="1" step="0.01" value="0.9" />
        <button class="btn ghost" id="nn-mini-open" title="Open player page">Open</button>
      </div>
      <div class="resume" id="nn-mini-resume" style="display:none;">
        Playback blocked — <button id="nn-mini-resume-btn" class="btn">Click to resume</button>
      </div>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  // helper: save and read storage
  function saveCurrent(obj) { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {})); }
  function loadCurrent() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { return null; } }
  function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q || [])); }
  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } }

  // small util to format seconds -> mm:ss
  function fmtTime(secs) {
    if (!isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // PlayerManager object
  const PlayerManager = {
    _inited: false,
    current: null,   // {id,title,artist,file,cover,tags}
    queue: [],       // array of ids (or array of song objects if you prefer)
    video: null,     // the single <video> element used by manager
    ui: {},

    init() {
      if (this._inited) return;
      injectStyle();
      const miniWrap = createMiniDOM();

      // wire UI refs
      this.ui.wrap = miniWrap;
      this.ui.thumb = miniWrap.querySelector('#nn-mini-thumb');
      this.ui.title = miniWrap.querySelector('#nn-mini-title');
      this.ui.artist = miniWrap.querySelector('#nn-mini-artist');
      this.ui.video = miniWrap.querySelector('#nn-mini-video');
      this.ui.playBtn = miniWrap.querySelector('#nn-mini-play');
      this.ui.prevBtn = miniWrap.querySelector('#nn-mini-prev');
      this.ui.nextBtn = miniWrap.querySelector('#nn-mini-next');
      this.ui.closeBtn = miniWrap.querySelector('#nn-mini-close');
      this.ui.openBtn = miniWrap.querySelector('#nn-mini-open');
      this.ui.progress = miniWrap.querySelector('#nn-mini-progress');
      this.ui.progressI = miniWrap.querySelector('#nn-mini-progress-i');
      this.ui.vol = miniWrap.querySelector('#nn-mini-vol');
      this.ui.resumeWrap = miniWrap.querySelector('#nn-mini-resume');
      this.ui.resumeBtn = miniWrap.querySelector('#nn-mini-resume-btn');

      // set crossOrigins and basic props
      this.video = this.ui.video;
      this.video.preload = 'metadata';
      this.video.crossOrigin = 'anonymous';

      // event bindings
      this.ui.playBtn.addEventListener('click', () => this.toggle());
      this.ui.prevBtn.addEventListener('click', () => this.prev());
      this.ui.nextBtn.addEventListener('click', () => this.next());
      this.ui.closeBtn.addEventListener('click', () => this.close());
      this.ui.openBtn.addEventListener('click', () => this.openPlayerPage());
      this.ui.vol.addEventListener('input', (e) => { this.video.volume = +e.target.value; });
      this.ui.progress.addEventListener('click', (e) => {
        if (!this.video.duration) return;
        const r = this.ui.progress.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        this.video.currentTime = ratio * this.video.duration;
      });

      // resume CTA (if autoplay blocked)
      this.ui.resumeBtn.addEventListener('click', () => {
        this.ui.resumeWrap.style.display = 'none';
        this.video.play().catch(()=>{ /* give up */ });
      });

      // video events
      this.video.addEventListener('timeupdate', () => {
        const d = this.video.duration || 0;
        const cur = this.video.currentTime || 0;
        const pct = d ? (cur / d) * 100 : 0;
        this.ui.progressI.style.width = pct + '%';
        // persist time
        const currentState = loadCurrent() || {};
        currentState.t = cur;
        saveCurrent(currentState);
      });
      this.video.addEventListener('ended', () => {
        this.next();
      });
      this.video.addEventListener('playing', () => {
        this.ui.playBtn.textContent = '❚❚';
        this.ui.resumeWrap.style.display = 'none';
      });
      this.video.addEventListener('pause', () => {
        this.ui.playBtn.textContent = '▶';
      });
      this.video.addEventListener('error', (e) => {
        console.warn('PlayerManager video error:', e);
      });
      this.video.addEventListener('loadedmetadata', () => {
        // if saved time exists, restore it
        const cur = loadCurrent();
        if (cur && typeof cur.t === 'number') {
          try { this.video.currentTime = cur.t; } catch (e) { /* browsers may prohibit set before metadata */ }
        }
      });

      // startup: read storage and restore UI
      const stored = loadCurrent();
      if (stored && stored.song) {
        this.current = stored.song;
        this.queue = loadQueue() || [];
        this._applyCurrentToUI();
        // try to auto-play (may be blocked by browser)
        this.video.src = this.current.file;
        const startT = stored.t || 0;
        this.video.currentTime = startT;
        this.video.play().catch(()=> { // autoplay blocked — show resume CTA
          this.ui.resumeWrap.style.display = 'block';
        });
        this.showMini();
      }

      // check if page has a #nn-full-player container: if yes, mount full UI there
      const fullContainer = document.getElementById('nn-full-player');
      if (fullContainer) this._mountFullPlayer(fullContainer);

      this._inited = true;
      // expose globally too
      window.PlayerManager = this;
    },

    // Public API: setSong — accepts song object {id,title,artist,file,cover,tags}
    // opts: { queue: [id...], autoplay:true|false, startTime:number }
    setSong(song, opts = {}) {
      if (!song || !song.file) {
        console.warn('PlayerManager.setSong: invalid song object', song);
        return;
      }
      this.current = {
        id: song.id,
        title: song.title || song.name || 'Untitled',
        artist: song.artist || song.artist || '—',
        file: song.file,
        cover: song.cover || '',
        tags: song.tags || []
      };

      // queue handling
      if (opts.queue && Array.isArray(opts.queue)) {
        this.queue = opts.queue.slice();
        saveQueue(this.queue);
      }

      // persist to storage
      saveCurrent({ song: this.current, t: (opts.startTime || 0) });

      // update UI
      this._applyCurrentToUI();

      // set src and try play
      try {
        this.video.src = this.current.file;
        if (opts.startTime) this.video.currentTime = opts.startTime;
      } catch (e) { /* ignore */ }

      const playNow = opts.autoplay !== false; // default true
      if (playNow) {
        this.video.play().then(() => {
          // success
        }).catch(() => {
          // autoplay blocked -> show resume CTA so user can click
          this.ui.resumeWrap.style.display = 'block';
        });
      }

      this.showMini();
    },

    play() { if (this.video) this.video.play(); },
    pause() { if (this.video) this.video.pause(); },
    toggle() { if (this.video) (this.video.paused ? this.video.play() : this.video.pause()); },

    // move to next in queue (if queue is ids, resolve via SONGS if available)
    next() {
      if (!this.queue || !this.queue.length) return;
      const idx = this.queue.indexOf(this.current?.id);
      const nextIdx = (idx === -1) ? 0 : Math.min(this.queue.length - 1, idx + 1);
      const nextId = this.queue[nextIdx];
      // try to resolve from global SONGS array if present
      const resolved = (window.SONGS || []).find(s => s.id === nextId);
      if (resolved) this.setSong(resolved, { queue: this.queue, autoplay: true });
      else {
        // fallback: if queue stores full objects
        const item = this.queue[nextIdx];
        if (item && item.file) this.setSong(item, { queue: this.queue, autoplay: true });
      }
    },

    prev() {
      if (!this.queue || !this.queue.length) return;
      const idx = this.queue.indexOf(this.current?.id);
      const prevIdx = (idx === -1) ? 0 : Math.max(0, idx - 1);
      const prevId = this.queue[prevIdx];
      const resolved = (window.SONGS || []).find(s => s.id === prevId);
      if (resolved) this.setSong(resolved, { queue: this.queue, autoplay: true });
      else {
        const item = this.queue[prevIdx];
        if (item && item.file) this.setSong(item, { queue: this.queue, autoplay: true });
      }
    },

    showMini() {
      this.ui.wrap.classList.add('active');
    },

    hideMini() {
      this.ui.wrap.classList.remove('active');
    },

    // Close mini-player permanently (clears storage)
    close() {
      this.pause();
      saveCurrent(null);
      saveQueue([]);
      this.hideMini();
      this.current = null;
      this.queue = [];
    },

    // Open full player page (you should have player.html which reads id param)
    // This simply navigates to player.html with id and queue info (if queue exists)
    openPlayerPage() {
      if (!this.current) return;
      const params = new URLSearchParams();
      params.set('id', this.current.id);
      if (this.queue && this.queue.length) params.set('list', this.queue.join(','));
      // Open in same tab
      const href = 'player.html?' + params.toString();
      window.location.href = href;
    },

    // Called on pages that want the full player embedded directly.
    // If your player.html includes <div id="nn-full-player"></div>, PlayerManager will auto-mount.
    _mountFullPlayer(container) {
      // We will move the same <video> element into container and create
      // a simple full-player shell if it's not present.
      container.innerHTML = `
        <div id="nn-full-shell" style="border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.04); background:linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.08)); padding:10px;">
          <div id="nn-full-video-wrap" style="background:#000; border-radius:8px; overflow:hidden;"></div>
          <div id="nn-full-meta" style="padding:12px;"></div>
        </div>`;
      const wrap = container.querySelector('#nn-full-video-wrap');
      // move the existing managed video element into the full player
      wrap.appendChild(this.video);
      // populate meta area with dynamic content when songs load
      const meta = container.querySelector('#nn-full-meta');
      this._fullMetaEl = meta;
      // when a song is set, _applyCurrentToUI will also update this meta
      // expose an API to expand/restore mini as needed
    },

    // Called when current is set/loaded to update mini UI
    _applyCurrentToUI() {
      if (!this.current) return;
      if (this.ui.thumb) this.ui.thumb.src = this.current.cover || '';
      if (this.ui.title) this.ui.title.textContent = this.current.title || 'Untitled';
      if (this.ui.artist) this.ui.artist.textContent = this.current.artist || '—';
      // update persisted object
      const existing = loadCurrent() || {};
      existing.song = this.current;
      saveCurrent(existing);
      // update full player meta if present
      if (this._fullMetaEl) {
        const tagsHTML = (this.current.tags || []).map(t => {
          const cls = TAG_CLASS[t] ? TAG_CLASS[t] : '';
          return `<span class="${cls}" style="margin-right:6px">${t}</span>`;
        }).join('');
        this._fullMetaEl.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:1.4rem; font-weight:800; color:var(--gold,#d4af37)">${this.current.title}</div>
              <div style="color:#bfb7ac">Nusrat Fateh Ali Khan</div>
            </div>
            <div><button class="btn ghost" onclick="window.PlayerManager.openPlayerPage()">Open Player Page</button></div>
          </div>
          <div style="margin-top:10px">${tagsHTML}</div>
        `;
      }
    },
  };

  // auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => PlayerManager.init());

  // expose to window
  window.PlayerManager = PlayerManager;

})();
