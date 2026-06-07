import { http, HttpResponse } from 'msw'

// ── Générateur de JWT de test ──────────────────────────────────────────────
const makeJwt = (userId = 1, expiresInSeconds = 3600) => {
  const payload = btoa(
    JSON.stringify({
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  )
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.fake_signature`
}

export const TEST_TOKENS = {
  access: makeJwt(),
  refresh: makeJwt(1, 86400),
}

// ── Données mock partagées ─────────────────────────────────────────────────
// Familles et genres alignés sur les constantes de products.jsx
export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Élyse Rose',
    price: '45000.00',
    category: 'Floral',
    family: 'Floral',
    gender: 'Femme',
    size: 50,
    image: null,
    badge: null,
    advice: 'Pour les soirées',
    composition: 'Alcool, Parfum',
    notes_top: 'Rose, Bergamote',
    notes_heart: 'Jasmin',
    notes_base: 'Musc',
  },
  {
    id: 2,
    name: 'Élyse Oud',
    price: '65000.00',
    category: 'Oriental',
    family: 'Oriental',
    gender: 'Mixte',
    size: 100,
    image: null,
    badge: 'Nouveau',
    advice: 'Pour toutes occasions',
    composition: 'Alcool, Parfum',
    notes_top: 'Oud, Épices',
    notes_heart: 'Ambre',
    notes_base: 'Santal',
  },
]

export const MOCK_CART_ITEMS = [
  {
    id: 1,
    product: 1,
    product_name: 'Élyse Rose',
    quantity: 2,
    price: '45000.00',
    total: '90000.00',
  },
]

export const MOCK_ORDER = {
  id: 42,
  status: 'pending',
  items: MOCK_CART_ITEMS,
  pricing: {
    id: 10,
    subtotal: '90000.00',
    delivery_price: '3000.00',
    total: '93000.00',
    delivery_option: null,
  },
}

export const MOCK_DELIVERY_OPTIONS = [
  { id: 1, name: 'Standard', price: '3000.00', amount: 3000, is_default: true, delay: '3-5 jours' },
  { id: 2, name: 'Express', price: '6000.00', amount: 6000, is_default: false, delay: '24h' },
]

// ── Handlers MSW ───────────────────────────────────────────────────────────
// IMPORTANT : les handlers les plus spécifiques doivent apparaître EN PREMIER
// (MSW retourne le premier handler qui correspond).
export const handlers = [

  // ═══════════════════════════════════════════════════════
  // users-service  (port 8001)
  // ═══════════════════════════════════════════════════════

  http.post('/api/auth/', async ({ request }) => {
    const body = await request.json()
    if (body.password === 'wrongpassword' || body.email === 'unknown@test.com') {
      return HttpResponse.json(
        { detail: 'Identifiants incorrects. Veuillez réessayer.' },
        { status: 401 }
      )
    }
    return HttpResponse.json({
      access: TEST_TOKENS.access,
      refresh: TEST_TOKENS.refresh,
    })
  }),

  http.post('/api/auth/register/', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { email: ['Un compte avec cet email existe déjà.'] },
        { status: 400 }
      )
    }
    return HttpResponse.json({ id: 99, email: body.email }, { status: 201 })
  }),

  http.post('/api/auth/token/refresh/', async ({ request }) => {
    const body = await request.json()
    if (!body.refresh || body.refresh === 'invalid_refresh_token') {
      return HttpResponse.json({ detail: 'Token invalide ou expiré.' }, { status: 401 })
    }
    return HttpResponse.json({ access: makeJwt() })
  }),

  // ═══════════════════════════════════════════════════════
  // products-service  (port 8002)
  // ═══════════════════════════════════════════════════════

  http.get('/api/products/', ({ request }) => {
    const url = new URL(request.url)
    const search = (url.searchParams.get('search') || '').toLowerCase()
    const category = url.searchParams.get('category') || ''
    const gender = url.searchParams.get('gender') || ''

    let results = MOCK_PRODUCTS
    if (search) results = results.filter(p => p.name.toLowerCase().includes(search))
    if (category) results = results.filter(p => p.category === category)
    if (gender) results = results.filter(p => p.gender === gender)

    return HttpResponse.json({ count: results.length, next: null, previous: null, results })
  }),

  http.get('/api/products/:id/', ({ params }) => {
    const product = MOCK_PRODUCTS.find(p => p.id === Number(params.id))
    if (!product) return HttpResponse.json({ detail: 'Non trouvé.' }, { status: 404 })
    return HttpResponse.json(product)
  }),

  // ═══════════════════════════════════════════════════════
  // review-service  (port 8005)
  // Note: l'endpoint est /api/interation/ (typo conservée du backend)
  // ═══════════════════════════════════════════════════════

  http.post('/api/interation/bulk-summary/', () =>
    HttpResponse.json({})
  ),

  http.get('/api/interation/:id/summary/', () =>
    HttpResponse.json({ product_id: '1', average_rating: 4.2, total_ratings: 8, total_likes: 12, comment_count: 3, liked: false })
  ),

  http.get('/api/interation/:id/comments/', () =>
    HttpResponse.json([
      { id: 1, author: 'Alice', content: 'Magnifique parfum !', created_at: '2025-01-15T10:00:00Z' },
    ])
  ),

  http.post('/api/interation/:id/toggle-like/', () =>
    HttpResponse.json({ liked: true, likes: 13 })
  ),

  http.post('/api/interation/:id/comments/create/', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      { id: 99, author: 'Test User', content: body.content, created_at: new Date().toISOString() },
      { status: 201 }
    )
  }),

  http.post('/api/interation/:id/rating/', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      { rating: body.rating, average_rating: 4.5, rating_count: 9 },
      { status: 201 }
    )
  }),

  // ═══════════════════════════════════════════════════════
  // orders-service  (port 8003)
  // Note: le sessionParam est un query param (?session_id=…), PAS un path segment.
  // MSW ignore les query params pour le matching de chemin → les handlers
  // ci-dessous matchent à la fois les requêtes auth et les requêtes guest.
  // ═══════════════════════════════════════════════════════

  // Compteur panier (somme des quantités)
  http.get('/api/orders/cart/count/', () =>
    HttpResponse.json({ count: MOCK_CART_ITEMS.reduce((sum, i) => sum + i.quantity, 0) })
  ),

  // Routes spécifiques orders_item (AVANT les routes génériques :id)
  http.get('/api/orders/orders_item/cart/items/', () =>
    HttpResponse.json(MOCK_CART_ITEMS)
  ),

  http.post('/api/orders/orders_item/cart/items/', async ({ request }) => {
    const body = await request.json()
    const product = MOCK_PRODUCTS.find(p => p.id === body.product_id)
    return HttpResponse.json(
      { id: 99, product: body.product_id, product_name: product?.name || 'Produit', quantity: 1 },
      { status: 201 }
    )
  }),

  http.patch('/api/orders/orders_item/cart/items/:id/quantity/', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 1, quantity: body.quantity ?? 1 })
  }),

  http.delete('/api/orders/orders_item/cart/items/:id/', () =>
    new HttpResponse(null, { status: 204 })
  ),

  http.get('/api/orders/orders_item/check/:id/', () =>
    HttpResponse.json({ in_cart: false, item_id: null })
  ),

  // Route spécifique delivery-options (AVANT la route générique :id)
  http.get('/api/orders/delivery-options/', () =>
    HttpResponse.json(MOCK_DELIVERY_OPTIONS)
  ),

  // Route spécifique my/ (AVANT la route générique :id)
  http.get('/api/orders/my/', () =>
    HttpResponse.json([MOCK_ORDER])
  ),

  // Route spécifique pour pricing/delivery (PATCH, pas de conflit avec GET :id)
  http.patch('/api/orders/:id/pricing/delivery/', async ({ request }) => {
    const body = await request.json()
    const option = MOCK_DELIVERY_OPTIONS.find(o => o.id === body.delivery_option_id)
    return HttpResponse.json({
      delivery_option: body.delivery_option_id,
      delivery_price: option?.price || '0.00',
      total: '93000.00',
    })
  }),

  // Route générique pour le détail d'une commande (EN DERNIER parmi les GET orders)
  http.get('/api/orders/:id/', ({ params }) => {
    if (String(params.id) === '42') return HttpResponse.json(MOCK_ORDER)
    return HttpResponse.json({ detail: 'Commande introuvable.' }, { status: 404 })
  }),

  http.post('/api/orders/orders_address/', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 1, ...body }, { status: 201 })
  }),

  // ═══════════════════════════════════════════════════════
  // payments-service  (port 8004)
  // ═══════════════════════════════════════════════════════

  http.post('/api/payments/create/', async ({ request }) => {
    const body = await request.json()
    if (body.card_number === '0000000000000000') {
      return HttpResponse.json(
        { detail: 'Paiement refusé. Fonds insuffisants.' },
        { status: 402 }
      )
    }
    return HttpResponse.json(
      { id: 1, status: 'success', order_id: body.order_id },
      { status: 201 }
    )
  }),
]

// ── Helpers d'erreur réutilisables (server.use() dans un test) ────────────
export const errorHandlers = {
  unauthorized: (method, path) =>
    http[method](path, () => HttpResponse.json({ detail: 'Non autorisé.' }, { status: 401 })),
  notFound: (method, path) =>
    http[method](path, () => HttpResponse.json({ detail: 'Non trouvé.' }, { status: 404 })),
  serverError: (method, path) =>
    http[method](path, () => HttpResponse.json({ detail: 'Erreur serveur.' }, { status: 500 })),
  networkError: (method, path) =>
    http[method](path, () => HttpResponse.error()),
}
