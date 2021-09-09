// Core dependencies
const path = require('path')

// NPM dependencies
const express = require('express')
const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')
const fileHelper = require('./app/utils/file-helper')
const hljs = require('highlight.js')
const forceHttps = require('./app/utils/force-https')

// Application
const app = express()

// Force https in production
if (process.env.NODE_ENV === 'production') {
  app.use(forceHttps)
  app.set('trust proxy', 1) // needed for secure cookies on heroku
}

// Routing
const redirects = require('./app/routes/redirects')
const routes = require('./app/routes/index')
const autoRoutes = require('./app/routes/auto')

// Port
const port = process.env.PORT || 3000

// Setup application
const appViews = [
  path.join(__dirname, '/node_modules/govuk-frontend/govuk/'),
  path.join(__dirname, '/node_modules/govuk-frontend/govuk/components'),
  path.join(__dirname, 'app/views'),
  path.join(__dirname, 'app/views/components'),
  path.join(__dirname, 'app/views/patterns'),
  path.join(__dirname, 'app/views/layouts'),
  path.join(__dirname, 'app/views/partials'),
  path.join(__dirname, 'app/components')
]

// Configurations
const nunjucksEnvironment = nunjucks.configure(appViews, {
  autoescape: true,
  express: app,
  noCache: true,
  watch: true
})

nunjucksEnvironment.addGlobal('getNunjucksCode', fileHelper.getNunjucksCode)
nunjucksEnvironment.addGlobal('getHtmlCode', fileHelper.getHtmlCode)

// Set view engine
app.set('view engine', 'njk')

// Middleware to serve static assets
app.use('/public', express.static(path.join(__dirname, '/public')))
app.use('/evaluations', express.static(path.join(__dirname, '/evaluations')))
app.use('/assets', express.static(path.join(__dirname, 'node_modules', 'govuk-frontend', 'govuk', 'assets')))
app.use('/node_modules/govuk-frontend', express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk')))

// Use routes
app.use(redirects)
app.use(routes)
app.use(autoRoutes)

// Override code blocks to use tabindex on <PRE?
const renderer = new marked.Renderer()
const { overrides } = require('./app/utils/marked-overrides')
overrides.marked.code(renderer)
overrides.marked.heading(renderer)

marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  highlight: function (code, language) {
    const validLanguage = hljs.getLanguage(language) ? language : 'text'
    if (validLanguage) {
      return hljs.highlight(code, { language: validLanguage }).value
    }
  }
})

// Markdown register
markdown.register(nunjucksEnvironment, marked)

// Start app
app.listen(port, (err) => {
  if (err) {
    throw err
  } else {
    console.log(`Listening on port ${port} url: http://localhost:${port}`)
  }
})

module.exports = app
