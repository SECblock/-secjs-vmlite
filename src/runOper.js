/* eslint no-trailing-spaces: [2, { "skipBlankLines": true }] */

const Buffer = require('safe-buffer').Buffer
const async = require('async')
const utils = require('ethereumjs-util')
const Operators = require('./libs/operators.js')
const OperFunc = require('./libs/operationFunc.js')
const exceptions = require('./libs/exceptions.js')
const setImmediate = require('timers').setImmediate
const BN = utils.BN

const ERROR = exceptions.ERROR
const VmError = exceptions.VmError

/**
 * Executes VM operators
 * @param {Buffer} opts.code The source code of smart contracts.
 * @param {Buffer} opts.data The input data -- invoked function name and input variables.
 * @param {Buffer} opts.value The amount to be transfered.
 * @param {Buffer} opts.gasLimit The gas limit.
 * @param {Function} cb
 */

module.exports = function (opts, cb) {
  let self = this

  // Running state in the VM
  let vmState = {
    returnValue: false,
    stopped: false,
    vmError: false,
    programCounter: 0,
    opCode: undefined,
    opName: undefined,
    gasLeft: new BN(opts.gasLimit),
    gasLimit: new BN(opts.gasLimit),
    gasPrice: opts.gasPrice,
    memory: [],
    memoryWordCount: new BN(0),
    stack: [],
    lastReturned: [],
    logs: [],
    validJumps: [],
    gasRefund: new BN(0),
    highestMemCost: new BN(0),
    depth: opts.depth || 0,
    selfdestruct: opts.selfdestruct || opts.suicides || {},
    callValue: opts.value || new BN(0),
    callData: opts.data || Buffer.from([0]),
    code: opts.code
  }

  vmState._vm = self

  getValidJumps(vmState)
  vmExecute()

  // iterate over operators
  function vmExecute () {
    async.whilst(vmIsActive, iterateVm, parseVmResults)
  }

  function vmIsActive () {
    let notAtEnd = vmState.programCounter < vmState.code.length

    return !vmState.stopped && notAtEnd && !vmState.vmError && !vmState.returnValue
  }

  function iterateVm (done) {
    let opCode = vmState.code[vmState.programCounter]
    let opInfo = Operators(opCode)
    let opName = opInfo.name
    let opFn = OperFunc[opName]

    vmState.opName = opName
    vmState.opCode = opCode

    async.series([
      runOperationHook,
      runOp
    ], function (err) {
      setImmediate(done.bind(null, err))
    })

    function runOperationHook (cb) {
      let eventObj = {
        pc: vmState.programCounter,
        gasLeft: vmState.gasLeft,
        opcode: Operators(opCode, true),
        stack: vmState.stack,
        depth: vmState.depth,
        memory: vmState.memory
      }
      self.emit('Operation', eventObj, cb)
    }

    function runOp (cb) {
      if (opName === 'INVALID') {
        return cb(new VmError(ERROR.INVALID_OPCODE))
      }
      if (vmState.stack.length < opInfo.in) {
        return cb(new VmError(ERROR.STACK_UNDERFLOW))
      }
      if ((vmState.stack.length - opInfo.in + opInfo.out) > 1024) {
        return cb(new VmError(ERROR.STACK_OVERFLOW))
      }

      let fee = new BN(opInfo.fee)

      vmState.gasLeft = vmState.gasLeft.sub(fee)
      if (vmState.gasLeft.ltn(0)) {
        vmState.gasLeft = new BN(0)
        cb(new VmError(ERROR.OUT_OF_GAS))
        return
      }

      vmState.programCounter++
      let argsNum = opInfo.in
      let retNum = opInfo.out
      let args = argsNum ? vmState.stack.splice(-argsNum) : []
      let result
      args.reverse()
      args.push(vmState)
      if (opInfo.async) {
        args.push(function (err, result) {
          if (err) return cb(err)

          if (result !== undefined) {
            if (retNum !== 1) {
              return cb(new VmError(ERROR.INTERNAL_ERROR))
            }

            vmState.stack.push(result)
          } else {
            if (retNum !== 0) {
              return cb(new VmError(ERROR.INTERNAL_ERROR))
            }
          }

          cb()
        })
      }

      try {
        result = opFn.apply(null, args)
      } catch (e) {
        cb(e)
        return
      }

      if (result !== undefined) {
        if (retNum !== 1) {
          return cb(VmError(ERROR.INTERNAL_ERROR))
        }

        vmState.stack.push(result)
      } else {
        if (!opInfo.async && retNum !== 0) {
          return cb(VmError(ERROR.INTERNAL_ERROR))
        }
      }

      if (!opInfo.async) {
        cb()
      }
    }
  }

  function parseVmResults (err) {
    if (err) {
      vmState.logs = []
      vmState.vmError = true
    }

    let results = {
      vmState: vmState,
      selfdestruct: vmState.selfdestruct,
      gasRefund: vmState.gasRefund,
      exception: err ? 0 : 1,
      exceptionError: err,
      logs: vmState.logs,
      gas: vmState.gasLeft,
      'return': vmState.returnValue ? vmState.returnValue : Buffer.alloc(0)
    }

    if (results.exceptionError) {
      delete results.gasRefund
      delete results.selfdestruct
    }

    if (err && err.error !== ERROR.REVERT) {
      results.gasUsed = vmState.gasLimit
    } else {
      results.gasUsed = vmState.gasLimit.sub(vmState.gasLeft)
    }

    cb(err, results)
  }
}

function getValidJumps (vmState) {
  for (let i = 0; i < vmState.code.length; i++) {
    let curOpCode = Operators(vmState.code[i]).name

    if (curOpCode === 'PUSH') {
      i += vmState.code[i] - 0x5f
    }

    if (curOpCode === 'JUMPDEST') {
      vmState.validJumps.push(i)
    }
  }
}
