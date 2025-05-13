const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');

const app = express();
app.use(bodyParser.json());





// Load and parse Excel
const workbook = XLSX.readFile('HSN_Master_Data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

console.log("🛠 Raw Keys:", Object.keys(rawData[0] || {})); // Debug header keys

// Normalize and index data by HSNCode
// Normalize headers manually
const hsnMap = new Map();

rawData.forEach(row => {
  // Normalize keys in case they have hidden characters
  const normalizedRow = {};
  for (const key in row) {
    const cleanKey = key.trim().replace(/[\r\n]+/g, '');
    normalizedRow[cleanKey] = row[key];
  }

  const rawCode = String(normalizedRow.HSNCode || '').replace(/\D/g, '');
  const description = normalizedRow.Description;

  if (rawCode) {
    hsnMap.set(rawCode, description || '');
  }
});

console.log('✅ HSN data indexed:', Array.from(hsnMap.entries()).slice(0, 5));
console.log('📦 Map keys:', Array.from(hsnMap.keys()).slice(0, 10));


const axios = require('axios');

// ⚡ Gemini Flash simulated call
async function handleSmallTalk(userInput) {
  const prompt = `You are a helpful assistant. User said: "${userInput}"`;
  
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "🤖 I didn't quite get that.";
    return reply;
  } catch (err) {
    console.error('🔥 Gemini Flash Error:', err.message);
    return "⚠️ Sorry, I couldn't understand that right now.";
  }
}



app.post('/webhook', (req, res) => {
  console.log('📥 Full Request:', JSON.stringify(req.body, null, 2));

  // Determine platform
  const isDialogflow = !!req.body.queryResult;
  const queryText = req.body?.queryResult?.queryText || '';
  const rawInputs = req.body?.inputs?.[0]?.rawInputs;
  const userInput = rawInputs?.[0]?.query || queryText || '';

  console.log('🔍 User Input:', userInput);

  // Extract HSN codes (prioritize original value to preserve leading zeroes)
  const matches = [];

  const originalParam = req.body?.queryResult?.parameters?.['hsn-code.original'];
  if (originalParam) {
    matches.push(originalParam);
  } else {
    const extracted = userInput.match(/\b\d{2,8}\b/g);
    if (extracted) matches.push(...extracted);
  }

  if (matches.length === 0) {
    const msg = `⚠️ Please provide a valid HSN code between 2 and 8 digits.`;
    return handleSmallTalk(userInput).then(geminiReply => {
    return isDialogflow
      ? res.json({ fulfillmentText: geminiReply })
      : res.json({ prompt: { firstSimple: { speech: geminiReply, text: geminiReply } } });
    });
  }

  const responses = [];

  matches.forEach(code => {
    const cleaned = code.replace(/\D/g, '');
    const hierarchy = [];

    for (let len = cleaned.length; len >= 2; len -= 2) {
      const part = cleaned.substring(0, len);
      const desc = hsnMap.get(part);
      if (desc) {
        hierarchy.push(`📘 ${part}: ${desc}`);
      }
    }

    if (hierarchy.length > 0) {
      responses.push(`✅ HSN Code ${cleaned} is valid.\n${hierarchy.join('\n')}`);
    } else {
      responses.push(`❌ HSN Code ${cleaned} not found in the master data.`);
    }
  });

  const finalResponse = responses.join('\n\n') + '\n\n💬 Want to check another one?';

  // Respond based on source
  if (isDialogflow) {
    return res.json({ fulfillmentText: finalResponse });
  } else {
    return res.json({
      prompt: {
        firstSimple: {
          speech: finalResponse,
          text: finalResponse
        }
      }
    });
  }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
