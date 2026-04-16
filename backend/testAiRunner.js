import { analyzeComplaint } from './utils/aiEngine.js';

const testCases = [
    { 
      name: "1. Road Damage (High Priority)", 
      text: "main street has a huge broken crack causing daily traffic", 
      expCat: "Road Damage", 
      expPri: "High" 
    },
    { 
      name: "2. Water Issue (Hinglish/Regional)", 
      text: "paani leak ho raha hai from the pipeline", 
      expCat: "Water Issue", 
      expPri: "Low" 
    },
    { 
      name: "3. Sanitation & Water (Multi-Issue)", 
      text: "garbage everywhere and pipe leakage is a problem", 
      expCat: ["Water Issue", "Sanitation"], 
      expPri: "Low" 
    },
    { 
      name: "4. Electricity (Auto-High Priority Edge Case)", 
      text: "wire fallen on the pole", 
      expCat: "Electricity", 
      expPri: "High" 
    },
    { 
      name: "5. Public Safety (Auto-Medium Boundary Case)", 
      text: "manhole is open in the pavement", 
      expCat: "Public Safety", 
      expPri: "Medium" 
    },
    { 
      name: "6. Emergency (Blocker via Gun/Shooting)", 
      text: "someone is shooting guns and killing", 
      expCat: "Emergency", 
      expPri: "High" 
    },
    { 
      name: "7. Pure Spam", 
      text: "12345 54321 asdfgh", 
      expCat: "Invalid", 
      expPri: "N/A" 
    },
    { 
      name: "8. Too Short (Vague)", 
      text: "here problem", 
      expCat: "Unclear", 
      expPri: "N/A" 
    },
    { 
      name: "9. Ambiguous Context", 
      text: "i feel this is a very bad situation", 
      expCat: "Unclear", 
      expPri: "Low" 
    }
];

async function runTests() {
    let passed = 0;
    let total = testCases.length;
    console.log("========== 🧪 AI ENGINE DIAGNOSTICS & TEST RESULTS ==========\n");

    for (let tc of testCases) {
        const result = await analyzeComplaint(tc.text, 20.5, 78.5, []);
        
        let catMatch = false;
        const expArr = Array.isArray(tc.expCat) ? tc.expCat : [tc.expCat];
        const resArr = Array.isArray(result.category) ? result.category : [result.category];
        catMatch = expArr.some(c => resArr.includes(c));

        let priMatch = (result.priority === tc.expPri) || tc.expPri === "N/A" || result.priority === undefined;
        if (tc.expCat === "Invalid" && result.category === "Invalid") priMatch = true;
        
        const isPass = catMatch && priMatch;
        if (isPass) passed++;

        console.log(`[Test]     ${tc.name}`);
        console.log(`[Input]    "${tc.text}"`);
        console.log(`[Expected] Category=${JSON.stringify(tc.expCat)}, Priority=${tc.expPri}`);
        console.log(`[Actual]   Category=${JSON.stringify(result.category)}, Priority=${result.priority || "None"}`);
        console.log(`[Status]   ${isPass ? "✅ PASS" : "❌ FAIL"}`);
        console.log("--------------------------------------------------");
    }
    
    console.log(`[Test]     10. Heavy Duplicate Context (Haversine & Jaccard Merge)`);
    const mockDB = [{ id: "DB-001", description: "road has huge pothole causing traffic", latitude: 20.5, longitude: 78.5 }];
    const dupRes = await analyzeComplaint("huge pothole on the road traffic", 20.5, 78.5001, mockDB);
    let dupPass = dupRes.duplicate === "possible";
    if(dupPass) passed++;
    total++;
    console.log(`[Input]    "huge pothole on the road traffic"`);
    console.log(`[Expected] duplicate="possible"`);
    console.log(`[Actual]   isDuplicate=${dupRes.isDuplicate}, duplicate=${dupRes.duplicate} (Similarity: ${dupRes.similarityScore})`);
    console.log(`[Status]   ${dupPass ? "✅ PASS" : "❌ FAIL"}`);
    console.log("=============================================================");

    console.log(`\n🎯 OVERALL LOCAL ACCURACY: ${((passed/total)*100).toFixed(2)}% (${passed}/${total} test cases passed)`);
}

runTests();
