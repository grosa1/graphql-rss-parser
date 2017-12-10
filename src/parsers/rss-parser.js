const parser = require('rss-parser')

const { NotAFeedError, ParserError } = require('../errors')

function transform(parsed) {
  if (!parsed) return null
  const entries = parsed.feed.entries.map(entry =>
    Object.assign({}, entry, {
      pubDate: entry.isoDate,
    })
  )
  return Object.assign({}, parsed.feed, { entries, parser: 'RSS_PARSER' })
}

module.exports = function parseString(document, options) {
  return new Promise((resolve, reject) => {
    parser.parseString(document, function(error, parsed) {
      if (error) {
        if (/Line:/.test(error.message) && /Column:/.test(error.message)) {
          return reject(new NotAFeedError())
        }
        return reject(new ParserError(error, 'RSS_PARSER'))
      }

      resolve(transform(parsed, options))
    })
  })
}
