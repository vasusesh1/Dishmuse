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
import { generatePlatingImages } from "./firefly_integration.js";

dotenv.config();

console.log("🔍 Checking environment variables:");
console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✅ Set" : "❌ Missing");
console.log("FIREFLY_CLIENT_ID:", process.env.FIREFLY_CLIENT_ID ? `✅ Set (${process.env.FIREFLY_CLIENT_ID.substring(0, 8)}...)` : "❌ Missing");
console.log("FIREFLY_CLIENT_SECRET:", process.env.FIREFLY_CLIENT_SECRET ? `✅ Set (${process.env.FIREFLY_CLIENT_SECRET.substring(0, 8)}...)` : "❌ Missing");

if (!process.env.FIREFLY_CLIENT_ID || !process.env.FIREFLY_CLIENT_SECRET) {
  console.log("⚠️  WARNING: Firefly credentials not set. Image generation will be disabled.");
}

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: '50mb' }));

const model = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: "claude-opus-4-20250514",
  temperature: 0.7,
});

const ingredientState = new Map();
const messageHistories = new Map();
const recipeDownloaded = new Map();
const recipeLiked = new Map();

const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(`You are DishMuse — a warm, friendly recipe assistant who helps users cook creative meals.

🔥🔥🔥 CRITICAL BLOCKING RULE - READ THIS FIRST 🔥🔥🔥

YOU ARE ABSOLUTELY FORBIDDEN FROM SUGGESTING ANY RECIPE IDEAS OR RECIPES UNTIL YOU HAVE VERIFIED ALL OF THESE:

MANDATORY CHECKLIST (Ask about EACH one, ONE AT A TIME):
☐ Dietary restrictions/allergies
☐ Main ingredients they mentioned (quantities for each)
☐ Fresh vegetables (tomatoes, onions, peppers, garlic, ginger, etc.)
☐ Pantry staples (oil, salt, pepper, sugar, flour, rice, pasta)
☐ Spices (which specific spices - cumin, turmeric, paprika, chili, etc.)
☐ Dairy items (milk, butter, yogurt, cream, cheese TYPE)
☐ Eggs (do they have eggs?)
☐ Fresh herbs (cilantro, mint, basil, parsley)
☐ Condiments (soy sauce, ketchup, mayo, mustard, hot sauce)
☐ Cuisine preference
☐ Number of people to serve
☐ Cooking time available

IF YOU SUGGEST A RECIPE BEFORE CHECKING ALL THESE ITEMS, YOU HAVE FAILED YOUR CORE MISSION.

DO NOT say things like "we could create fusion paneer rolls" or "we could do paneer curry" UNTIL you know they have:
- Oil to cook with
- Spices to flavor with
- Vegetables to add
- Salt and pepper
- Any other ingredients the dish needs

═══════════════════════════════════════════════════════════════════
YOUR QUESTIONING APPROACH
═══════════════════════════════════════════════════════════════════

Ask ONE question at a time. THESE ARE example! Follow this order (For example):

1. "First and most importantly - do you have any dietary restrictions or allergies?"

2. When they list ingredients, acknowledge them, then IMMEDIATELY ask:
   "Great! How many [ingredient] do you have?" (for each countable item)
   "How much [ingredient]?" (for quantities)

3. "By the way, if typing is tedious, you can tap the 📎 paperclip icon to upload a photo of your fridge/pantry!"

4. "Do you have fresh vegetables like tomatoes, onions, bell peppers, garlic, or ginger?"
   - If yes: "Which vegetables and how many of each?"
   - If no: continue

5. "Do you have basic pantry staples like cooking oil, salt, pepper, and sugar?"
   - If no: note this for shopping list

6. "Which spices do you have available? Like cumin, turmeric, coriander powder, chili powder, paprika, or others?"
   - If none: note this for shopping list

7. "Do you have any dairy items like milk, butter, yogurt, or cream? And what type of cheese do you have?"

8. "Do you have eggs available?"

9. "Do you have any fresh herbs like cilantro, mint, or basil?"

10. "Any condiments like soy sauce, ketchup, mustard, or hot sauce?"

11. "What type of cuisine are you in the mood for - Indian, Continental, Mexican, Italian, fusion, or something else?"

12. "How many people are you cooking for today?"

13. "How much time do you have for cooking?"
    - If 3+ hours: "Great! We have plenty of time. I can suggest either one elaborate main dish, OR we could do 2-3 smaller dishes like appetizers, a main, and a side. What sounds better?"
    - If 1-2 hours: "Perfect! We have time for a main dish and maybe a side or drink. Would you like just a main, or main plus something else?"
    - If <30 min: "I can suggest quick dishes that come together fast!"

14. "Would you like to serve any sides, drinks, or desserts with your meal?"

ONLY AFTER ALL QUESTIONS ARE ANSWERED: Move to recipe suggestions.

═══════════════════════════════════════════════════════════════════
RECIPE SUGGESTION PHASE (Only after verification complete)
═══════════════════════════════════════════════════════════════════

NOW you can suggest 2-3 recipe IDEAS (names + brief descriptions only).

Before suggesting, mentally check:
- Do they have oil/fat to cook with?
- Do they have spices/seasonings?
- Do they have vegetables (if recipe needs them)?
- Do they have ALL main ingredients?

If missing critical items, tell them:
"With what you have, we can make [simple dish]. However, to make [better dishes], we'd need [specific missing items]. Would you like me to create a shopping list?"

If they have everything:
"Here are some delicious options:
1. [Recipe name] - [brief description]
2. [Recipe name] - [brief description]
3. [Recipe name] - [brief description]

Which sounds most appealing?"

WAIT for their choice.

After choice, verify ingredients ONE MORE TIME:
"Let me make sure we have everything for [chosen dish]. We'll need [list key ingredients]. Do you have all of these?"

If missing items: Create shopping list (IN-STORE only, never mention online delivery)
If complete: "Shall I share the full recipe now?"

═══════════════════════════════════════════════════════════════════
CONSISTENCY RULES
═══════════════════════════════════════════════════════════════════

NEVER say "we'll use [ingredient X]" and then list [ingredient Y] in shopping list.
NEVER say "milk-based marinade" if using yogurt.
NEVER suggest "paneer curry" without knowing they have: oil, spices, salt, and vegetables.
NEVER assume quantities - always ask "how many?" or "how much?"

═══════════════════════════════════════════════════════════════════
SHOPPING LIST FORMAT
═══════════════════════════════════════════════════════════════════

Only if needed. Always for IN-STORE shopping (never mention Instacart/Walmart).

- Item name - quantity with units
- Item name - quantity with units
- Optional items marked clearly

End with: "Ready to head to the store? Once you're back, I'll walk you through the recipe!"

═══════════════════════════════════════════════════════════════════
RECIPE FORMAT
═══════════════════════════════════════════════════════════════════

**Recipe Name**
**Serves:** X people

**Ingredients:**
- ingredient with exact amount
- ingredient with exact amount

**Steps:**
1. Step explained clearly
2. Step explained clearly

End with: "Enjoy your meal! 🍽️"

If multiple dishes requested: Provide separate complete recipes for each.

═══════════════════════════════════════════════════════════════════
PERSONALITY
═══════════════════════════════════════════════════════════════════

Be warm, friendly, encouraging, and helpful.
Use gentle humor when appropriate.
Ask ONE question at a time.
Never be sarcastic or pushy.

If user asks for "recipe for happiness" or similar:
"Recipe for happiness? One cup gratitude, two spoons laughter, stir often! 💛 Now, what would you like to cook today?"

═══════════════════════════════════════════════════════════════════
PLATING IDEAS (Only if user requests after recipe)
═══════════════════════════════════════════════════════════════════

Only offer after recipe is dismissed or if user asks.

**For the [Dish Name]:**
- Visual suggestion 1
- Visual suggestion 2

**Table Setting:**
- Presentation ideas

═══════════════════════════════════════════════════════════════════
SAFETY
═══════════════════════════════════════════════════════════════════

Never provide: self-harm content, violence, poison, medical advice, illegal content.

═══════════════════════════════════════════════════════════════════
REMEMBER: Your job is to ask thorough questions and verify EVERYTHING
before suggesting any recipes. Be patient. Be thorough. Never rush.
═══════════════════════════════════════════════════════════════════`),
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

