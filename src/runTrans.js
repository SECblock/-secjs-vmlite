/* eslint no-trailing-spaces: [2, { "skipBlankLines": true }] */

const Buffer = require('safe-buffer').Buffer
const async = require('async')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

/**
 * Run a Call
 * @param {Buffer} opts.code The source code of smart contracts.
 * @param {Buffer} opts.data The input data -- invoked function name and input variables.
 * @param {Buffer} opts.value The amount to be transfered.
 * @param {Buffer} opts.gasLimit The gas limit.
 * @param {Function} cb
 */

module.exports = function (opts, cb) {
  let self = this
  let vmResults = {}
  let scSrcCode = opts.code
  let txData = opts.data
  let txValue = opts.value || Buffer.from([0])
  let gasLimit = opts.gasLimit
  let runCodeOpts

  txValue = new BN(txValue)

  function beforeTrans (cb) {
    self.emit('beforeCall', runCodeOpts, cb)
  }

  function runOper (cb) {
    runCodeOpts = {
      code: scSrcCode,
      data: txData,
      value: txValue,
      gasLimit: gasLimit
    }
    self.runOper(runCodeOpts, function (err, results) {
      vmResults = results
      console.log(err)
      return cb()
    })
  }

  function afterTrans (cb) {
    self.emit('afterCall', vmResults, cb)
  }

  function parseCallResult (err) {
    if (err) return cb(err)
    let results = {
      vmResults: vmResults
    }
    cb(null, results)
  }

  async.series([
    beforeTrans,
    runOper,
    afterTrans
  ], parseCallResult)
}
