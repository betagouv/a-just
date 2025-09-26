// Force mochawesome to write before exit
const Mocha = require('mocha');

// Hook into Mocha's reporter done event
const originalRun = Mocha.prototype.run;
Mocha.prototype.run = function(fn) {
  return originalRun.call(this, function(failures) {
    // Give mochawesome time to write files
    setTimeout(() => {
      if (fn) fn(failures);
      process.exit(failures ? 1 : 0);
    }, 1000);
  });
};
