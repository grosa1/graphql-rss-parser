const Readable = require('stream').Readable
const FeedParser = require('feedparser')

const { ParserError, NotAFeedError } = require('../errors')

function transform (parsed, options) {
  if (!parsed) return null
  const {title, link, feedUrl} = parsed
  const entries = parsed.items.map(entry => ({
    title: entry.title,
    pubDate: entry.pubDate,
    link: entry.link
  }))
  return { title, link, feedUrl, entries }
}

module.exports = function parseString (feed) {
  return new Promise((resolve, reject) => {
    try {
      const feedparser = new FeedParser()
      feedparser.on('error', error => {
        reject(new ParserError(error))
      })

      let parsedFeed
      feedparser.on('readable', function () {
        const meta = this.meta
        if (!parsedFeed) {
          parsedFeed = Object.assign({}, meta, { items: [] })
        }

        let item
        while ((item = this.read())) {
          delete item.meta
          parsedFeed.items.push(item)
        }
      })

      feedparser.on('end', function () {
        resolve(transform(parsedFeed))
      })

      const stream = new Readable()
      stream.pipe(feedparser)
      stream.push(feed)
      stream.push(null)
    } catch (error) {
      console.log({error})
      reject(error)
    }
  })
  .catch(error => {
    if (error.message === 'Not a feed') {
      throw new NotAFeedError(error)
    }
    throw error
  })
}