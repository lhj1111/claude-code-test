import { Hono } from 'hono'
import todo from './todo/index.js'
import note from './note/index.js'
import youtubeSummary from './youtube-summary/index.js'

const routes = new Hono()

routes.route('/todos', todo)
routes.route('/notes', note)
routes.route('/summaries', youtubeSummary)

export default routes
