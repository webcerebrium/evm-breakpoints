// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 1 - Contract object - used for contract compilation and additional mapping.
// Not used in case of truffle - there we have compiled JSON version
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
var isBrowser = typeof window !== 'undefined';
var evmContract = function(options) {
  // if (!options.address) { throw new Error('Expected to have contract address'); }

  var loadSolc = isBrowser ? function(compiler, cb) { return BrowserSolc.loadVersion("soljson-" + compiler + ".js", cb); } : require('solc').loadRemoteVersion;
  var expected = ['source'];
 
  var events = {};
  this.on = function(event, callback) {
    events[event] = callback;
  };

  var json = {};
  var lines = [];
  var setJson = function(val) { 
    if (!val || !val.srcmapRuntime) {
	throw new Error("srcmapRuntime was not found in compiled contract");
    }
    json = val; 
    if (typeof events.ready === 'function') { events.ready(json); }
  }

  if (options.source) {        
     if (options.compiler) {
	console.log("Loading compiler version: " + options.compiler);
     	loadSolc(options.compiler, function(solcCustom) {
           var compiled = solcCustom.compile(options.source, options.optimization ? 1 : 0);
	   setJson(compiled);
     	});
     } else { 
	throw new Error("Compiler version is not specified");
     }
  } else {
     throw new Error("Contract expects to have " + expected.join(" or "));
  } 
  return this;
};


// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 2 - internal class for mapping lines and tunring offsets into lines
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 

var linesMap = function(source) {
  // go through the source, create lines map
  var lines = [{ line: 1, offset: 0, size: 0 }], srcLine = 1, srcSize = 0;
  var srcOffset = 0;
  while( srcOffset <= source.length) {
     var ch = source.charAt(srcOffset);
     if (ch == '\n' || ch == '\0') {
      srcLine++;
      do { srcOffset ++; ch = source.charAt(srcOffset); } while (ch === ' ' || ch === '\t');
      lines.push({ line: srcLine, offset: srcOffset, size: 0 });
     } else {
      lines[lines.length-1].size++;
     }
     srcOffset++;  
  }
  this.lines = lines;

  this.find = function(offset) {
    for (var i = 0; i < this.lines.length; i++) {
      var row = this.lines[i];
      if (offset >= row.offset && offset <= (row.offset + row.size)) return row.line;
    }
  };
  return this;  
};

// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 3 - watcher object - contains breakpoints
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
var evmWatcher = function () {

  this.bytecode = [];  
  this.points = {};

  this.add = function(params) {
    if (!params.contract && !params.contractFile) { throw new Error("Expected contract as the 1st argument to add breakpoint"); }
    if (!params.lines) { throw new Error("Expected lines list to add breakpoint"); } // future: alternative to lines could be single line or offset

    if (params.contractFile) {
      var compiledJson = JSON.parse(require('fs').readFileSync(params.contractFile));
      if (!compiledJson.deployedSourceMap) { throw new Error("'deployedSourceMap' is missing in compiled JSON"); }
      if (!compiledJson.source) { throw new Error("'source' is missing in compiled JSON"); }

      var lm = linesMap(compiledJson.source);
      // go through source map, create offsets for every bytecode position
      var srcMap = compiledJson.deployedSourceMap.split(";");
      var offset = 0, size = 0;
      for (var si = 0; si < srcMap.length; si++) {
        var src = srcMap[si].split(':');
        if (src.length > 1) { 
          if (src[0]) { offset = src[0]; }
	  if (src[1]) { size = src[1]; }
        }
        var bc = { offset: offset, size: size };
        var line = lm.find(offset);
        if (line) bc.line = line;
        this.bytecode[si] = bc;
      }
      if (params.lines) {
        this.points.lines = params.lines;
      }
    }
    return this;
  };

  this.matchBreakpoint = function(pc) {
    if (this.bytecode[pc] && this.bytecode[pc].line && this.points.lines) {
      return this.points.lines.indexOf(this.bytecode[pc].line) !== -1;
    }
    return false;
  };

  this.whereIs = function(pc) {
    return this.bytecode[pc]; // bytecode descriptor for the given pointer
  };
  return this;
};


// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
// 4 - Breakpoints iterator
// --- --- --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- ---  --- --- 
var evmDebugIterator = function(web3, txHash, logger, timeout) {
  if (typeof web3 !== 'object') { throw new Error('web3 is not passed to Debug Iterator'); }
  if (!txHash) { throw new Error('Transaction expected'); }
  if (!logger) { throw new Error('Iterator expects logger as third parameter'); }
          
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
    return this.state[this.current];
  };	

  this.stopped = function() {
    return this.current == -1 || this.current > this.state.length;
  };

  this.next = function() {
    this.current ++;
    if (this.current >= this.state.length) this.current = -1;
  };

  this.data = web3.debug.traceTransaction(txHash, { timeout: timeout || '1m' });
  
  var hexArray = function(arr) {
    return arr.map(function(x) { return parseInt(x,16); });
  };

  this.state = [];
  if (this.data.structLogs) {
    var prevBp = false;
    for (var i = 0; i < this.data.structLogs.length; i ++) {
      var state = this.data.structLogs[i];
      var hitBp = logger.matchBreakpoint(state.pc);
      if (hitBp && !prevBp) {
         state.location = logger.whereIs(state.pc);
	 state.stack = hexArray(state.stack); // turn 32bytes hex into normal arrays
	 state.memory = hexArray(state.memory); // turn 32bytes hex into normal arrays
         this.state.push(state);
      } 
      prevBp = hitBp;
    }
    if (this.state.length) { this.current = 0; }
  }
  return this;
};


var evm = {
   contract: evmContract,
   breakpoint: evmWatcher, 
   iterator: evmDebugIterator 
};
                             
if (typeof window !== 'undefined') {
    // exporting to web version - just by setting global ...
    window.evmBreakpoints = evm;
} else {
    // exporting for usage in server version
    module.exports  = evm;
}
