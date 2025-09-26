// Force mochawesome to run by requiring it directly and calling it manually
const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'test', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Hook into Mocha's runner to force mochawesome
const originalRun = require('mocha/lib/runner').prototype.run;
require('mocha/lib/runner').prototype.run = function(fn) {
  const self = this;
  
  // Force create a basic mochawesome report even if the reporter doesn't engage
  const createFallbackReport = () => {
    const reportData = {
      stats: {
        suites: self.suite.suites.length,
        tests: self.stats.tests || 0,
        passes: self.stats.passes || 0,
        pending: self.stats.pending || 0,
        failures: self.stats.failures || 0,
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        duration: self.stats.duration || 0
      },
      tests: [],
      pending: [],
      failures: [],
      passes: []
    };
    
    const jsonPath = path.join(reportsDir, 'test-results.json');
    const htmlPath = path.join(reportsDir, 'test-results.html');
    
    // Write JSON report
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
    console.log(`[FORCED] Mochawesome JSON report written to: ${jsonPath}`);
    
    // Write basic HTML report
    const html = `
<!DOCTYPE html>
<html>
<head><title>API Test Results</title></head>
<body>
  <h1>API Test Results</h1>
  <p>Tests: ${reportData.stats.tests}</p>
  <p>Passes: ${reportData.stats.passes}</p>
  <p>Failures: ${reportData.stats.failures}</p>
  <p>Generated: ${new Date().toISOString()}</p>
</body>
</html>`;
    
    fs.writeFileSync(htmlPath, html);
    console.log(`[FORCED] Mochawesome HTML report written to: ${htmlPath}`);
  };
  
  return originalRun.call(this, function(failures) {
    // Always create fallback report
    createFallbackReport();
    if (fn) fn(failures);
  });
};

console.log('[FORCE_MOCHAWESOME] Hook installed - will force report generation');
