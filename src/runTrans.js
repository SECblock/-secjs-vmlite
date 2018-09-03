/* eslint no-trailing-spaces: [2, { "skipBlankLines": true }] */

const Buffer = require('safe-buffer').Buffer
const async = require('async')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

/**
 * Execute a Transaction Message
 * @param {Buffer} opts.code The source code of smart contracts.
 * @param {Buffer} opts.data The input data -- invoked function name and input variables.
 * @param {Buffer} opts.amount The amount to be transfered.
 * @param {Buffer} opts.gasLimit The gas limit.
 * @param {Buffer} opts.gasPrice The gas price.
 * @param {Buffer} opts.message The input message.
 * @param {Buffer} opts.from The from Address.
 * @param {Buffer} opts.to The to Address.
 * @param {Function} cb
 */

module.exports = function (opts, cb) {
  let self = this
  let vmResults = {}
  let scSrcCode = opts.code
  let txData = opts.data
  let txValue = opts.value || Buffer.from([0])
  let gasLimit = opts.gasLimit
  let gasPrice = opts.gasPrice
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
      gasLimit: gasLimit,
      gasPrice: gasPrice
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
      TxFrom: opts.from.toString(),
      TxTo: opts.to.toString(),
      Value: opts.amount.toString(),
      Return: vmResults.return.toString('hex'),
      GasLimit: vmResults.gasLimit.toString(),
      GasUsedByTxn: vmResults.gasUsed.toNumber().toString(),
      GasPrice: vmResults.gasPrice.toString(),
      TxFee: vmResults.txFee.toString(),
      InputData: opts.message
    }
    cb(null, results)
  }

  async.series([
    beforeTrans,
    runOper,
    afterTrans
  ], parseCallResult)
}
