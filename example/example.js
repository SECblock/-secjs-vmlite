let Buffer = require('safe-buffer').Buffer
let VM = require('../src/index.js')

// create a new VM instance
let vm = new VM()

// vm.on('Operation', function (data) {
//   console.log(data.opcode.name)
// })

// Compiled Bytecode of a Smart Contract
let code = '606060405260043610603f576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063c6888fa1146044575b600080fd5b3415604e57600080fd5b606260048080359060200190919050506078565b6040518082815260200191505060405180910390f35b60007f24abdb5865df5079dcc5ac590ff6f01d5c16edbc5fab4e195d9febd1114503da600783026040518082815260200191505060405180910390a16007820290509190505600a165627a7a7230582040383f19d9f65246752244189b02f56e8d0980ed44e7a56c0b200458caad20bb0029'
// Encoded input data
let data = 'c6888fa10000000000000000000000000000000000000000000000000000000000000006'

vm.runTrans({
  from: new Buffer('1CmqKHsdhqJhkoWm9w5ALJXTPemxL339ju'),
  to: new Buffer('1CmqKHsdhqJhkoWm9w5ALJXTPemxL339ju'),
  code: Buffer.from(code, 'hex'),
  data: Buffer.from(data, 'hex'),
  gasLimit: 6327,
  gasPrice: 0.001,
  amount: 1,
  message: 'Hello SEC!'
}, function (err, results) {
  console.log(results)
  // console.log('gasUsed: ' + results.vmResults.gasUsed.toString())
  console.log(err)
})
