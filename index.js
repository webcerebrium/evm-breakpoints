// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 1 - Contract object
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 

var evmContract = function(options) {
       
  if (!options.address) { throw new Error('Expected to have contract address'); }

  var expected = ['standardJson'];
  if (typeof window === 'undefined') {
	expected.push('standardJsonFile');
  }

  this.json = {};
  if (options.standardJson) {        
  } else if (typeof window === 'undefined') {
     // server version standardJsonFile
  } else {
     throw new Error("Contract expects to have " + expected.join(" or "));
  } 
  return this;
};


// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 2 - watcher object - contains breakpoints
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
var evmWatcher = function () {
  
  this.points = [];

  this.add = function(params) {
    if (!params.contract) { throw new Error("Expected contract as the 1st argument to add breakpoint"); }
    if (!params.contract.json) { throw new Error("Expected contract object as the 1st argument to add breakpoint");  }
    if (!params.lines) { throw new Error("Expected lines list to add breakpoint"); }

    this.points.push(params);
  };

  var condition = function() {
    return 'true';
  };

  var data = function() {
    return 'log';
  };

  // builds the options for debugTransaction - mainly the tracer string
  this.build = function() {                                                                                                   
     return '{data: [], step: function(log, db) { if('+ condition() + ') this.data.push("'+ data() +'"); }, result: function() { return this.data; }}';
  };

  return this;
};


// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 3 - Breakpoints iterator
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
var evmDebugIterator = function(web3, txHash, logger) {
  if (typeof web3 !== 'function') { throw new Error('Web3 is not passed to Debug Iterator'); }
  if (!txHash) { throw new Error('Transaction expected'); }
  if (typeof logger !== 'function') { throw new Error('Iterator expects logger as third parameter'); }
          
  // Injecting web3.debug - usually it is not provided
  // while it is available in RPC API                                                
  if (typeof(web3.debug) === 'undefined' ) {
    web3._extend({
      property: 'debug',
	methods: [new web3._extend.Method({
	   name: 'traceTransaction',
	   call: 'debug_traceTransaction',
	   params: 2,
           inputFormatter: [null, null]
	})]
    });
  };                                                                                           
 
  this.current = -1;

  // getting condition in the current breakpoint
  this.get = function() {
    return this.data[this.current];
  };	

  this.stopped = function() {
    return this.current == -1;
  };

  this.next = function() {
    this.current ++;
    if (this.current > this.data.length) this.current++;
  };

  this.data = web3.debug.traceTransaction(txHash, logger);
  return this;
};


var evmBreakpoints = {
   contract: evmContract,
   breakpoint: evmBreakpoint, 
   iterator: evmDebugIterator 
};
                             
if (typeof window !== 'undefined') {
    // exporting to web version - just by setting global ...
    window.evmBreakpoints = evmBreakpoints;
} else {
    // exporting for usage in server version
    module.exports  = evmBreakpoints;
}
