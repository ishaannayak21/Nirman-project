import * as aiEngine from './utils/aiEngine.js';

const allTestCases = [
  // --- ROAD DAMAGE ---
  { text: "Huge pothole on the main street causing traffic.", expectedCategory: "Road Damage", expectedPriority: "High" },
  { text: "Street pavement is cracked and very severe.", expectedCategory: "Road Damage", expectedPriority: "High" },
  { text: "Small crack on the road.", expectedCategory: "Road Damage", expectedPriority: "Low" },
  
  // --- WATER ISSUE ---
  { text: "The main water supply pipeline is leaking on the street.", expectedCategory: "Water Issue", expectedPriority: "Medium" },
  { text: "Drinking water pipe is broken heavily, huge leak.", expectedCategory: "Water Issue", expectedPriority: "High" },
  { text: "Slight leak in the drain pipe.", expectedCategory: "Water Issue", expectedPriority: "Medium" }, // "leak" gives medium 
  
  // --- SANITATION ---
  { text: "Garbage overflow in the dustbin.", expectedCategory: "Sanitation", expectedPriority: "High" }, // "overflow" -> High
  { text: "Bad smell and dirt from waste thrown on street.", expectedCategory: "Sanitation", expectedPriority: "Low" },
  { text: "Sewer drainage is blocked, sweeping needed daily.", expectedCategory: "Sanitation", expectedPriority: "Medium" }, // "daily" -> Medium
  
  // --- ELECTRICITY ---
  { text: "Live electricity wire broken and sparking, danger!", expectedCategory: "Electricity", expectedPriority: "High" }, // "live", "danger" -> High
  { text: "Power transformer on pole is completely blown.", expectedCategory: "Electricity", expectedPriority: "Low" },
  { text: "Street light is not working near school.", expectedCategory: "Electricity", expectedPriority: "Medium" }, // "school" -> Medium
  
  // --- PUBLIC SAFETY ---
  { text: "Open manhole in the middle of the road, very dangerous.", expectedCategory: "Public Safety", expectedPriority: "High" }, // "dangerous" -> High
  { text: "A broken branch is hanging dangerously over the pavement.", expectedCategory: "Public Safety", expectedPriority: "High" },
  
  // --- EMERGENCY (Redirects) ---
  { text: "There is blood on the street from a fatal accident.", expectedCategory: "Emergency", expectedPriority: "High" },
  { text: "Someone got shot with a gun and there is a fire.", expectedCategory: "Emergency", expectedPriority: "High" },
  { text: "Thief stole my bag while walking.", expectedCategory: "Emergency", expectedPriority: "High" },
  
  // --- INVALID/SPAM/UNCLEAR ---
  { text: "12345 67890", expectedCategory: "Invalid", expectedPriority: null },
  { text: "This is a random text.", expectedCategory: "Unclear", expectedPriority: "Low" },
  { text: "qwer asdf", expectedCategory: "Invalid", expectedPriority: null }
];

async function runAccuracyTest() {
  let passed = 0;
  console.log("=== COMPREHENSIVE AI ENGINE TEST ===\n");
  
  for (const tc of allTestCases) {
    const result = await aiEngine.analyzeComplaint(tc.text, null, null);
    
    // Determine the actual category (handling multiIssue)
    const actualCat = result.category === "Emergency" || result.category === "Invalid" || result.category === "Unclear" 
                       ? result.category 
                       : result.primaryCategory || result.category;
                       
    const actualPriority = result.priority || null;
    
    // Check if it passes expectations
    const isCatPass = actualCat === tc.expectedCategory;
    
    // If we expect Priority null we ignore it. Otherwise checking Priority
    const isPriPass = tc.expectedPriority === null || actualPriority === tc.expectedPriority;
    
    const isPass = isCatPass && isPriPass;
    if (isPass) {
        passed++;
        console.log(`[PASS] "${tc.text}" -> Cat: ${actualCat}, Pri: ${actualPriority}`);
    } else {
        console.log(`[FAIL] "${tc.text}"`);
        console.log(`       Expected: Cat=${tc.expectedCategory}, Pri=${tc.expectedPriority}`);
        console.log(`       Got:      Cat=${actualCat}, Pri=${actualPriority}`);
    }
  }

  const accuracy = (passed / allTestCases.length) * 100;
  console.log(`\n====================================`);
  console.log(`TOTAL TESTS: ${allTestCases.length}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`ACCURACY:    ${accuracy.toFixed(2)}%`);
  console.log(`====================================\n`);
}

runAccuracyTest().catch(console.error);
