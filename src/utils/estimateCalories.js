export const estimateCalories = async (mealDescription) => {
    const apiKey = localStorage.getItem('openai_key');
    if (!apiKey) return { total: 0, error: "No API key provided." };

    const prompt = `
  You are a helpful nutritionist. Estimate calories for the following meal description.
  
  Meal: "${mealDescription}"
  
  Respond in this format:
  Food 1: xxx kcal
  Food 2: xxx kcal
  ...
  Total: xxx kcal
  `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const match = content.match(/total:\s*(\d+)\s*kcal/i);
    const total = match ? parseInt(match[1]) : 0;

    return { total, breakdown: content };
};
