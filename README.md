# evm-breakpoints
Human-friendly interface for Ethereum VM breakpoints - debugging helper.

## Example of library usage in tests:

## Disclaimer

Work of the library is based on experimental `web3.debug.traceTransaction`, so please keep following the updates

- HTTP RPC "debug" api must be enabled
https://github.com/ethereum/go-ethereum/wiki/Management-APIs#debug_tracetransaction

- If you are receiving `Error: missing trie node`,
in order to use trace api of geth you have to synchronize your node with `--syncmode full`

## License
MIT. Anyone can copy, change, derive further work from this repository without any restrictions.