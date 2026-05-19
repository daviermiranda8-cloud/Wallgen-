/**
 * WallGen AI — app.js
 * All event listeners registered via addEventListener.
 * Images use picsum.photos (CORS-friendly, no auth required).
 */

'use strict';

/* ── IMAGE DATA ────────────────────────────────────────────────────────────── */

// Curated picsum seeds that produce beautiful, varied images.
// Using fastly.picsum.photos which is more reliable on production.
const SEEDS = [
  10, 15, 20, 24, 26, 29, 33, 37, 40, 42,
  48, 50, 55, 57, 60, 64, 66, 70, 73, 75,
  80, 82, 87, 90, 93, 96, 100, 104, 107, 110,
  112, 115, 119, 122, 126, 130, 133, 136, 139, 142,
  145, 148, 150, 153, 156, 160, 163, 166, 170, 174
];

// Natural aspect ratios to create masonry variety
const ASPECT_RATIOS = [
  { w: 600, h: 900 },   // 2:3 portrait
  { w: 600, h: 800 },   // 3:4 portrait
  { w: 600, h: 600 },   // square
  { w: 600, h: 1050 },  // tall portrait
  { w: 600, h: 700 },   // slight portrait
  { w: 600, h: 950 },   // tall
  { w: 600, h: 850 },   // medium portrait
  { w: 600, h: 650 },   // slight portrait
  { w: 600, h: 1000 },  // very tall
  { w: 600, h: 750 }    // medium
];

const CATEGORIES_LIST = ['anime', 'gaming', 'cars', 'gym', 'football', 'dark', 'nature', 'space', 'cyberpunk', 'minimalist'];

const CATEGORY_LABELS = {
  anime:      'Anime',
  gaming:     'Gaming',
  cars:       'Cars',
  gym:        'Gym',
  football:   'Football',
  dark:       'Dark Aesthetic',
  nature:     'Nature',
  space:      'Space',
  cyberpunk:  'Cyberpunk',
  minimalist: 'Minimalist'
};

const CATEGORY_TAGS = {
  anime:      '#anime',
  gaming:     '#gaming',
  cars:       '#cars',
  gym:        '#grind',
  football:   '#football',
  dark:       '#dark',
  nature:     '#nature',
  space:      '#space',
  cyberpunk:  '#cyberpunk',
  minimalist: '#minimal'
};

// Seeds associated with each category for consistent cat card images
const CAT_SEEDS = {
  anime: 33, gaming: 64, cars: 87, gym: 42,
  football: 110, dark: 150, nature: 20, space: 57,
  cyberpunk: 96, minimalist: 130
};

/**
 * Build image URL using picsum.photos
 * Using /id/{seed}/{w}/{h} format for consistency
 */
function imgUrl(seed, w, h) {
  return `https://fastly.picsum.photos/id/${seed}/${w}/${h}?hmac=placeholder`;
  // Fallback format (no hmac needed for picsum, just cleaner):
}

/**
 * More reliable picsum URL format
 */
function picsumUrl(seed, w, h) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/**
 * Generate wallpaper data objects
 */
function makeWalls(count, offset) {
  offset = offset || 0;
  var walls = [];
  for (var i = 0; i < count; i++) {
    var idx = (i + offset) % SEEDS.length;
    var seed = SEEDS[idx];
    var ratio = ASPECT_RATIOS[i % ASPECT_RATIOS.length];
    var cat = CATEGORIES_LIST[i % CATEGORIES_LIST.length];
    walls.push({
      src: picsumUrl(seed, ratio.w, ratio.h),
      fallback: 'https://picsum.photos/seed/' + seed + '/' + ratio.w + '/' + ratio.h,
      tag: CATEGORY_TAGS[cat],
      cat: cat,
      res: (ratio.h > 700) ? '1080×1920' : '2560×1440',
      seed: seed,
      id: 'wall-' + seed + '-' + i
    });
  }
  return walls;
}

/* ── STATE ─────────────────────────────────────────────────────────────────── */
var state = {
  size: 'desktop',
  generating: false,
  genImgSrc: '',
  galleryFilter: 'all',
  trendFilter: 'all',
  favorites: new Set(),
  loadOffset: 25,
  toastTimer: null,
  genInterval: null,
  genProgressInterval: null,
  genProgress: 0
};

