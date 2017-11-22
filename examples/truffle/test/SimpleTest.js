const Simple = artifacts.require("./Simple.sol");
const evm = require('./../../../index.js');

contract('Simple', function (accounts) {

  it("should calculate iterations of 300", async function () {
    const instance = await Simple.deployed();
    const result300 = await instance.calculate.call(300);
    assert.equal(result300.toString(), "16");
  });

  it("should calculate iterations of 200 w/debug", async function () {
    const instance = await Simple.deployed();
    const txHash = await instance.calculate.sendTransaction(200);
    const txReceipt = web3.eth.getTransactionReceipt(txHash);
    assert.isNotNull(txReceipt); // it should be mined on testRPC

    const logger = evm.breakpoint().add({
      contractFile: "./build/contracts/Simple.json", // we should take full compilation info  from the given file
      lines: [21] // single breakpoint on iterator
    });

    const debug = evm.iterator(web3, txHash, logger);
    let prevIterator = -1;
    while (!debug.stopped()) {
      const state = debug.get();
      const stateStack = state.stack;
      const number = stateStack[4]; // local variable - "number"
      const iterator = stateStack[5]; // local variable - "iterator"
      console.log("number=", number, "iterator=", iterator);
      assert.isAbove(iterator, prevIterator); // some assertion
      prevIterator = iterator;
      debug.next();
    }
  });
});
