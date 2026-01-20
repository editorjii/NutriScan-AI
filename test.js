const dotenv = require('dotenv');
dotenv.config();

async function checkMyModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("🔍 Scanning your Google AI Studio project...");
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.models) {
            console.log("✅ SUCCESS! Here are your available model names:");
            data.models.forEach(m => {
                // We are looking for the ones that support 'generateContent'
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`👉 ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("❌ Error from Google:", data.error.message);
        }
    } catch (err) {
        console.log("❌ Connection Error:", err.message);
    }
}

checkMyModels();