var trendingWalls = makeWalls(12, 0);
var recentWalls   = makeWalls(10, 12);
var galleryWalls  = makeWalls(20, 5);

/* ── DOM REFS ──────────────────────────────────────────────────────────────── */
var dom = {};

function initDom() {
  dom.generateBtn     = document.getElementById('generateBtn');
  dom.promptInput     = document.getElementById('promptInput');
  dom.sizeDesktop     = document.getElementById('sizeDesktop');
  dom.sizePhone       = document.getElementById('sizePhone');
  dom.styleChips      = document.getElementById('styleChips');
  dom.searchInput     = document.getElementById('searchInput');
  dom.generatingBox   = document.getElementById('generatingBox');
  dom.genStatus       = document.getElementById('genStatus');
  dom.genProgressBar  = document.getElementById('genProgressBar');
  dom.genResult       = document.getElementById('genResult');
  dom.genImg          = document.getElementById('genImg');
  dom.downloadGenBtn  = document.getElementById('downloadGenBtn');
  dom.saveFavBtn      = document.getElementById('saveFavBtn');
  dom.regenBtn        = document.getElementById('regenBtn');
  dom.trendingGrid    = document.getElementById('trendingGrid');
  dom.catGrid         = document.getElementById('catGrid');
  dom.recentGrid      = document.getElementById('recentGrid');
  dom.galleryGrid     = document.getElementById('galleryGrid');
  dom.trendFilter     = document.getElementById('trendFilter');
  dom.galleryFilter   = document.getElementById('galleryFilter');
  dom.loadMoreBtn     = document.getElementById('loadMoreBtn');
  dom.toast           = document.getElementById('toast');
  dom.toastMsg        = document.getElementById('toastMsg');
}

/* ── RENDER ────────────────────────────────────────────────────────────────── */

function buildWallCard(wall) {
  var card = document.createElement('div');
  card.className = 'wall-card';
  card.dataset.wallId = wall.id;
  card.dataset.cat = wall.cat;

  var img = document.createElement('img');
  img.alt = wall.tag + ' wallpaper';
  img.loading = 'lazy';
  img.decoding = 'async';
  // Set src last for lazy loading
  img.src = wall.src;
  img.onerror = function() {
    // Fallback to picsum if primary fails
    if (this.src !== wall.fallback) {
      this.src = wall.fallback;
    }
  };

  var overlay = document.createElement('div');
  overlay.className = 'wall-overlay';

  var actions = document.createElement('div');
  actions.className = 'wall-actions';

  // Like button
  var likeBtn = document.createElement('button');
  likeBtn.className = 'wall-action-btn like-btn';
  likeBtn.setAttribute('aria-label', 'Like wallpaper');
  likeBtn.dataset.wallId = wall.id;
  likeBtn.dataset.src = wall.src;
  likeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>';

  // Download button
  var dlBtn = document.createElement('button');
  dlBtn.className = 'wall-action-btn dl-btn';
  dlBtn.setAttribute('aria-label', 'Download wallpaper');
  dlBtn.dataset.src = wall.src;
  dlBtn.dataset.tag = wall.tag;
  dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  // Share button
  var shareBtn = document.createElement('button');
  shareBtn.className = 'wall-action-btn share-btn';
  shareBtn.setAttribute('aria-label', 'Share wallpaper');
  shareBtn.dataset.src = wall.src;
  shareBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

  actions.appendChild(likeBtn);
  actions.appendChild(dlBtn);
  actions.appendChild(shareBtn);

  var tagEl = document.createElement('span');
  tagEl.className = 'wall-tag';
  tagEl.textContent = wall.tag;

  var resEl = document.createElement('div');
  resEl.className = 'wall-res';
  resEl.textContent = '↑ ' + wall.res + ' · HD';

  overlay.appendChild(actions);
  overlay.appendChild(tagEl);
  overlay.appendChild(resEl);

  card.appendChild(img);
  card.appendChild(overlay);
  return card;
}

