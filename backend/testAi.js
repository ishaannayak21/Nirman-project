import * as aiEngine from './utils/aiEngine.js';

const testCases = [
  "There is a massive pothole in front of my house causing accidents.",
  "Water pipeline is broken and leaking on the main street.",
  "Someone stole my wallet on the street.", // Emergency
  "asdf qwer zxcv", // Spam
  "Electricity wire is broken and live, danger!",
  "Garbage is overflowing from the bins.",
];

async function runTests() {
  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`);
    const result = await aiEngine.analyzeComplaint(text, null, null);
    console.log(JSON.stringify(result, null, 2));
  }
}

runTests();
