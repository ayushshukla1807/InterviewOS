const fs = require('fs');
const content = fs.readFileSync('app/session/page.tsx', 'utf8');

// I will extract the "Floating Draggable Candidate Camera Card" block.
const startIndex = content.indexOf('{/* Floating Draggable Candidate Camera Card */}');
const endIndex = content.indexOf('{/* Global Voice Controls */}');
if (startIndex > -1 && endIndex > -1) {
    console.log(content.substring(startIndex, endIndex));
} else {
    console.log('Not found');
}
