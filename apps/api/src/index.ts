import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import routes from './routes/index.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '/api/*',
  cors({ origin: ['http://localhost:5173'], credentials: true })
)

app.get('/api/health', (c) => c.json({ status: 'ok' }))
app.route('/api', routes)

const port = Number(process.env.PORT) || 3000
console.log(`API server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
