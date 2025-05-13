# 🧾 HSN Code Validation Agent using Dialogflow & Node.js Webhook

This project implements a conversational agent that validates **HSN (Harmonized System of Nomenclature)** codes using Google Dialogflow and a custom Node.js webhook. The agent supports validation, hierarchical breakdown, and friendly, conversational feedback based on a master Excel dataset.

---

## 📐 Architecture Overview

### 👤 Frontend:
- **Google Dialogflow Console**
- Voice or text interface via Google Assistant integration (optional)

### 🧠 Agent Logic (Dialogflow):
- **Intent**: `ValidateHSNCode`
- **Entity**: `@hsn-code` (Custom or fallback to `@sys.number`)
- **Contexts**: Used for follow-ups and storing code state
- **Fulfillment**: Enabled via webhook for dynamic validation

### 🌐 Webhook Backend:
- Built in **Node.js**
- Listens to POST `/webhook` requests
- Parses and validates HSN code(s)
- Uses an in-memory `Map` for fast lookup
- Responds with conversational messages

---

## 📁 Project Structure

.
├── webhook/
│ ├── index.js # Webhook server (main logic)
│ ├── hsnLoader.js # Excel loader and HSN Map builder
│ ├── HSN_Master_Data.xlsx # Master data source (HSN codes & descriptions)
│ ├── package.json
│ └── README.md # This file

yaml
Copy
Edit

---

## ⚙️ Setup & Installation

### 1. Clone the repo
bash
git clone https://github.com/your-username/hsn-validation-agent.git
cd hsn-validation-agent/webhook
2. Install dependencies
bash
Copy
Edit
npm install
3. Add your Excel file
Ensure your HSN_Master_Data.xlsx file is placed in the root of the webhook/ folder. The Excel sheet must contain a column named HSNCode and Description.

4. Start the server
bash
Copy
Edit
node index.js
Server will run at http://localhost:3000/webhook.

🧮 Data Handling Strategy
File: HSN_Master_Data.xlsx
Loaded on server startup using the xlsx npm module

Stored in an in-memory Map for fast access

Keys: '01', '0101', '01011010', etc.

Supports validation for both full codes and parent categories

✅ Validation Rules
1. Format Validation
Accepts only 2 to 8 digit numeric strings

Ignores malformed or non-numeric tokens

2. Existence Validation
Checks whether the HSN code exists in the master dataset

Case-insensitive and zero-padded if necessary

3. Hierarchical Validation
For example, input: 01011010

Checks:

01011010 ✅

010110 ✅

0101 ✅

01 ✅

Each level adds context to the code structure.

💬 Sample Responses
✅ Valid Code
✅ HSN Code 01011010 is valid.
📘 01: Live animals
📘 0101: Horses, asses, mules
📘 010110: Purebred breeding animals
📘 01011010: Male breeding horses
💬 Want to check another one?

❌ Invalid Code
❌ HSN Code 99999999 not found in the master data.
💬 Want to try a different one?

⚠️ Malformed Input
⚠️ Please provide a valid HSN code between 2 and 8 digits.


👨‍💻 Developer Notes
Dialogflow Intent Setup
Intent: ValidateHSNCode

Entity: @hsn-code (can use @sys.any for fuzzy match)

Enable webhook fulfillment

Optional follow-up: ValidateHSNCode - fallback for retries

Webhook JSON Structure
Make sure your webhook returns:

json
Copy
Edit
{
  "prompt": {
    "firstSimple": {
      "speech": "Your response...",
      "text": "Your response..."
    }
  }
}


🧪 Testing
Test via Dialogflow console or Assistant Simulator

You can also use curl:

bash
Copy
Edit
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "queryResult": {
      "queryText": "Check HSN 01011010",
      "parameters": {
        "hsn-code": 1011010
      },
      "intent": {
        "displayName": "ValidateHSNCode"
      }
    }
  }'


📦 Dependencies
express

xlsx

body-parser

🙋‍♀️ Author
Created by Tharsan P for HSN validation demo using Google Dialogflow, Webhook Fulfillment, and Excel-based master data.

