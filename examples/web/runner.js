var output = document.getElementById("output");
   
function runner(standardJson, address, txHash, lines) {

   // setting up contract and all information about its compiled version
   var contract = evmBreakpoints.contract({ address: address, standardJson: standardJson });
   // building the function that will be called by tracer
   var logger = evmBreakpoints.breakpoint().add({ contract, lines }).build();

   // loading all transaction - debugger will iterate through all the cases
   var debug = evmBreakpoints.iterator(web3, txHash, logger);
   // at this point we can just iterate back and forth between breakpoints
   while (!debug.stopped()) {
     output.innerText += JSON.stringify(debug.get()) + "\n";
     debug.next();
   }  
}

try {
   // for web verion we need to have 
   // compiled version of contract into standard JSON (library uses binary code and source map),
   // contract address and transaction hash - to debug exactly the transaction
   var standardJson = JSON.parse( document.getElementById('standardJson').innerHTML );
   runner(standardJson, "0xaddress", "0xtransaction hash", [23, 24, 25]);
} catch (e) {
   output.innerHTML = e.toString();
}