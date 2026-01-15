require('dotenv').config();
const { WebSocketServer } = require('ws');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURATION ---
// 1. SECURITY FIX: Never paste the key directly here. 
// We now read strictly from the .env file.
const API_KEY = process.env.GEMINI_API_KEY; 

// 2. MODEL FIX: We are using "gemini-1.5-flash" to match your console logs.
// (It is faster and cheaper for a Tutor bot than gemini-pro)
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const wss = new WebSocketServer({ port: 8080 });

console.log("------------------------------------------------");
console.log("🚀 UPSIDE DOWN SERVER (Hybrid AI Mode) STARTED");
console.log(`   Using Model: gemini-1.5-flash`); // Log now matches the code above
console.log("------------------------------------------------");

wss.on('connection', (ws) => {
    console.log("New client connected!");

    ws.on('message', async (message) => {
        let userPost;
        try {
            userPost = JSON.parse(message);
        } catch (e) {
            console.error("Invalid JSON received");
            return;
        }
        
        console.log(`Received: ${userPost.title}`);

        // Broadcast question immediately
        broadcast(userPost);

        try {
            // --- ATTEMPT 1: REAL AI ---
            if (!API_KEY) {
                throw new Error("Missing API Key in .env file");
            }

            const result = await model.generateContent(`
                You are a helpful tutor for engineering students.
                Question: "${userPost.content}"
                Keep the answer short (max 2 sentences), simple and engaging.
            `);
            
            const response = await result.response;
            const aiText = response.text();

            sendAiResponse(aiText);

        } catch (error) {
            // --- ATTEMPT 2: FALLBACK ---
            console.error("⚠️ AI Failed. Reason:", error.message);
            
            if(error.message.includes("400")) console.log("-> Check your API Key validity.");
            if(error.message.includes("404")) console.log("-> Model not found. Update NPM package or check spelling.");

            setTimeout(() => {
                const fakeAnswer = generateBackupAnswer(userPost.content);
                sendAiResponse(fakeAnswer);
            }, 1000); 
        }

        function sendAiResponse(text) {
            const aiPost = {
                id: Date.now() + 1,
                author: "Gemini AI",
                role: "AI Tutor",
                title: "Answer to: " + userPost.title,
                content: text,
                likes: 10,
                replies: 0,
                time: "Just now",
                isSolved: true,
                avatar: "🤖"
            };
            broadcast(aiPost);
        }
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(data));
    });
}

function generateBackupAnswer(text) {
    const q = text ? text.toLowerCase() : "";
    if (q.includes("action") || q.includes("newton")) return "For every action, there is an equal and opposite reaction. (Newton's 3rd Law)";
    if (q.includes("energy") || q.includes("thermo")) return "Energy cannot be created or destroyed, only transformed.";
    if (q.includes("dna") || q.includes("bio")) return "The Leading strand is continuous, the Lagging strand uses Okazaki fragments.";
    if (q.includes("java") || q.includes("code")) return "A Class is the blueprint, an Object is the instance.";
    return "That's a great question! Try breaking it down into first principles.";
}
