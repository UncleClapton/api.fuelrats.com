'use strict'
const db = require('./../db').db
const Query = require('./index')
const API = require('../classes/API')

/**
 * A class representing a rescue query
 */
class SystemStatisticsQuery extends Query {
  /**
   * Create a sequelize rescue query from a set of parameters
   * @constructor
   * @param params
   * @param connection
   */
  constructor (params, connection) {
    super(params, connection)
    this._query.include = []
    this._query.attributes = [
      'system',
      [this._countSystemsField, 'count']
    ]

    this._query.attributes = this._query.attributes.concat(API.compare(this.comparators))

    this._query.group = ['system']
  }

  /**
   * Create a sequelize order parameter from a v2 order query
   * @param order a column to order the query by, optionally prefixed by a - to order descending
   * @returns {{field: *, direction: string}} An object containing the field to order by and the direction
   */
  order (order) {
    let direction = 'ASC'
    if (!order) {
      order = this._countSystemsField
      direction = this.defaultSortDirection
    } else {
      if (order.startsWith('-')) {
        order = order.substring(1)
        direction = 'DESC'
      }
      if (order === 'count') {
        order = this._countSystemsField
      }

      let comparator = API.getComparator(this.comparators, order)
      if (comparator) {
        order = comparator
      }
    }
    return { field: order, direction: direction }
  }

  limit (limit) {
    return Number(limit) || null
  }

  get comparators () {
    return [{
      field: 'outcome',
      options: [
        ['success'],
        ['failure'],
        ['invalid'],
        ['other']
      ]
    },{
      field: 'codeRed',
      options: [
        [true, 'codeRed']
      ]
    },{
      field: 'platform',
      options: [
        ['pc'],
        ['ps'],
        ['xb']
      ]
    }]
  }

  get _countSystemsField () {
    return db.fn('COUNT', 'system')
  }
}

module.exports = SystemStatisticsQuery