function renderGrid(container, walls) {
  if (!container) return;
  container.innerHTML = '';
  var fragment = document.createDocumentFragment();
  walls.forEach(function(wall) {
    fragment.appendChild(buildWallCard(wall));
  });
  container.appendChild(fragment);
  bindCardEvents(container);
}

function renderCats() {
  if (!dom.catGrid) return;
  var cats = Object.keys(CAT_SEEDS);
  dom.catGrid.innerHTML = '';
  var fragment = document.createDocumentFragment();
  cats.forEach(function(cat) {
    var seed = CAT_SEEDS[cat];
    var card = document.createElement('div');
    card.className = 'cat-card';
    card.dataset.cat = cat;

    var img = document.createElement('img');
    img.src = picsumUrl(seed, 400, 400);
    img.alt = CATEGORY_LABELS[cat] + ' wallpapers';
    img.loading = 'lazy';
    img.onerror = function() {
      this.style.background = 'var(--surface2)';
      this.style.display = 'none';
    };

    var label = document.createElement('div');
    label.className = 'cat-label';
    label.textContent = CATEGORY_LABELS[cat];

    card.appendChild(img);
    card.appendChild(label);
    fragment.appendChild(card);
  });
  dom.catGrid.appendChild(fragment);

  // Bind cat card clicks
  dom.catGrid.addEventListener('click', function(e) {
    var card = e.target.closest('.cat-card');
    if (!card) return;
    var cat = card.dataset.cat;
    if (dom.searchInput) {
      dom.searchInput.value = CATEGORY_LABELS[cat];
    }
    filterGallery(cat);
    // Scroll to gallery
    var gallerySection = document.getElementById('gallery');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showToast('Browsing ' + CATEGORY_LABELS[cat] + ' wallpapers');
  });
}

/* ── CARD EVENT DELEGATION ─────────────────────────────────────────────────── */
function bindCardEvents(container) {
  container.addEventListener('click', function(e) {
    var likeBtn = e.target.closest('.like-btn');
    var dlBtn   = e.target.closest('.dl-btn');
    var shareBtn = e.target.closest('.share-btn');

    if (likeBtn) {
      e.stopPropagation();
      toggleLike(likeBtn);
      return;
    }
    if (dlBtn) {
      e.stopPropagation();
      downloadWall(dlBtn.dataset.src, dlBtn.dataset.tag);
      return;
    }
    if (shareBtn) {
      e.stopPropagation();
      shareWall(shareBtn.dataset.src);
      return;
    }
  });
}

/* ── LIKE / DOWNLOAD / SHARE ─────────────────────────────────────────────── */
function toggleLike(btn) {
  var id = btn.dataset.wallId;
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    btn.classList.remove('liked');
    showToast('Removed from favorites');
  } else {
    state.favorites.add(id);
    btn.classList.add('liked');
    showToast('Saved to favorites ♥');
  }
}

function downloadWall(src, tag) {
  if (!src) return;
  var link = document.createElement('a');
  link.href = src;
  link.download = 'wallgen-' + (tag || 'wallpaper').replace('#', '') + '.jpg';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Downloading HD wallpaper…');
}

