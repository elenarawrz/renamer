const fs = require('fs');
var md = require("ffmetadata");

const testFolder = '../2002 Songs About Jane';

var files = fs.readdirSync(testFolder);
files.forEach(function(file) {
  console.log(file);
});
