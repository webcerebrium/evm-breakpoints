# evm-breakpoints
Human-friendly interface for Ethereum VM breakpoints - debugging helper.

## Install as Library
```
npm save --dev evm-breakpoints
```

## Example of library usage in tests:

```javascript
const evm = require('evm-breakpoints');

const logger = evm.breakpoint().add({
  contractFile: "./build/contracts/Simple.json", // we should take full compilation info from the given file
  lines: [21] // multiple lines can be specified as breakpoints
});

const debug = evm.iterator(web3, txHash, logger);
while (!debug.stopped()) {
  console.log(debug.get());
  debug.next();
}
```
please see `examples/truffle` for a full example of debugging local variables.


## Example of library usage in web:

In web environment, you need to compile the contract, and then provide iterator source map from compiled version

```javascript
var evm = window.evmBreakpoints;
evm
  .contract({ source: contractSource, compiler: "latest"  })
  .on('ready', function(compiled) {
     var json = compiled.contracts[contractName];
     var logger = evm.breakpoint().add({ source, sourceMap: json.srcmapRuntime, lines: [21] });
     var debug = evm.iterator(web3, txHash, logger);
     while (!debug.stopped()) {
       console.log(debug.get());
       debug.next();
     }
  })
  .on('error', console.error);
```
please see `examples/web/index.html` for a full example of debugging local variables.

## Disclaimer

Work of the library is based on experimental `web3.debug.traceTransaction`, so please keep following the updates

- HTTP RPC "debug" api must be enabled
https://github.com/ethereum/go-ethereum/wiki/Management-APIs#debug_tracetransaction

- If you are receiving `Error: missing trie node`,
in order to use trace api of geth you have to synchronize your node with `--syncmode full`

## License
MIT. Anyone can copy, change, derive further work from this repository without any restrictions.