function shareWall(src) {
  if (!src) return;
  if (navigator.share) {
    navigator.share({ title: 'WallGen AI Wallpaper', url: src }).catch(function() {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(src).then(function() {
      showToast('Link copied to clipboard!');
    }).catch(function() {
      showToast('Copy the URL from your address bar');
    });
  } else {
    showToast('Share: ' + src.slice(0, 40) + '…');
  }
}

/* ── FILTERS ────────────────────────────────────────────────────────────────── */
function setActiveChip(group, activeBtn) {
  if (!group) return;
  var chips = group.querySelectorAll('.chip');
  chips.forEach(function(c) { c.classList.remove('active'); });
  activeBtn.classList.add('active');
}

function filterTrending(filter) {
  var filtered;
  if (filter === 'all') {
    filtered = trendingWalls;
  } else {
    filtered = trendingWalls.filter(function(w) {
      return w.cat === filter || w.tag.indexOf(filter) !== -1;
    });
    if (!filtered.length) filtered = trendingWalls.slice(0, 6);
  }
  renderGrid(dom.trendingGrid, filtered);
}

function filterGallery(filter) {
  state.galleryFilter = filter;
  var filtered;
  if (filter === 'all') {
    filtered = galleryWalls;
  } else {
    filtered = galleryWalls.filter(function(w) { return w.cat === filter; });
    if (!filtered.length) filtered = galleryWalls;
  }
  renderGrid(dom.galleryGrid, filtered);
}

/* ── SEARCH ────────────────────────────────────────────────────────────────── */
var searchDebounce = null;

function handleSearch(val) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(function() {
    var lower = val.toLowerCase().trim();
    if (!lower) {
      renderGrid(dom.galleryGrid, galleryWalls);
      return;
    }
    var filtered = galleryWalls.filter(function(w) {
      return w.cat.indexOf(lower) !== -1 ||
             w.tag.indexOf(lower) !== -1 ||
             CATEGORY_LABELS[w.cat].toLowerCase().indexOf(lower) !== -1;
    });
    renderGrid(dom.galleryGrid, filtered.length ? filtered : galleryWalls);
  }, 300);
}

/* ── GENERATE ───────────────────────────────────────────────────────────────── */
var GEN_STATUSES = [
  'Initializing AI model…',
  'Parsing your prompt…',
  'Generating composition…',
  'Applying style transfer…',
  'Rendering details…',
  'Upscaling to 4K…',
  'Adding finishing touches…',
  'Almost done…'
];

// Large pool of seeds for generation variety
var GEN_SEEDS = [
  200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
  210, 211, 212, 213, 214, 215, 216, 217, 218, 219,
  220, 221, 222, 223, 224, 225, 226, 227, 228, 229,
  230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
  240, 241, 242, 243, 244, 245, 246, 247, 248, 249,
  250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
  260, 261, 262, 263, 264, 265, 266, 267, 268, 269,
  270, 271, 272, 273, 274, 275, 276, 277, 278, 279,
  280, 281, 282, 283, 284, 285, 286, 287, 288, 289,
  290, 291, 292, 293, 294, 295, 296, 297, 298, 299
];

var genSeedIndex = Math.floor(Math.random() * GEN_SEEDS.length);

function getNextGenSeed() {
  var seed = GEN_SEEDS[genSeedIndex % GEN_SEEDS.length];
  genSeedIndex++;
  return seed;
}

function generateWallpaper() {
  if (state.generating) return;
  state.generating = true;

  // Hide previous result
  dom.genResult.classList.add('hidden');
  dom.generatingBox.classList.remove('hidden');
  dom.generateBtn.disabled = true;
  dom.generatingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Reset progress
  state.genProgress = 0;
  dom.genProgressBar.style.width = '0%';

  // Status cycle
  var statusIdx = 0;
  dom.genStatus.textContent = GEN_STATUSES[0];

  clearInterval(state.genInterval);
  state.genInterval = setInterval(function() {
    statusIdx = (statusIdx + 1) % GEN_STATUSES.length;
    dom.genStatus.textContent = GEN_STATUSES[statusIdx];
  }, 600);

  // Progress bar
  clearInterval(state.genProgressInterval);
  state.genProgressInterval = setInterval(function() {
    if (state.genProgress < 90) {
      state.genProgress += (90 - state.genProgress) * 0.08;
      dom.genProgressBar.style.width = state.genProgress.toFixed(1) + '%';
    }
  }, 100);

  // Pick a random seed and size
  var seed = getNextGenSeed();
  var isPhone = (state.size === 'phone');
  var w = isPhone ? 600 : 1200;
  var h = isPhone ? 1067 : 675;
  var imgSrc = picsumUrl(seed, w, h);

  // Preload the image
  var preload = new Image();
  preload.onload = function() {
    finishGeneration(imgSrc);
  };
  preload.onerror = function() {
    // Try alternate seed
    var altSeed = getNextGenSeed();
    var altSrc = picsumUrl(altSeed, w, h);
    dom.genImg.src = altSrc;
    finishGeneration(altSrc);
  };

  // Give at least 4 seconds of "generation" for UX
  setTimeout(function() {
    preload.src = imgSrc;
  }, 4000);
}

function finishGeneration(imgSrc) {
  clearInterval(state.genInterval);
  clearInterval(state.genProgressInterval);

  // Complete progress bar
  dom.genProgressBar.style.width = '100%';

  setTimeout(function() {
    dom.generatingBox.classList.add('hidden');
    dom.genImg.src = imgSrc;
    state.genImgSrc = imgSrc;
    dom.genResult.classList.remove('hidden');
    dom.genResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    dom.generateBtn.disabled = false;
    state.generating = false;
    showToast('✦ Wallpaper generated!');
  }, 400);
}

/* ── SIZE TOGGLE ─────────────────────────────────────────────────────────── */
function setSize(size) {
  state.size = size;
  if (size === 'desktop') {
    dom.sizeDesktop.classList.add('active');
    dom.sizePhone.classList.remove('active');
  } else {
    dom.sizePhone.classList.add('active');
    dom.sizeDesktop.classList.remove('active');
  }
}

/* ── LOAD MORE ─────────────────────────────────────────────────────────────── */
function loadMore() {
  var extra = makeWalls(10, state.loadOffset);
  state.loadOffset += 10;
  var fragment = document.createDocumentFragment();
  extra.forEach(function(wall) {
    fragment.appendChild(buildWallCard(wall));
  });
  // Need to bind events to the new nodes
  var tempDiv = document.createElement('div');
  extra.forEach(function(wall) {
    tempDiv.appendChild(buildWallCard(wall));
  });
  bindCardEvents(tempDiv);
  while (tempDiv.firstChild) {
    dom.galleryGrid.appendChild(tempDiv.firstChild);
  }
  showToast('More wallpapers loaded');
}

/* ── TOAST ──────────────────────────────────────────────────────────────────── */
function showToast(msg) {
  dom.toastMsg.textContent = msg;
  dom.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(function() {
    dom.toast.classList.remove('show');
  }, 2800);
}

/* ── INIT ───────────────────────────────────────────────────────────────────── */
function init() {
  initDom();

  // Render all grids
  renderGrid(dom.trendingGrid, trendingWalls);
  renderGrid(dom.recentGrid,   recentWalls);
  renderGrid(dom.galleryGrid,  galleryWalls);
  renderCats();

  // Generate button
  dom.generateBtn.addEventListener('click', function() {
    generateWallpaper();
  });

  // Also allow Enter in textarea with Ctrl/Cmd
  dom.promptInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      generateWallpaper();
    }
  });

  // Size toggle
  dom.sizeDesktop.addEventListener('click', function() { setSize('desktop'); });
  dom.sizePhone.addEventListener('click',   function() { setSize('phone'); });

  // Style chips
  dom.styleChips.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (chip) chip.classList.toggle('active');
  });

  // Search
  dom.searchInput.addEventListener('input', function() {
    handleSearch(this.value);
  });

  // Trend filter
  dom.trendFilter.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    setActiveChip(dom.trendFilter, chip);
    filterTrending(chip.dataset.filter);
  });

  // Gallery filter
  dom.galleryFilter.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    setActiveChip(dom.galleryFilter, chip);
    filterGallery(chip.dataset.filter);
  });

  // Gen result actions
  dom.downloadGenBtn.addEventListener('click', function() {
    if (state.genImgSrc) {
      downloadWall(state.genImgSrc, 'wallgen-ai');
    }
  });

  dom.saveFavBtn.addEventListener('click', function() {
    showToast('Saved to your collection ♥');
  });

  dom.regenBtn.addEventListener('click', function() {
    generateWallpaper();
  });

  // Load more
  dom.loadMoreBtn.addEventListener('click', function() {
    loadMore();
  });

  // Nav buttons (cosmetic)
  var signinBtn = document.getElementById('signinBtn');
  var proBtn    = document.getElementById('proBtn');
  if (signinBtn) signinBtn.addEventListener('click', function() { showToast('Sign in coming soon!'); });
  if (proBtn)    proBtn.addEventListener('click',    function() { showToast('Pro plan coming soon! 🚀'); });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
