var solc = require("solc");
var fs = require("fs");
var source = fs.readFileSync("./TokenStore.sol").toString();

try {
    solc.loadRemoteVersion( "v0.4.13+commit.fb4cb1a" || process.argv[2], function(err, solcCustom) {
      if (err) {
        // An error was encountered, display and quit
        console.log("ERROR", err);
      } else {
        var json = solcCustom.compile(source, 1);
        fs.writeFileSync( "./TokenStore.min.json", JSON.stringify(json) );
        fs.writeFileSync( "./TokenStore.json", JSON.stringify(json, null, 2));
      }
    });
} catch (e) {
    console.log("Remote load exception", e);
}