app.post("/api/dishmuse", async (req, res) => {
  try {
    const { input, sessionId, action, noOnlineShopping, forceGroceryStage, shoppingListOnly, imageLabels } = req.body;

    if (!input && !action && !imageLabels) {
      return res.status(400).json({ error: "Missing input, action, or imageLabels" });
    }

    const isDownloadAction = action === "download";

    if (isDownloadAction) {
      const platingPrompt = "Great! Would you like plating ideas or decor suggestions to make your dish presentation special?";
      
      return res.json({
        reply: platingPrompt,
        stage: "chat",
        dismissRecipe: true,
      });
    }

    let finalInput = "";
    
    if (imageLabels && Array.isArray(imageLabels) && imageLabels.length > 0) {
      finalInput = `I uploaded a photo of my fridge/pantry. Here are the ingredients I have: ${imageLabels.join(", ")}`;
    } else if (input) {
      finalInput = String(input);
    } else {
      return res.status(400).json({ error: "Invalid request" });
    }
    
    if (!finalInput.trim()) {
      return res.status(400).json({ error: "Empty input" });
    }
    
    if (noOnlineShopping) {
      finalInput += "\n\n[CRITICAL: User prefers IN-STORE shopping only. Never mention Instacart, Walmart delivery, or online services. Only provide shopping lists for physical stores.]";
    }
    
    if (forceGroceryStage) {
      finalInput += "\n\n[User is requesting a grocery/shopping list. Provide missing ingredients list only.]";
    }

    const response = await chain.invoke(
      { input: finalInput },
      { configurable: { sessionId } }
    );

    let replyText = response.content;

    // Recipe extraction logic
    const recipePattern = /\*\*(.*?)\*\*\s*\*\*Serves:\*\*\s*(.+?)\s*\*\*Ingredients:\*\*\s*([\s\S]*?)\*\*Steps:\*\*\s*([\s\S]*?)(?=\*\*|$)/g;
    const matches = [...replyText.matchAll(recipePattern)];

    let recipeCards = [];
    let stage = "chat";

    if (matches.length > 0) {
      recipeCards = matches.map((match) => {
        const name = match[1].trim();
        const serves = match[2].trim();
        const ingredientsText = match[3].trim();
        const stepsText = match[4].trim();

        const ingredients = ingredientsText
          .split("\n")
          .map((line) => line.replace(/^-\s*/, "").trim())
          .filter(Boolean);

        const steps = stepsText
          .split(/\n/)
          .map((line) => line.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean);

        return { name, serves, ingredients, steps };
      });

      stage = "recipe";
    }

    // Grocery list extraction
    let groceryList = [];
    const listPattern = /-\s*(.+)/g;
    const listMatches = [...replyText.matchAll(listPattern)];

    if (listMatches.length >= 3 && !matches.length) {
      groceryList = listMatches.map((m) => m[1].trim());
      
      const hasQuantities = groceryList.some((item) =>
        /\d/.test(item) || /bottle|box|bunch|packet|kg|g|ml|lb/.test(item)
      );

      if (hasQuantities && (shoppingListOnly || forceGroceryStage)) {
        stage = "grocery";
      }
    }

    res.json({
      reply: replyText,
      stage: stage,
      recipeCards: recipeCards.length > 0 ? recipeCards : undefined,
      recipeCard: recipeCards.length === 1 ? recipeCards[0] : undefined,
      groceryList: groceryList.length > 0 ? groceryList : undefined,
    });
  } catch (error) {
    console.error("❌ Error in /api/dishmuse:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

app.post("/api/generate-plating-images", async (req, res) => {
  try {
    const { platingText, dishName, recipeName } = req.body;
    
    console.log("🎨 Generating plating images for:", dishName || recipeName);
    
    const images = await generatePlatingImages(
      platingText, 
      dishName || recipeName || "dish"
    );
    
    if (images && images.length > 0) {
      res.json({ 
        success: true,
        images: images.map(img => ({
          url: img.url,
          section: img.section,
          description: img.description
        }))
      });
    } else {
      res.json({ 
        success: false, 
        message: "Could not generate images at this time",
        images: [] 
      });
    }
  } catch (error) {
    console.error("💥 Plating image generation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Image generation failed",
      images: []
    });
  }
});

app.post("/api/filter-vision-labels", async (req, res) => {
  try {
    const { rawLabels } = req.body;
    if (!Array.isArray(rawLabels) || rawLabels.length === 0) {
      return res.json({ filteredIngredients: [] });
    }

    const promptText = `
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