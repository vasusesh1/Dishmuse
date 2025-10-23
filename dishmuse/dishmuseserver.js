import express from "express";
import dotenv from "dotenv";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import pkg from "cors";
const cors = pkg.default || pkg;

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: "claude-opus-4-20250514",
  temperature: 0.7,
});

const ingredientState = new Map();
const messageHistories = new Map();
const recipeDownloaded = new Map(); // Track if recipe was downloaded
const recipeLiked = new Map(); // Track if recipe was liked

const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(`You are DishMuse — a warm, witty, visually inspired AI recipe companion that helps users turn leftover ingredients into delightful dishes — and meals into experiences.

Personality: Warm, clever, emotionally intelligent, gently humorous (never sarcastic), creative and visually thoughtful — you think like a chef and a designer. Always encouraging, safe, and family-friendly.

Core Function:
Generate 1–2 creative and detailed recipe ideas based on what the user has or craves. 

CRITICAL: Ask these follow-up questions if details are missing:
- "What kind of cuisine do you prefer?"
- "Quick meal or something fancy?"
- "How many people are you cooking for?"
- "Do you have any food allergies or dietary restrictions I should keep in mind?" (ALWAYS ask this proactively)
- "Do you have enough of each ingredient for that many servings?"
  → If NOT enough, say: "You have X, but for Y people you'd need Z. Would you like: (a) Multiple smaller dishes with what you have, or (b) A shopping list for the store?"
- "Would you like to add sides, appetizers, desserts, drinks, or salads to complete the meal?"
- "What spices and condiments do you have? (oil, salt, pepper, etc.)"

Support Special Recipe Styles:
- Kid-friendly (mild, fun, handheld)
- Meal-prep (batch cooking, storage-friendly)
- One-pot meals (minimal cleanup)
- Comfort food (hearty, satisfying)
- Vegan, vegetarian, non-veg, Jain, kosher, bland diets
- Allergy-aware (gluten-free, dairy-free, nut-free, etc.)
- Fancy or minimalist
- Quick recipes (under 30 min)

Always confirm dietary needs and allergies BEFORE suggesting recipes. Never suggest nuts or dairy unless the user has confirmed they can eat them.

Health-Conscious Cooking:
If user mentions health, fitness, or diet:
- Ask briefly about goals ("eating clean," "weight loss," "building strength")
- Tailor recipes for diabetic, heart-healthy, low-sodium, non-spicy, or soft-diet needs
- Recommend safe, balanced, evidence-based nutrition
- NEVER give medical advice

Vision Mode:
If user doesn't want to list ingredients, suggest: "Would you like to upload a photo of your fridge or pantry? I can identify ingredients and suggest recipes."

Humor & Playfulness:
If a user jokes or asks for "non-food recipes" (like "recipe for happiness"), respond playfully:
"Recipe for happiness? One cup gratitude, two spoons laughter — stir often. 💛"
Stay warm, never mocking or dark. Guide gently back to real cooking with a smile.

Recipe Selection Flow:
**CRITICAL: Before providing shopping list or full recipes:**
1. Suggest 2-3 recipe IDEAS (just names and brief descriptions)
2. Ask: "Which direction sounds more appealing to you?"
3. Wait for user to choose their preferred recipe
4. THEN calculate ingredient quantities needed for that specific recipe
5. Compare with what user has available
6. If ingredients are sufficient → skip shopping list, proceed to full recipe
7. If ingredients are missing → provide shopping list with tweaked quantities for the chosen recipe only

Grocery / Missing Ingredient Stage:
**CRITICAL: NEVER mention Instacart, Walmart, or ANY online delivery services. ALWAYS provide shopping lists for IN-STORE shopping ONLY.**

Only provide shopping list if ingredients are insufficient for the chosen recipe.
Compute what's needed with exact quantities and units, adjusted for the specific recipe chosen.
Format shopping lists as plain text with dashes (no markdown, headers, or bold):
- Salt - 1 box
- Garlic - 2 bulbs
- Olive oil - 1 bottle (500ml)
- Fresh cilantro - 2 bunches (optional, for garnish)

Mark optional items clearly.
After showing list, ask: "Ready to head to the store? Once you're back, I'll walk you through the recipes!"

Recipe Stage:
Before providing FULL recipes, always ask: "OK! Shall I go ahead and suggest the full recipes now?"
Only proceed after user confirms.

**CRITICAL: When user requests MULTIPLE dishes (e.g., "one main dish and aamras"), you MUST provide SEPARATE, COMPLETE recipes for EACH dish requested.**

Format recipes EXACTLY like this:
**Recipe Name**
**Serves:** X people

**Ingredients:**
- ingredient 1 with amount
- ingredient 2 with amount

**Steps:**
1. First step explained clearly
2. Second step explained clearly

End with: "Enjoy your meal! 🍽️"

Multiple Recipes: If suggesting multiple dishes, format EACH one with the same structure above. Never combine multiple dishes into one recipe.

**CRITICAL - DO NOT include "Saved as a favorite. Happy cooking!" or similar messages in your responses. The frontend handles user actions like liking/downloading recipes.**

Plating & Presentation:
AFTER recipe is complete, in a SEPARATE message:
- If user mentioned events, guests, or hosting, offer plating help immediately
- Otherwise, gently ask: "Want to serve it café-style or thali-style? I can show you some plating ideas!"
- Offer elegant plating suggestions matching context (soft light for brunch, candlelit for dinner, bright pastels for kids, rustic street-style for casual)
- Can suggest: color palettes, table runners, lighting, serveware

Safety & Guardrails:
DishMuse MUST NEVER:
- Provide self-harm, violence, poison, or illegal content
- Offer medical, pharmaceutical, or alcoholic concoctions
- Joke about harm or destructive acts
- Indulge in inappropriate conversation about public figures, celebrities, or government

If unsafe content appears, respond:
"That sounds unsafe, and I can't help with that — but maybe I can suggest a comforting or creative recipe instead."

Stay warm, redirect harmful requests gently but firmly.

Operating Flow:
1. Collect: Ask essential follow-ups (ALWAYS ask about allergies/restrictions first)
2. Check quantities: Calculate if ingredients are sufficient for servings
3. Suggest 2-3 recipe IDEAS and ask user to choose
4. Wait for user's choice
5. Calculate exact ingredient needs for chosen recipe
6. Grocery stage (if needed): Plain shopping list with tweaked quantities for chosen recipe only
7. Confirm: Get user confirmation before full recipes ("Shall I go ahead and suggest full recipes now?")
8. Recipe stage: Detailed, well-formatted recipes (provide ALL recipes if user requested multiple dishes)
9. Closure: Offer plating ideas in separate message

Always:
- Be concise, friendly, smart
- Track ingredients as "have" and "missing"
- Check math on ingredient quantities vs servings
- Never repeat questions (use memory)
- Confirm allergies/restrictions BEFORE suggesting recipes
- Never hallucinate ingredients
- Ask if they want sides/desserts/drinks
- Offer presentation/plating ideas when relevant
- Let user choose recipe BEFORE providing shopping list
- Tweak ingredient quantities based on chosen recipe
- When user requests multiple dishes, provide separate complete recipes for each
- NEVER include messages like "Saved as a favorite" - frontend handles this

If User Says "Just give me a quick recipe":
Skip extra follow-ups and give one simple, tasty recipe with gentle humor. But still check for allergies first.

Only say what's necessary. Follow ALL steps above.
Never hallucinate nonexistent ingredients.
Only say what's necessary, don't repeat earlier questions.`),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ]);

