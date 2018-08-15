<a name="SecVM"></a>

* * *
## SecVM
[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard) 

**Definition**: 
A lite version of SecVM. It is deployed on nodes. It targets to translate bytecode and excute the corresponding operations.

**Kind**: global class
* [SecVM](#SecVM)
    * [.runTrans(opts, cb)](#runTrans)

* * *
**Install**
```js
npm install @sec-block/secjs-vmlite --save 
```

**Usage**
```js
let SECVM = require('../src/index.js')

secVm = new SECVM()
secVm.runTrans(opts, cb)
```

* * *
<a name="runTrans"></a>

### runTrans(opts, cb)
A small function created as there is a lot of sha256 hashing.

**Kind**: instance method of [<code>SecVM</code>](#secVM)  

| Param | Type | Description |
| --- | --- | --- |
| opts.code | <code>Buffer</code> | The bytecode of smart contracts' source code |
| opts.data | <code>Buffer</code> | The encoded input data -- invoked function name and input variables. |
**Example**
```js
// Please refer to example/example.js
let SECVM = require('../src/index.js')

secVm = new SECVM()
code = '606060...bb0029'
data = 'c6888f...000006'

secVm.runTrans({
  code: Buffer.from(code, 'hex'),
  data: Buffer.from(data, 'hex'),
  gasLimit: Buffer.from('ffffffff', 'hex')
}, function (err, results) {
  console.log('returned: ' + results.vmResults.return.toString('hex'))
  console.log('gasUsed: ' + results.vmResults.gasUsed.toString())
  console.log(err)
})
```
* * *

### LICENSE
ISC
* * *
# SEC轻量级虚拟机-中文简介

该项目是SEC虚拟机的一个轻量级版本。不同于以太坊虚拟机的是，SEC虚拟机运行时并不会对区块链进行更改，从SEC虚拟机中返回的数据会被继续使用进而对区块链产生更改。SEC虚拟机的输入参数应该是智能合约编译后的Bytecode以及编码后的合约调用时的信息和变量。返回值包括合约函数计算的结果（如果该函数有返回值的话），以及计算所要消耗的gas值。