// ============================================================
//  Velo-City SPA — Client-Side Application
// ============================================================

const app = document.getElementById('app');
let currentUser = null;

// --- ROUTER ---
function navigate(page, data) {
  window.scrollTo(0, 0);
  switch (page) {
    case 'home':    renderHome(); break;
    case 'explore': renderExplore(); break;
    case 'login':   renderLogin(); break;
    case 'signup':  renderSignup(); break;
    case 'bike':    renderBikeDetail(data); break;
    default:        renderHome();
  }
}

// Check if user is logged in
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      updateNavAuth();
    }
  } catch {}
}

function updateNavAuth() {
  const el = document.getElementById('nav-auth');
  if (currentUser) {
    el.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">Hi, <span class="font-bold text-gray-900">${currentUser.name}</span></span>
        <button onclick="logout()" class="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Logout</button>
      </div>`;
  } else {
    el.innerHTML = `<button onclick="navigate('login')" class="text-sm font-semibold bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">Sign In</button>`;
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateNavAuth();
  navigate('home');
}

// ============================================================
//  PAGE: HOME
// ============================================================
function renderHome() {
  app.innerHTML = `
    <div class="fade-in">
      <!-- Hero -->
      <section class="relative bg-linear-gradient-to-br from-brand-50 via-white to-blue-50 overflow-hidden">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzMzk0ZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div class="max-w-7xl mx-auto px-6 py-28 md:py-40 relative">
          <div class="max-w-2xl">
            <div class="inline-block text-xs font-bold text-brand-600 bg-brand-100 px-3 py-1 rounded-full mb-6 uppercase tracking-widest">New: Electric Fleet 2026</div>
            <h1 class="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Ride the Future<br>of Urban<br><span class="text-brand-600">Mobility</span>
            </h1>
            <p class="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg">
              Premium bikes delivered to your door. Road, Mountain, E-Bikes — rent by the day in New York, London, LA, and Denver.
            </p>
            <div class="flex gap-4">
              <button onclick="navigate('explore')" class="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-900/20">
                Explore Bikes →
              </button>
              <button onclick="navigate('signup')" class="bg-white text-gray-700 px-8 py-3.5 rounded-xl font-bold text-sm border border-gray-200 hover:border-gray-300 transition-colors">
                Create Account
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><div class="text-3xl font-black text-gray-900">12K+</div><div class="text-sm text-gray-400 mt-1">Active Riders</div></div>
          <div><div class="text-3xl font-black text-gray-900">4</div><div class="text-sm text-gray-400 mt-1">Cities</div></div>
          <div><div class="text-3xl font-black text-gray-900">50+</div><div class="text-sm text-gray-400 mt-1">Bike Models</div></div>
          <div><div class="text-3xl font-black text-gray-900">4.9★</div><div class="text-sm text-gray-400 mt-1">Avg Rating</div></div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="max-w-7xl mx-auto px-6 py-24">
        <h2 class="text-3xl font-black text-center mb-16">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-12">
          <div class="text-center">
            <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-5"><span class="text-2xl font-black text-brand-600">1</span></div>
            <h3 class="font-bold text-lg mb-2">Browse & Filter</h3>
            <p class="text-gray-400 text-sm">Choose your ride by type, city, and price. All bikes are inspected and premium.</p>
          </div>
          <div class="text-center">
            <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-5"><span class="text-2xl font-black text-brand-600">2</span></div>
            <h3 class="font-bold text-lg mb-2">Book Instantly</h3>
            <p class="text-gray-400 text-sm">Reserve with one click. We deliver to your location within 2 hours.</p>
          </div>
          <div class="text-center">
            <div class="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-5"><span class="text-2xl font-black text-brand-600">3</span></div>
            <h3 class="font-bold text-lg mb-2">Ride & Return</h3>
            <p class="text-gray-400 text-sm">Enjoy your ride. Drop off at any VeloCity hub when you're done.</p>
          </div>
        </div>
      </section>
    </div>`;

  if (currentUser) {
    const homeButtons = Array.from(app.querySelectorAll('button'));
    const signupButton = homeButtons.find((button) => button.textContent.trim() === 'Create Account');
    signupButton?.remove();
  }
}

// ============================================================
//  PAGE: EXPLORE / CATALOG
// ============================================================
async function renderExplore(filters = {}) {
  app.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 py-12 fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 class="text-3xl font-black">Explore Bikes</h1>
          <p class="text-gray-400 text-sm mt-1">Find your perfect ride</p>
        </div>
        <!-- Search -->
        <div class="w-full md:w-80">
          <div class="relative">
            <input type="text" id="search-input" placeholder="Search bikes..." class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" onkeydown="if(event.key==='Enter') searchBikes()">
            <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 mb-8" id="filter-bar">
        <button onclick="applyFilter('city', '')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white" data-active="true">All Cities</button>
        <button onclick="applyFilter('city', 'New York')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">New York</button>
        <button onclick="applyFilter('city', 'London')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">London</button>
        <button onclick="applyFilter('city', 'Los Angeles')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">Los Angeles</button>
        <button onclick="applyFilter('city', 'Denver')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">Denver</button>
        <span class="w-px bg-gray-200 mx-1"></span>
        <button onclick="applyFilter('type', '')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">All Types</button>
        <button onclick="applyFilter('type', 'Electric')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">⚡ Electric</button>
        <button onclick="applyFilter('type', 'Road')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">🏎️ Road</button>
        <button onclick="applyFilter('type', 'Mountain')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">🏔️ Mountain</button>
        <button onclick="applyFilter('type', 'City')" class="filter-btn px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:border-gray-400 transition-colors bg-white">🏙️ City</button>
      </div>

      <!-- Search Results Banner (for reflected XSS demo) -->
      <div id="search-banner" class="hidden mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100"></div>

      <!-- Bike Grid -->
      <div id="bike-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="skeleton h-80 rounded-2xl"></div>
        <div class="skeleton h-80 rounded-2xl"></div>
        <div class="skeleton h-80 rounded-2xl"></div>
      </div>
    </div>`;

  loadBikes(filters);
}

// State for filters
let activeFilters = { city: '', type: '' };

function applyFilter(key, value) {
  activeFilters[key] = value;
  loadBikes(activeFilters);
}

async function loadBikes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.type) params.set('type', filters.type);

  try {
    const res = await fetch('/api/bikes?' + params.toString());
    const data = await res.json();
    
    const grid = document.getElementById('bike-grid');
    if (!grid) return;

    if (!data.success || data.data.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400"><p class="text-lg font-semibold">No bikes found</p><p class="text-sm mt-1">Try adjusting your filters</p></div>`;
      return;
    }

    grid.innerHTML = data.data.map(bike => `
      <div onclick="navigate('bike', ${bike.id})" class="group cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1">
        <div class="h-48 bg-linear-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative overflow-hidden">
          <span class="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">${bike.type === 'Electric' ? '⚡' : bike.type === 'Mountain' ? '🏔️' : bike.type === 'Road' ? '🏎️' : '🚲'}</span>
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600">${bike.city}</div>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="font-bold text-base group-hover:text-brand-600 transition-colors">${bike.model}</h3>
              <p class="text-xs text-gray-400">${bike.brand} · ${bike.type}</p>
            </div>
            <div class="text-right">
              <div class="text-lg font-black text-brand-600">$${bike.price_per_day}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-wider">/ day</div>
            </div>
          </div>
          <p class="text-sm text-gray-400 leading-relaxed line-clamp-2 mt-3">${bike.description}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    const grid = document.getElementById('bike-grid');
    if (grid) grid.innerHTML = `<div class="col-span-full text-center py-20 text-red-500">Failed to load catalog</div>`;
  }
}

async function searchBikes() {
  const q = document.getElementById('search-input').value;
  if (!q.trim()) return;

  try {
    const res = await fetch('/api/bikes/search?q=' + encodeURIComponent(q));
    const data = await res.json();

    const banner = document.getElementById('search-banner');
    if (banner) {
      banner.classList.remove('hidden');
      // VULNERABILITY: Reflected XSS — rendering query directly in innerHTML
      banner.innerHTML = `<p class="text-sm text-gray-600">Showing results for: <strong>${data.query}</strong> (${data.count} found)</p>`;
    }

    const grid = document.getElementById('bike-grid');
    if (!grid) return;

    if (data.data.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400"><p class="text-lg font-semibold">No results for "${data.query}"</p></div>`;
      return;
    }

    grid.innerHTML = data.data.map(bike => `
      <div onclick="navigate('bike', ${bike.id})" class="group cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div class="h-48 bg-linear-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          <span class="text-6xl opacity-30">${bike.type === 'Electric' ? '⚡' : bike.type === 'Mountain' ? '🏔️' : bike.type === 'Road' ? '🏎️' : '🚲'}</span>
        </div>
        <div class="p-5">
          <h3 class="font-bold">${bike.model}</h3>
          <p class="text-xs text-gray-400">${bike.brand} · $${bike.price_per_day}/day</p>
        </div>
      </div>
    `).join('');
  } catch {}
}

