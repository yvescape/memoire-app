// ── Shared mock data (aligned with src/test/mocks/handlers.js) ─────────────

export const PRODUCTS = [
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

export const CART_ITEM = {
  id: 1,
  product: 1,
  product_name: 'Élyse Rose',
  quantity: 2,
  price: '45000.00',
  total: '90000.00',
}

export const ORDER = {
  id: 42,
  status: 'pending',
  items: [CART_ITEM],
  pricing: {
    id: 10,
    subtotal: '90000.00',
    delivery_price: '3000.00',
    total: '93000.00',
    delivery_option: null,
  },
}

export const DELIVERY_OPTIONS = [
  { id: 1, name: 'Standard', price: '3000.00', amount: 3000, is_default: true, delay: '3-5 jours' },
  { id: 2, name: 'Express', price: '6000.00', amount: 6000, is_default: false, delay: '24h' },
]

// ── JWT helpers (Node.js context) ──────────────────────────────────────────
// exp: 9999999999 ≈ year 2286 — always valid during tests
const _payload = Buffer.from(
  JSON.stringify({ user_id: 1, exp: 9999999999 })
).toString('base64')

export const TOKENS = {
  access: `eyJhbGciOiJIUzI1NiJ9.${_payload}.fake`,
  refresh: `eyJhbGciOiJIUzI1NiJ9.${_payload}.fake`,
}

// ── Inject tokens into localStorage before page loads ─────────────────────
// Call BEFORE page.goto() — addInitScript runs on every navigation.
export async function loginAs(page) {
  await page.addInitScript(({ access, refresh }) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }, TOKENS)
}

// ── Route mocking helper ───────────────────────────────────────────────────
function fulfill(route, data, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  })
}

export async function setupApiRoutes(page) {
  await page.route(
    (url) => new URL(url).pathname.startsWith('/api/'),
    async (route, request) => {
      const { pathname, searchParams } = new URL(request.url())
      const method = request.method()

      // ── Token refresh ─────────────────────────────────────────────────
      if (pathname === '/api/auth/token/refresh/') {
        return fulfill(route, { access: TOKENS.access })
      }

      // ── Auth ──────────────────────────────────────────────────────────
      if (pathname === '/api/auth/' && method === 'POST') {
        const body = await request.postDataJSON()
        if (body.password === 'wrongpassword' || body.email === 'unknown@test.com') {
          return fulfill(route, { detail: 'Identifiants incorrects. Veuillez réessayer.' }, 401)
        }
        return fulfill(route, TOKENS)
      }

      if (pathname === '/api/auth/register/' && method === 'POST') {
        const body = await request.postDataJSON()
        if (body.email === 'existing@test.com') {
          return fulfill(route, { email: ['Un compte avec cet email existe déjà.'] }, 400)
        }
        return fulfill(route, { id: 99, email: body.email }, 201)
      }

      // ── Products ──────────────────────────────────────────────────────
      if (pathname === '/api/products/' && method === 'GET') {
        const search = (searchParams.get('search') || '').toLowerCase()
        const category = searchParams.get('category') || ''
        const gender = searchParams.get('gender') || ''
        let results = PRODUCTS
        if (search) results = results.filter((p) => p.name.toLowerCase().includes(search))
        if (category) results = results.filter((p) => p.category === category)
        if (gender) results = results.filter((p) => p.gender === gender)
        return fulfill(route, { count: results.length, next: null, previous: null, results })
      }

      if (/^\/api\/products\/\d+\/$/.test(pathname) && method === 'GET') {
        const id = Number(pathname.match(/\/(\d+)\/$/)?.[1])
        const product = PRODUCTS.find((p) => p.id === id)
        return product
          ? fulfill(route, product)
          : fulfill(route, { detail: 'Non trouvé.' }, 404)
      }

      // ── Reviews (note: "interation" typo comes from the backend) ──────
      if (pathname === '/api/interation/bulk-summary/' && method === 'POST') {
        return fulfill(route, {})
      }

      if (/^\/api\/interation\/\d+\/summary\/$/.test(pathname)) {
        return fulfill(route, { product_id: parseInt(pathname.split('/')[3]), average_rating: 4.2, total_ratings: 8, total_likes: 12, comment_count: 3, liked: false })
      }

      if (/^\/api\/interation\/\d+\/comments\/$/.test(pathname) && method === 'GET') {
        return fulfill(route, [
          { id: 1, author: 'Alice', content: 'Magnifique parfum !', created_at: '2025-01-15T10:00:00Z' },
        ])
      }

      if (/^\/api\/interation\/\d+\/comments\/create\/$/.test(pathname) && method === 'POST') {
        const body = await request.postDataJSON()
        return fulfill(
          route,
          { id: 99, author: 'Test User', content: body.content, created_at: new Date().toISOString() },
          201
        )
      }

      if (/^\/api\/interation\/\d+\/rating\/$/.test(pathname) && method === 'POST') {
        return fulfill(route, { rating: 5, average_rating: 4.5, rating_count: 9 }, 201)
      }

      if (/^\/api\/interation\/\d+\/toggle-like\/$/.test(pathname) && method === 'POST') {
        return fulfill(route, { liked: true, likes: 13 })
      }

      // ── Orders — specific routes first, generic :id last ──────────────
      if (pathname === '/api/orders/my/' && method === 'GET') {
        return fulfill(route, [ORDER])
      }

      if (pathname === '/api/orders/delivery-options/' && method === 'GET') {
        return fulfill(route, DELIVERY_OPTIONS)
      }

      if (pathname === '/api/orders/orders_item/cart/items/' && method === 'GET') {
        return fulfill(route, [CART_ITEM])
      }

      if (pathname === '/api/orders/orders_item/cart/items/' && method === 'POST') {
        const body = await request.postDataJSON()
        const product = PRODUCTS.find((p) => p.id === body.product_id)
        return fulfill(
          route,
          { id: 99, product: body.product_id, product_name: product?.name ?? 'Produit', quantity: 1 },
          201
        )
      }

      if (/^\/api\/orders\/orders_item\/cart\/items\/\d+\/quantity\/$/.test(pathname) && method === 'PATCH') {
        const body = await request.postDataJSON()
        return fulfill(route, { id: 1, quantity: body.quantity ?? 1 })
      }

      if (/^\/api\/orders\/orders_item\/cart\/items\/\d+\/$/.test(pathname) && method === 'DELETE') {
        return route.fulfill({ status: 204 })
      }

      if (/^\/api\/orders\/orders_item\/check\/\d+\/$/.test(pathname) && method === 'GET') {
        return fulfill(route, { in_cart: false, item_id: null })
      }

      if (pathname === '/api/orders/orders_address/' && method === 'POST') {
        return fulfill(route, { id: 1 }, 201)
      }

      if (/^\/api\/orders\/\d+\/pricing\/delivery\/$/.test(pathname) && method === 'PATCH') {
        return fulfill(route, { delivery_option: 1, delivery_price: '3000.00', total: '93000.00' })
      }

      if (/^\/api\/orders\/\d+\/$/.test(pathname) && method === 'GET') {
        return fulfill(route, ORDER)
      }

      // ── Payments ──────────────────────────────────────────────────────
      if (pathname === '/api/payments/create/' && method === 'POST') {
        const body = await request.postDataJSON()
        if (body.card_number === '0000000000000000') {
          return fulfill(route, { detail: 'Paiement refusé. Fonds insuffisants.' }, 402)
        }
        return fulfill(route, { id: 1, status: 'success', order_id: body.order_id }, 201)
      }

      // Unmatched — let the request through (JS assets, CSS, etc.)
      await route.continue()
    }
  )
}
