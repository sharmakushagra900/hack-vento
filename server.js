const { WebSocketServer, WebSocket } = require('ws'); // FIXED: Import WebSocket for constants

// 1. Setup WebSocket Server on port 8080
const wss = new WebSocketServer({ port: 8080 });

console.log("------------------------------------------------");
console.log("🚀 UPSIDE DOWN SERVER (Simulation Mode) STARTED");
console.log("   ✅ Status: ONLINE");
console.log("   🚫 AI Key: NOT REQUIRED");
console.log("------------------------------------------------");

wss.on('connection', (ws) => {
    console.log("New client connected!");

    ws.on('message', (message) => {
        try {
            // FIXED: Convert Buffer to string before parsing
            const userPost = JSON.parse(message.toString());
            
            // FIXED: Added backticks for template literal
            console.log(`Received: ${userPost.title}`);

            // A. Broadcast the user's question to everyone
            broadcast(userPost);

            // B. Simulate "AI Thinking" delay
            setTimeout(() => {
                // Check if content exists to avoid crash
                const content = userPost.content || ""; 
                const aiResponse = generateSmartReply(content);
                
                const aiPost = {
                    id: Date.now() + 1,
                    author: "Gemini AI",
                    role: "AI Tutor",
                    title: "Answer to: " + userPost.title,
                    content: aiResponse,
                    likes: 10,
                    replies: 0,
                    time: "Just now",
                    isSolved: true,
                    avatar: "🤖"
                };

                // C. Send the "AI" answer
                broadcast(aiPost);
                
            }, 1500);

        } catch (e) {
            console.error("Error processing message:", e);
        }
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        // FIXED: Use constant instead of magic number '1'
        if (client.readyState === WebSocket.OPEN) { 
            client.send(JSON.stringify(data));
        }
    });
}

// --- 🧠 THE "FAKE BRAIN" ---
function generateSmartReply(text) {
    // Safety check if text is empty
    if (!text) return "Please provide more details.";
    
    const q = text.toLowerCase();

    // 1. PHYSICS
    if (q.includes("action") || q.includes("reaction") || q.includes("newton")) {
        return "Great question! While the forces are equal and opposite, they act on different bodies. That is why they don't cancel out. (Newton's 3rd Law)";
    }
    // 2. THERMODYNAMICS
    if (q.includes("energy") || q.includes("thermo")) {
        return "Energy cannot be created or destroyed, only transformed. Check your system boundaries!";
    }
    // 3. CALCULUS
    if (q.includes("integration") || q.includes("parts") || q.includes("calc")) {
        return "Use the LIATE rule (Logarithmic, Inverse Trig, Algebraic, Trig, Exponential) to pick 'u'.";
    }
    // 4. BIOLOGY
    if (q.includes("dna") || q.includes("replication")) {
        return "The Leading strand is synthesized continuously, while the Lagging strand uses Okazaki fragments.";
    }
    // 5. CHEMISTRY
    if (q.includes("organic") || q.includes("naming")) {
        return "Follow priority: Carboxylic acids > Aldehydes > Ketones > Alcohols.";
    }

    // Default
    return "Interesting problem. Try breaking it down into smaller steps and verifying your initial assumptions.";
}