// ============================================================
//  PAGE: BIKE DETAIL
// ============================================================
async function renderBikeDetail(bikeId) {
  app.innerHTML = `<div class="max-w-4xl mx-auto px-6 py-12"><div class="skeleton h-96 rounded-2xl"></div></div>`;

  try {
    const [bikeRes, reviewRes] = await Promise.all([
      fetch(`/api/bikes/${bikeId}`),
      fetch(`/api/reviews/${bikeId}`)
    ]);
    const bikeData = await bikeRes.json();
    const reviewData = await reviewRes.json();
    const bike = bikeData.data;
    const reviews = reviewData.data || [];

    app.innerHTML = `
      <div class="max-w-4xl mx-auto px-6 py-12 fade-in">
        <!-- Back -->
        <button onclick="navigate('explore')" class="text-sm text-gray-400 hover:text-gray-900 mb-8 inline-flex items-center gap-1 transition-colors">← Back to catalog</button>

        <!-- Hero Card -->
        <div class="bg-linear-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl overflow-hidden mb-10">
          <div class="h-64 bg-linear-gradient-to-br from-brand-50 to-blue-50 flex items-center justify-center">
            <span class="text-8xl opacity-20">${bike.type === 'Electric' ? '⚡' : bike.type === 'Mountain' ? '🏔️' : bike.type === 'Road' ? '🏎️' : '🚲'}</span>
          </div>
          <div class="p-8">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h1 class="text-3xl font-black">${bike.model}</h1>
                <p class="text-gray-400 mt-1">${bike.brand} · ${bike.type} · ${bike.city}</p>
              </div>
              <div class="text-right">
                <div class="text-3xl font-black text-brand-600">$${bike.price_per_day}</div>
                <div class="text-xs text-gray-400 uppercase">per day</div>
              </div>
            </div>
            <p class="text-gray-500 leading-relaxed mb-6">${bike.description}</p>
            <div class="flex gap-3">
              <button onclick="checkAvailability(${bike.id})" class="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors">
                Check Availability
              </button>
              <button onclick="burstAvailability(${bike.id})" class="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors" title="Rapid check for multiple dates">
                Multi-Date Check
              </button>
            </div>
            <div id="availability-result" class="mt-4"></div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="mb-10">
          <h2 class="text-xl font-black mb-6">Community Reviews</h2>
          <div id="reviews-list" class="space-y-4 mb-8">
            ${reviews.length === 0 ? '<p class="text-gray-400 text-sm">No reviews yet. Be the first!</p>' :
              reviews.map(r => `
                <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-sm">${r.user_name}</span>
                    <span class="text-yellow-500 text-sm">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p class="text-sm text-gray-600">${r.content}</p>
                </div>
              `).join('')
            }
          </div>

          <!-- Add Review Form -->
          <div class="bg-white border border-gray-200 rounded-xl p-6">
            <h3 class="font-bold mb-4">Leave a Review</h3>
            <div class="space-y-4">
              <input type="text" id="review-name" placeholder="Your name" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <textarea id="review-content" rows="3" placeholder="Share your experience..." class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"></textarea>
              <div class="flex justify-between items-center">
                <select id="review-rating" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="5">★★★★★</option>
                  <option value="4">★★★★☆</option>
                  <option value="3">★★★☆☆</option>
                  <option value="2">★★☆☆☆</option>
                  <option value="1">★☆☆☆☆</option>
                </select>
                <button onclick="submitReview(${bike.id})" class="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors">Submit</button>
              </div>
            </div>
            <div id="review-status" class="mt-3"></div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    app.innerHTML = `<div class="text-center py-20 text-red-500">Failed to load bike details</div>`;
  }
}

async function checkAvailability(bikeId) {
  const el = document.getElementById('availability-result');
  el.innerHTML = `<p class="text-sm text-gray-400 animate-pulse">Checking live inventory...</p>`;
  try {
    const res = await fetch(`/api/bikes/${bikeId}/availability`);
    const data = await res.json();
    el.innerHTML = data.available
      ? `<div class="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl">✓ Available now in ${data.city}. Ready for pickup.</div>`
      : `<div class="bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold px-4 py-3 rounded-xl">Next available: ${data.next_available}</div>`;
  } catch {
    el.innerHTML = `<div class="text-sm text-red-500">Check failed. Try again.</div>`;
  }
}

// RATE ABUSE VECTOR: Fires rapid availability checks
async function burstAvailability(bikeId) {
  const el = document.getElementById('availability-result');
  el.innerHTML = `<p class="text-sm text-brand-500 animate-pulse">Scanning 30 dates for optimal pricing...</p>`;
  let count = 0;
  const iv = setInterval(async () => {
    count++;
    await fetch(`/api/bikes/${bikeId}/availability`);
    if (count >= 30) {
      clearInterval(iv);
      el.innerHTML = `<div class="bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold px-4 py-3 rounded-xl">30-day scan complete. Best rate: Available now.</div>`;
    }
  }, 100);
}

// STORED XSS VECTOR: Review content is stored and rendered as HTML
async function submitReview(bikeId) {
  const name = document.getElementById('review-name').value;
  const content = document.getElementById('review-content').value;
  const rating = document.getElementById('review-rating').value;
  const status = document.getElementById('review-status');

  if (!name || !content) {
    status.innerHTML = `<p class="text-sm text-red-500">Please fill in all fields.</p>`;
    return;
  }

  try {
    const res = await fetch(`/api/reviews/${bikeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: name, content, rating })
    });
    const data = await res.json();
    if (data.success) {
      status.innerHTML = `<p class="text-sm text-green-600 font-semibold">Review submitted!</p>`;
      setTimeout(() => renderBikeDetail(bikeId), 800);
    } else {
      status.innerHTML = `<p class="text-sm text-red-500">${data.message}</p>`;
    }
  } catch {
    status.innerHTML = `<p class="text-sm text-red-500">Submission failed.</p>`;
  }
}

