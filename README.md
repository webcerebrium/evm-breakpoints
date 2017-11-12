# evm-breakpoints
Human-friendly interface for Ethereum VM breakpoints - debugging helper

```
  console.log(Object.keys(output.contracts[contractName]));

	// code and ABI that are needed by web3
	console.log(contractName + ': ' + output.contracts[contractName].bytecode);
        console.log(contractName + ': ' + output.contracts[contractName].runtimeBytecode)
	console.log(contractName + ': ' + output.contracts[contractName].srcmap);
        console.log(contractName + ': ' + output.contracts[contractName].srcmapRuntime)

	console.log(contractName + ': ' + output.contracts[contractName].opcodes);

position
    = sourceFile + line (compiles solidity sourceFile into bytecode with sourcemap checks that offset exists)
    = source + line (compiles solidity into bytecode with source map)
    = binFile + offset (just checks that offset exists)
    = bin + offset (just checks that offset exits)
    = offset
results in the offset. checks that it is valid


const { breakpoints, position } = require('./evm-breakpoint');
const sourceFile = './Trade.sol';

const address = '0x00000';
const logger = breakpoints
    .add( { address, position({ sourceFile, lines: [15, 16, 17] }) } )
    .on('any', (breakpoint) => {
        console.log(breakpoint.op);
    })
    .on('end', (breakpoint) => {
        console.log("finished", breakpoint)
    })
    .build(); // result is actually a string of function

web3.debug.traceTransaction(txHash, logger);

while (!debug.stopped()) {
    // pc | op | gas | gasPrice | memory | stack | depth | account | err
   console.log( "?Call Data", debug.getCallData());
   console.log( "?Call Stack", debug.getCallStack());
   console.log( "?Stack", debug.getStack());
   console.log( "Solidity State", debug.getSolidityState());
   console.log( "?Local Variables", debug.getLocalVariables());
   console.log( "+?Return Value", debug.getReturnValue());
   console.log( "-Storage Changes", debug.getStoragesChanges());
   console.log( "+Memory", debug.getMemory());
   debug.run();
}
    
"evm-breakpoints" module takes set of breakpoints 
    (basically addresses and offsets in bytecode)
    to build a logger function for usage in web3.debug.traceTransaction

    - traceTransaction does all the job, from start to end. 
        calling libraries callback step and log
    - at the end of result we have an array of states at breakpoints

HTTP RPC "debug" must be enabled
# https://github.com/ethereum/go-ethereum/wiki/Management-APIs#debug_tracetransaction

```
