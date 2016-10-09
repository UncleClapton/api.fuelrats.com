'use strict'

let oauth2orize = require('oauth2orize')
let crypto = require('crypto')
let Token = require('../db').Token
let Client = require('../db').Client
let Code = require('../db').Code
let Permission = require('permission')

let server = oauth2orize.createServer()

server.serializeClient(function (client, callback) {
  return callback(null, client.id)
})

server.deserializeClient(function (id, callback) {
  Client.findById(id).then(function (client) {
    if (!client) {
      callback(null, false)
      return
    }

    callback(null, client)
  }).catch(function (error) {
    callback(error)
  })
})

server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
  let scopes = ares.scope.split(' ')
  for (let scope in scopes) {
    if (Permission.permissions.includes(scope) === false) {
      callback(Error.throw('invalid_scope', scope))
    }
  }

  Code.create({
    value: crypto.randomBytes(24).toString('hex'),
    scope: scopes,
    redirectUri: redirectUri
  }).then(function (code) {
    let associations = []
    associations.push(code.setClient(client))
    associations.push(code.setUser(user.id))

    Promise.all(associations).then(function () {
      callback(null, code.value)
    }).catch(function (error) {
      callback(error)
    })
  }).catch(function (error) {
    callback(error)
  })
}))

server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
  Code.findOne({ where: { value: code }}).then(function (auth) {
    if (!auth) {
      return callback(null, false)
    }

    if (client.id !== auth.clientId) {
      return callback(null, false)
    }

    if (redirectUri !== auth.redirectUri) {
      return callback(null, false)
    }

    auth.destroy()

    Token.create({
      scope: auth.scope,
      value: crypto.randomBytes(32).toString('hex')
    }).then(function (token) {
      let associations = []
      associations.push(token.setClient(client))
      associations.push(token.setUser(auth.userId))

      Promise.all(associations).then(function () {
        callback(null, token.value)
      }).catch(function (error) {
        callback(error)
      })
    })
  }).catch(function (error) {
    callback(error)
  })
}))


exports.authorization = [
  server.authorization(function (clientId, redirectUri, callback) {
    Client.findById(clientId).then(function (client) {
      if (!client) {
        return callback(null, false)
      }
      callback(null, client, redirectUri)
    }).catch(function (error) {
      return callback(error)
    })
  }),
  function (req, res) {
    res.render('authorise.swig', { transactionId: req.oauth2.transactionID, user: req.user, client: req.oauth2.client })
  }
]

exports.decision = [
  server.decision()
]

exports.token = [
  server.token(),
  server.errorHandler()
]