// ============================================================
//  PAGE: LOGIN
// ============================================================
function renderLogin() {
  app.innerHTML = `
    <div class="min-h-[80vh] flex items-center justify-center fade-in">
      <div class="w-full max-w-md mx-auto px-6">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-black">Welcome Back</h1>
          <p class="text-gray-400 mt-2 text-sm">Sign in to your VeloCity account</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" id="login-email" value="admin@velocity.com" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="you@example.com">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" id="login-password" value="" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="••••••••" onkeydown="if(event.key==='Enter') doLogin()">
            </div>
            <button onclick="doLogin()" id="login-btn" class="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]">
              Sign In
            </button>
          </div>
          <div id="login-status" class="mt-4"></div>
          <p class="text-center text-sm text-gray-400 mt-6">
            Don't have an account? <a onclick="navigate('signup')" class="text-brand-600 font-semibold cursor-pointer hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>`;
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const status = document.getElementById('login-status');

  status.innerHTML = `<p class="text-sm text-gray-400 animate-pulse">Authenticating...</p>`;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      updateNavAuth();
      status.innerHTML = `<p class="text-sm text-green-600 font-semibold">✓ ${data.message}</p>`;
      setTimeout(() => navigate('home'), 600);
    } else {
      status.innerHTML = `<p class="text-sm text-red-500 font-semibold">${data.message}</p>`;
    }
  } catch {
    status.innerHTML = `<p class="text-sm text-red-500">Network error. Please try again.</p>`;
  }
}

