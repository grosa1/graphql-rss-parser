const development = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

class BaseError extends Error {
  constructor(message, code) {
    super(message)
    this.name = this.constructor.name
    this.code = code || 'internal-server-error'
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }
}

class EmptyParseOutputError extends BaseError {
  constructor() {
    super('Internal server error', 'empty-parse-output')
  }
}

class EmptyHttpResponseError extends BaseError {
  constructor() {
    super('Internal server error', 'empty-http-response-output')
  }
}

class InvalidInputError extends BaseError {
  constructor(message, code) {
    super(message, code || 'invalid-input')
  }
}

class UpstreamHttpError extends BaseError {
  constructor(message, status) {
    super(message, 'upstream-http-error')
    this.status = status
  }
}

class NotFoundError extends BaseError {
  constructor() {
    super('Could not find feed', 'could-not-find-feed')
  }
}

class ParserError extends BaseError {
  constructor(cause, parser) {
    super(cause.message, 'parser-error')
    this.cause = cause
    this.parser = parser
  }
}

class NotAFeedError extends BaseError {
  constructor() {
    super('Not a feed', 'not-a-feed')
  }
}

class ConnectionFailedError extends BaseError {
  constructor(url) {
    super('Could not connect', 'connection-failed')
    this.url = url
  }
}

function createErrorFormatter(Raven) {
  return function formatError(error) {
    if (Raven) {
      if (error.path || error.name !== 'GraphQLError') {
        Raven.captureException(error, {
          tags: { graphql: 'error' },
          extra: {
            source: error.source && error.source.body,
            positions: error.positions,
            path: error.path,
          },
        })
      } else {
        Raven.captureMessage(`GraphQLWrongQuery: ${error.message}`, {
          tags: { graphql: 'query' },
          extra: {
            source: error.source && error.source.body,
            positions: error.positions,
          },
        })
      }
    }

    const response = {
      path: error.path,
      error: {
        message: error.message,
        code: error.extensions.exception.code,
        url: error.extensions.exception.url,
        status: error.extensions.exception.status,
        parser: error.extensions.exception.parser,
      },
    }
    if (error.stack) {
      if (development) {
        response.stack = error.stack.split('\n')
      }
      try {
        response.type = error.stack.split('\n')[0].split(':')[0]
      } catch (error) {
        if (development) {
          return error
        }
      }
    }
    return response
  }
}

module.exports = {
  ConnectionFailedError,
  EmptyHttpResponseError,
  EmptyParseOutputError,
  InvalidInputError,
  ParserError,
  NotAFeedError,
  NotFoundError,
  UpstreamHttpError,
  createErrorFormatter,
}
