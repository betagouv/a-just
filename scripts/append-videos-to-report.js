#!/usr/bin/env node
/*
  Append Cypress videos section to an existing HTML report.

  Usage:
    node scripts/append-videos-to-report.js <htmlFile> <videosDir>
*/

const fs = require('fs');
const path = require('path');

const [,, htmlFile, videosDir] = process.argv;

if (!htmlFile || !videosDir) {
  console.error('Usage: node append-videos-to-report.js <htmlFile> <videosDir>');
  process.exit(1);
}

if (!fs.existsSync(htmlFile)) {
  console.log(`HTML file not found: ${htmlFile}`);
  process.exit(0);
}

if (!fs.existsSync(videosDir)) {
  console.log(`Videos directory not found: ${videosDir}`);
  process.exit(0);
}

// Find all .mp4 files in videos directory
const videos = fs.readdirSync(videosDir)
  .filter(f => f.endsWith('.mp4'))
  .sort();

if (videos.length === 0) {
  console.log('No videos found to append');
  process.exit(0);
}

// Build HTML section
const videoLinks = videos
  .map(v => `<li><a href="../videos/${v}" target="_blank">${v}</a></li>`)
  .join('\n      ');

const videosSection = `
<hr/>
<h2 style="margin-top:24px">Cypress Videos</h2>
<ul>
      ${videoLinks}
</ul>
`;

// Append to HTML file
fs.appendFileSync(htmlFile, videosSection, 'utf8');
console.log(`Appended ${videos.length} video(s) to ${htmlFile}`);