// ============================================================
//  PAGE: SIGNUP
// ============================================================
function renderSignup() {
  app.innerHTML = `
    <div class="min-h-[80vh] flex items-center justify-center fade-in">
      <div class="w-full max-w-md mx-auto px-6">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-black">Create Account</h1>
          <p class="text-gray-400 mt-2 text-sm">Join 12,000+ riders on VeloCity</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" id="signup-name" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Alex Rider">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" id="signup-email" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@example.com">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" id="signup-password" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="••••••••">
            </div>
            <button onclick="doSignup()" class="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]">
              Create Account
            </button>
          </div>
          <div id="signup-status" class="mt-4"></div>
          <p class="text-center text-sm text-gray-400 mt-6">
            Already have an account? <a onclick="navigate('login')" class="text-brand-600 font-semibold cursor-pointer hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>`;
}

async function doSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const status = document.getElementById('signup-status');

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      updateNavAuth();
      status.innerHTML = `<p class="text-sm text-green-600 font-semibold">✓ ${data.message}</p>`;
      setTimeout(() => navigate('home'), 600);
    } else {
      status.innerHTML = `<p class="text-sm text-red-500">${data.message}</p>`;
    }
  } catch {
    status.innerHTML = `<p class="text-sm text-red-500">Signup failed.</p>`;
  }
}

// ============================================================
//  INIT
// ============================================================
async function initApp() {
  await checkAuth();
  navigate('home');
}

initApp();
