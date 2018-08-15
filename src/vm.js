const util = require('util')
const ethUtil = require('ethereumjs-util')
const Events = require('async-eventemitter')

module.exports = VM

VM.deps = {
  ethUtil: ethUtil,
  Account: require('ethereumjs-account'),
  Trie: require('merkle-patricia-tree'),
  rlp: require('ethereumjs-util').rlp
}

function VM (opts = {}) {
  this.opts = opts

  Events.call(this)
}

util.inherits(VM, Events)

VM.prototype.runOper = require('./runOper.js')
VM.prototype.runTrans = require('./runTrans.js')
