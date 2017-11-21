// - - - 
var evm = window.evmBreakpoints; // alias for our debugger library

contractCompiler = typeof contractCompiler !== 'undefined' ? contractCompiler : "latest";

function out(x)  { document.getElementById("output").innerHTML += "<div>" + x + "</div>"; }
function status(x) { document.getElementById("output").innerHTML = x; }
function err(x)  { document.getElementById("output").innerHTML += "<div style='color:darkred'>" + x + "</div>"; }
function ensureThat(condition, message) { if (!condition) { throw new Error(message); } }


status("Loading and Compiling Contract...");
document.addEventListener("DOMContentLoaded", function() {
  function runTracer(source, txHash, contractName, lines) {
    // setting up contract and all information about its compiled version
      evm
       .contract({ source: source, compiler: contractCompiler  }) // v0.4.13+commit.fb4cb1a" })
       .on('ready', function(compiled) {
         try{ 
            console.info("Contracts Compiled", compiled);
            out("Contracts compiled: " + Object.keys(compiled.contracts).join(", "));
 	    if (typeof compiled.contracts[contractName] === 'undefined') {
               throw new Error("Contract " + contractName + " is not found in compiled contracts");
            }
           
            // when our version of contract is compiled, 
            // we know source maps and all bytecode / assembly map,
            // then we can set up breakpoints
            // building the function that will be called by tracer - asyncronous
            var json = compiled.contracts[contractName];
            var logger = evm.breakpoint().add({ source, sourceMap: json.srcmapRuntime, lines });
        
            // loading transaction - debugger will iterate through all the cases
            var debug = evm.iterator(web3, txHash, logger);
            out("Tracer running finished, state of " + debug.state.length + " steps saved" );
            // console.info(debug.data);

            // at this point we can just iterate back and forth between breakpoints
            while (!debug.stopped()) {
               var stack = debug.get().stack;
               var dbg = { number: stack[4], iterations: stack[5] };
               out(JSON.stringify(dbg) );
               debug.next();
            }  
         } catch(e) { err(e);  }
      }).on('error', err);
   }

  try {

    // require web3, require solidity browser compiler
    ensureThat(typeof BrowserSolc === 'object', "Solidity compiler is not added");
    ensureThat(typeof web3 === 'object', "Web3 doesn't seem to be initialized");
    web3.version.getNetwork(function(something, version) {
      try {
        ensureThat(parseInt(version, 10) > 10, "web3 should be connected to TestNet for this example. current network version: " + version);
        out("Connected to TestNet id=" + version);

        fetch(contractSourceUrl).then(function(response) {
          return response.text();
        }).then(function(contractSource, a, b) {
         if (contractSource === 'Not Found') throw new Error("Source code was not found");
         out("Downloaded "  + contractSource.length + " bytes of source code");
         try {
           runTracer(contractSource, transactionHash, contractName, lines);
         } catch(e)  {
           err(e.toString());
         }
       }).catch(function(e) {
         err(e.toString());
       });
     } catch (e) { err(e.toString()); }

   });

  } catch (e) { err(e.toString()); }

});