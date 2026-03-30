require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

// CORS
app.use(cors({
    origin: ["http://localhost:5173", "https://dipankar049-portfolio.vercel.app"]
}));

app.use(cors());
app.use(express.json());
const limiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    max: 200,
    message: {
        reply: "Daily limit reached 😅 Please come back tomorrow!"
    }
});

app.use("/chat", limiter);

const data = require("./data/data");
const getPrompt = require("./prompt/prompt");

// Initialize Gemini
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
    const prompt = getPrompt(data, userMessage);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        res.json({ reply: response.text });

    } catch (error) {
        console.log("Primary model failed, trying fallback...");

        try {
            const fallback = await ai.models.generateContent({
                model: "gemini-2.5-flash", // fallback
                contents: prompt
            });

            res.json({ reply: fallback.text });

        } catch (err) {
            res.json({
                reply: "I'm a bit busy right now 😅 Please try again in a moment."
            });
        }
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});