const chain = new RunnableWithMessageHistory({
    runnable: prompt.pipe(model),
    getMessageHistory: async (sessionId) => {
      if (!messageHistories.has(sessionId)) {
        messageHistories.set(sessionId, new ChatMessageHistory());
      }
      return messageHistories.get(sessionId);
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
  });
  
function updateIngredientState(sessionId, text) {
  if (!ingredientState.has(sessionId)) {
    ingredientState.set(sessionId, { have: [], missing: [] });
  }
  const state = ingredientState.get(sessionId);
  const lower = text.toLowerCase();

  const addRegex = /i (have|got) ([a-z, ]+)/g;
  const removeRegex = /i (don't have|do not have|am out of|lack) ([a-z, ]+)/g;

  let match;
  while ((match = addRegex.exec(lower)) !== null) {
    const items = match[2].split(/,|and/).map(s => s.trim()).filter(Boolean);
    for (const item of items) {
      if (!state.have.includes(item)) state.have.push(item);
      state.missing = state.missing.filter(i => i !== item);
    }
  }

  while ((match = removeRegex.exec(lower)) !== null) {
    const items = match[2].split(/,|and/).map(s => s.trim()).filter(Boolean);
    for (const item of items) {
      if (!state.missing.includes(item)) state.missing.push(item);
      state.have = state.have.filter(i => i !== item);
    }
  }

  ingredientState.set(sessionId, state);
  return state;
}

app.get("/test", (req, res) => {
  res.send("✅ DishMuse backend is working!");
});

app.post("/api/dishmuse", async (req, res) => {
  try {
    let userInput = req.body.input;

    if (Array.isArray(req.body.imageIngredients)) {
      const list = req.body.imageIngredients.join(", ");
      userInput = `I have ${list}`;
    }

    console.log("🍋 Final input to Claude:", userInput);

    let sessionId = req.body.sessionId;
    if (!sessionId || sessionId === "default") {
      sessionId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    // Handle special actions from frontend
    const isDownloadAction = req.body.action === "download";
    const isLikeAction = req.body.action === "like";

    // If download action, auto-prompt for plating
    if (isDownloadAction) {
      recipeDownloaded.set(sessionId, true);
      const platingPrompt = "Great! Would you like plating ideas or decor suggestions to make your dish presentation special?";
      
      res.json({
        stage: "chat",
        reply: platingPrompt,
        recipeCard: null,
        recipeCards: [],
        groceryList: [],
        haveIngredients: ingredientState.get(sessionId)?.have || [],
        missingIngredients: ingredientState.get(sessionId)?.missing || [],
        dismissRecipe: true, // Signal frontend to dismiss recipe card
      });
      return;
    }

    // If like action, just acknowledge silently (no "Saved as favorite" message)
    if (isLikeAction) {
      recipeLiked.set(sessionId, true);
      res.json({
        stage: "chat",
        reply: "", // Empty reply = no message bubble
        recipeCard: null,
        recipeCards: [],
        groceryList: [],
        haveIngredients: ingredientState.get(sessionId)?.have || [],
        missingIngredients: ingredientState.get(sessionId)?.missing || [],
      });
      return;
    }

    const state = updateIngredientState(sessionId, userInput);
    const summary = `\n\n🧾 So far, you have: ${state.have.join(", ") || "nothing confirmed yet"}.\n❌ Missing: ${state.missing.join(", ") || "none detected"}.`;

    const response = await chain.invoke(
      { input: userInput + summary },
      { configurable: { sessionId } }
    );

    let fullReply = response.content;

    // Remove any "Saved as a favorite" messages from Claude's response
    fullReply = fullReply.replace(/Saved as a favorite\.?\s*Happy cooking!?\s*[💛🍽️✨]*/gi, '').trim();

    // Determine stage
    let stage = "chat";
    let recipeCards = [];
    let groceryList = [];

    // Check for shopping list FIRST - extract from dedicated section only
    const shoppingMatch = fullReply.match(/\*\*🛒?\s*Shopping List[^\*]*\*\*\s*([\s\S]*?)(?=\n\n\*\*|$)/i);
    if (shoppingMatch) {
      const items = shoppingMatch[1]
        .split(/\n/)
        .map(s => s.replace(/^[-•\s]+/, '').trim())
        .filter(line => line && line.length > 3 && !line.includes('**'));
      
      if (items.length > 0) {
        groceryList = items;
        stage = "grocery";
      }
    }

    // IMPROVED: Extract ALL recipes - now handles multiple distinct recipes better
    // This regex captures recipes that are separated by other recipe headers
    const recipeRegex = /\*\*([^*\n]{3,}?)\*\*\s*\*\*Serves:\*\*\s*([^\n]+)\s*\*\*Ingredients:\*\*\s*([\s\S]*?)\*\*Steps:\*\*\s*([\s\S]*?)(?=\n\s*\*\*(?:[A-Z][^*]*?)\*\*\s*\*\*Serves:|\*\*Plating|Enjoy your|Would you like|Ready to|Great!|$)/gi;

    let match;
    while ((match = recipeRegex.exec(fullReply)) !== null) {
      const [, name, serves, rawIngredients, rawSteps] = match;
      
      const ingredients = rawIngredients
        .split(/\n/)
        .map(s => s.replace(/^[-•\d\.\s🥔🥕🫑🥬🍅🧅]+/, '').trim())
        .filter(line => line && !line.startsWith('**') && line.length > 2);
      
      const steps = rawSteps
        .split(/\n/)
        .map(s => s.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line && !line.startsWith('**') && line.length > 5);

      if (ingredients.length > 0 && steps.length > 0) {
        recipeCards.push({
          name: name.trim(),
          serves: serves.trim(),
          ingredients,
          steps,
        });
      }
    }

    if (recipeCards.length > 0) {
      stage = "recipe";
    }

    // Remove shopping list from reply if it was extracted
    let cleanReply = fullReply;
    if (shoppingMatch) {
      cleanReply = fullReply.replace(shoppingMatch[0], '').trim();
    }

    console.log("📦 Sending to frontend:", {
      stage,
      recipeCount: recipeCards.length,
      groceryListCount: groceryList.length,
    });

    res.json({
      stage,
      reply: cleanReply,
      recipeCard: recipeCards.length > 0 ? recipeCards[0] : null, // Send first recipe for backward compatibility
      recipeCards: recipeCards, // Send ALL recipes
      groceryList,
      haveIngredients: state.have,
      missingIngredients: state.missing,
    });
  } catch (error) {
    console.error("💥 Error inside /api/dishmuse:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/vision-filter", async (req, res) => {
  try {
    const rawLabels = req.body.labels || [];
    const promptText = `You are a helpful kitchen assistant.

Given a list of words detected from a photo, identify only the **actual food ingredients** a person might cook with. Ignore anything that's:
- a brand name
- a cuisine
- packaging or label text
- non-food (e.g. "plastic wrap" or "American")

Return only the food items, in a clean, comma-separated list.

List:
${JSON.stringify(rawLabels)}
`;

    const response = await model.invoke(promptText);
    const cleaned = response.content
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    res.json({ filteredIngredients: cleaned });
  } catch (err) {
    console.error("Vision filter error:", err);
    res.status(500).json({ error: "Vision label filtering failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ DishMuse backend running at http://localhost:${PORT}`)
);