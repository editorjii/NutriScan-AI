require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 1. Database Connection & Schema
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 SUCCESS: Database Connected!"))
  .catch((err) => console.log("❌ ERROR: Could not connect:", err));

const mealSchema = new mongoose.Schema({
    foodName: String,
    calories: Number,
    goal : String,
    date: { type: Date, default: Date.now }
});
const Meal = mongoose.model("meal", mealSchema);

// 2. The Scan Route
app.post('/api/scan-food', upload.single('foodImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const userGoal = req.body.userGoal || "General Health";

        // Instructions for the AI
        const instructionText = `Analyze this food image and provide a helpful report. 
        
        At the very end, provide a hidden JSON section EXACTLY like this:
        ---DATA---
        {"foodName": "name of food", "calories": 100}
        ---DATA---

        STRICT OUTPUT FORMAT:
        1. Food Summary: (1 line explaining what it is)
        2. What’s Concerning: (Max 3 points)
        3. Real-Life Impact: (Explain bloating, acne, energy, etc.)
        4. How Risky Is It: (Safe / Okay / Limit / Avoid)
        5. Damage-Control Tip: (One practical tip)
        6. Personal Note: (Supportive closing for goal: ${userGoal})

        RULES:
        - Use emojis!
        - Use Indian food context.
        - Add title at the very end: -anita agarwal`;

        const payload = {
            contents: [{
                parts: [
                    { text: instructionText },
                    { inline_data: { mime_type: req.file.mimetype, data: req.file.buffer.toString("base64") } }
                ]
            }]
        };

        // 🚀 Step 1: Ask the AI for the result
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const resultText = data.candidates[0].content.parts[0].text; // NOW resultText is defined! ✅

            // 🚀 Step 2: Extract the data and Save to MongoDB
            const dataMatch = resultText.match(/---DATA---([\s\S]*?)---DATA---/);
            if (dataMatch) {
                try {
                    const foodData = JSON.parse(dataMatch[1].trim());
                    const newMeal = new Meal({
                        foodName: foodData.foodName,
                        calories: foodData.calories,
                        goal: userGoal
                    });
                    await newMeal.save();
                    console.log("✅ Meal Saved to History!");
                } catch (jsonErr) {
                    console.log("⚠️ Could not parse JSON data, but showing report.");
                }
            }

            // 🚀 Step 3: Send the final report to the app
            const cleanReport = resultText.split('---DATA---')[0].trim();
            res.json({ analysis: cleanReport });
        } else {
            res.status(500).json({ error: "AI could not generate a response." });
        }

    } catch (error) {
        console.error("❌ System Error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});
// This route lets the app "Get" the list of saved meals
app.get('/api/get-history', async (req, res) => {
    try {
        // Fetch the 5 most recent meals
        const history = await Meal.find().sort({ date: -1 }).limit(5);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});
app.listen(5000, () => console.log(`🚀 Server running on port 5000`));