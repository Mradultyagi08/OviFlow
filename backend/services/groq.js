function assertGroqConfigured() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("Groq API key is not configured");
    }
}

function getGroqConfig() {
    return {
        apiBase: process.env.GROQ_API_BASE || "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
}

async function groqChatCompletion(messages, options = {}) {
    assertGroqConfigured();
    const { apiBase, model } = getGroqConfig();

    const response = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.4,
            max_tokens: options.max_tokens ?? 350,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.error?.message || data?.message || "Groq request failed";
        throw new Error(message);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Groq returned an empty response");
    }

    return {
        content,
        raw: data,
        model,
    };
}

export { getGroqConfig, groqChatCompletion };
