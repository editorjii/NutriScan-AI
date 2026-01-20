const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 SUCCESS: Database Connected!"))
  .catch((err) => console.log("❌ ERROR: Database Connection Failed:", err));

  app.get('/api/history', async (req, res) => {
    try {
        // Gets the last 10 meals, newest first
        const meals = await Meal.find().sort({ date: -1 }).limit(10);
        res.json(meals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SCHEMAS
const mealSchema = new mongoose.Schema({
    foodName: String,
    goal: String,
    date: { type: Date, default: Date.now }
});
const Meal = mongoose.model("meal", mealSchema);

const feedbackSchema = new mongoose.Schema({
    note: String,
    date: { type: Date, default: Date.now }
});
const Feedback = mongoose.model("feedback", feedbackSchema);

// 1. SCAN & COMPARE ROUTE
app.post('/api/scan-food', upload.array('foodImage', 2), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No image uploaded" });

        const userGoal = req.body.userGoal || "General Health";
        const isCompare = req.files.length > 1;
        const apiKey = process.env.GEMINI_API_KEY;

        const instructionText = `
        Act as a nutrition coach. User Focus: ${userGoal}.
        ${isCompare ? "COMPARE these two foods and pick the 'Lesser Evil'." : "Analyze this food."}
        Use Simple English + 1-2 Hindi words. Keep it sarcastic but healing.
       STRICT OUTPUT FORMAT (FOLLOW THIS ORDER):

1. Food Summary: (1 line explaining the food in simple words)
2. What’s Concerning: (Max 3 brief bullet points in plain language)
3. Real-Life Impact: (Max 2 short sentences on bloating, acne, or energy crashes)
4. Risk Level: (Choose ONE: 🟢 Safe for regular eating, 🟡 Okay occasionally, 🟠 Limit it, 🔴 Avoid frequent eating)
5. Damage-Control Tip: (One practical, 1-line tip like walking or adding fiber)
6. Just saying... 😉: (Provide a short, sarcastic, funny note here. Max 20 words.)

STRICT RULES:
// Add this inside your instructionText string in server.js
"STRICT: Use a simple hyphen (-) for bullet points, NEVER use asterisks (*)."
- HUMOR GUIDELINE: Keep sarcasm "Light & Sweet." Joke about the food/situation ONLY. NEVER about the user's body, weight, or character. NEVER shame the user.
- LANGUAGE & STYLE: Use Simple English. Mix in 1-2 Hindi words max (like 'Ajeeb' or 'Yaar'). 
- EMOJI CONTROL: Use 1-3 emojis per response. No emoji spam.
- No medical advice, no numbers/math, and no "over-talking." Keep it snappy!
        `;

        const imageParts = req.files.map(file => ({
            inline_data: { mime_type: file.mimetype, data: file.buffer.toString("base64") }
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({ contents: [{ parts: [{ text: instructionText }, ...imageParts] }] })
        });

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        const cleanedText = resultText.replace(/\*/g, '');
        console.log("✅ [Step 3] AI responded and text cleaned!");
        res.json({ analysis: cleanedText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. FEEDBACK ROUTE
app.post('/api/feedback', async (req, res) => {
    try {
        const newNote = new Feedback({ note: req.body.note });
        await newNote.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. STATS ROUTE (To make the "12" real)
app.get('/api/stats', async (req, res) => {
    const count = await Meal.countDocuments();
    res.json({ totalScans: count });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
app.post('/api/save-meal', async (req, res) => {
    try {
        const newMeal = new Meal({ 
            foodName: req.body.foodName, 
            goal: req.body.goal 
        });
        await newMeal.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});