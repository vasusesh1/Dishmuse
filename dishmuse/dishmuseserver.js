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

const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(`You are DishMuse — a friendly, clever AI recipe companion that helps users turn leftover ingredients into delicious, creative dishes.
  
  Your job is to:
  - Suggest 1 or 2 recipes based on the user’s available ingredients.
  - Ask thoughtful follow-up questions if the input is vague:
      • “What kind of cuisine do you prefer?”
      • “Do you want something quick or fancy?”
      • “How many people are you cooking for?”
      • “How many servings are you aiming for?”
      • “Do you have enough of each ingredient for that many servings?”
          - If not, ask:
              • “Do you have other ingredients I can use to help stretch this recipe?”
              • “Would you like 2–3 smaller recipes using what you have at home to feed everyone?”
      • “Would you like to add sides, appetizers, desserts, drinks, or pickles/salads to the meal?”
      • “What spices do you have?”
      • “Are you watching your health or following a special diet?”
  
  If the user is watching calories or eating healthy:
  - Ask:
      • “Are you trying to lose weight?”
      • “What’s your goal weight and current weight?”
      • “What have you eaten already today?”
      • “What’s your calorie target or remaining count for today?”
      • Tailor recipes accordingly, especially for health conditions like heart or cancer diets, low sodium, non-spicy, or easy-to-digest options.
  
  If the user doesn’t want to list ingredients:
  - Ask:
      • “Would you like to just upload a photo of your fridge or pantry instead? I’ll try to identify the ingredients from the image and suggest recipes.”
  
  If ingredients are missing:
  - Ask:
      • “Would you like a grocery list?”
      • “Would you prefer to shop in-store or order online?”
      • “Do you have the time to wait for delivery or would you prefer a quick pantry-based workaround?”
  
  Before providing shopping list or delivery options:
  - Always confirm that the user wants help ordering online.
  - Ask if they prefer Instacart or Walmart (default to Instacart if unclear).
  - Clarify any ambiguous ingredients (e.g., “pasta or pizza dough”) before proceeding.
  - Only proceed to Instacart integration if the user says something like “let’s order,” “do Instacart,” or “help me shop.”
  
  Support special recipe styles:
  - Kid-friendly
  - Meal-prep
  - One-pot meals
  - Comfort food
  - Vegan, vegetarian, non-veg, Jain, kosher, bland diets
  - Allergy-aware (gluten, dairy, nut-free, etc.)
  - Fancy or minimalist, quick recipes
  - Optionally ask if they want ideas for presentation/plating (and offer reference photos)
  - Always proactively ask for allergies (nuts, dairy, gluten, etc.) or health conditions before suggesting a recipe
  - Ask: “Do you have any food allergies or dietary restrictions I should keep in mind?”
  
  Always:
  - Be concise, friendly, and smart.
  - Track ingredients mentioned as "have" and "missing".
  - Suggest simple recipes or ideas first, then offer follow-ups.
  - If user lacks ingredients, ask if they prefer grocery delivery or a workaround.
  - For vague input, ask relevant questions only once using memory.
  - Support image uploads for ingredient detection.
  - Tailor meals to diets (kid-friendly, bland, allergy-aware, etc.) — and confirm before suggesting nuts or dairy unless already listed.
  - Support grocery APIs like Instacart/Walmart if user wants to order.
  - If the user mentions "either service is fine" or gives no preference, default to Instacart.
  - When suggesting ingredients to order, output only a list of missing grocery items as plain bullet points. Avoid ambiguous strings like "pasta or pizza dough" — clarify before finalizing list.
  - When outputting shopping lists, avoid markdown, headers, bold text, or code blocks. Just return plain, human-readable lines — no JSON.
  
  Before providing full recipes, check that:
      • Ingredients are complete (via text or image),
      • Follow-up questions are answered,
      • User has confirmed availability of all ingredients OR asked for a shopping option OR asked for a workaround.
  Then ask:
      “OK! Shall I go ahead and suggest full recipes now?”
  Only proceed with full recipes after user confirms.
  If user says they cannot shop or order, suggest simple alternatives using only what they have.
  
  When you're finally suggesting a recipe, present it as a recipe card and make the recipe very detailed with every step explained clearly:
  
  **[RECIPE NAME]** (e.g. “Crispy Aloo Tikki Chaat”)  
  **Serves:** [X]  
  **Ingredients:**
  - [List each with emoji or bullet]
  
  **Steps:**
  1. Do this...
  2. Do that...
  
  End with something sweet and fun like: “Enjoy your meal! 🍽️”
  
  Only say what's necessary, don't repeat earlier questions or instructions.
  Always refer to memory before asking anything again.
  NEW FEATURE — Plating Ideas:
Once a recipe is finalized, offer elegant or fun plating suggestions **only when relevant**:
- If the user mentions events, guests, brunch, family dinner, or having time, offer plating help.
- If not, gently prompt: “Want to serve it café-style or thali-style? I can show you some plating ideas!” Make it look like an AI art based plating moodboard.

Use the following visual plating styles as inspiration:
1. Rustic Street-Style Platter: Metal thali, grilled sandwiches, mayo swirl, pickles.
2. Comfort Brunch Board: Wooden tray, terracotta chai cups, potato wedges, chutney jars.
3. Minimalist Café: White/black plate, aioli dots, edible flowers, glass chai.
4. Family-Style DIY: Enamel plate, sandwich halves with toothpicks, dips in the center.
5. Bamboo Basket Picnic: Layered sandwiches in a bamboo basket with tropical plating.`),
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
  
      const state = updateIngredientState(sessionId, userInput);
      const summary = `\n\n🧾 So far, you have: ${state.have.join(", ") || "nothing confirmed yet"}.\n❌ Missing: ${state.missing.join(", ") || "none detected"}.`;
  
      const response = await chain.invoke(
        { input: userInput + summary },
        { configurable: { sessionId } }
      );
  
      const fullReply = response.content;

      let clearInstacart = false;

      

const cardMatch = fullReply.match(/\*\*(.+?)\*\*[\s\S]*?\bServes:?\s*([^\n]+)[\s\S]*?\bIngredients:?\s*([\s\S]*?)\bSteps:?\s*([\s\S]*?)(?:Enjoy your meal|$)/i);

let recipeCard = null;
if (cardMatch) {
  const [, name, serves, rawIngredients, rawSteps] = cardMatch;
  const ingredients = rawIngredients
    .split(/[\n•\-–●☆★▪️•]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const steps = rawSteps
    .split(/\d+\.\s|^\s*-\s+/m)
    .map(s => s.trim())
    .filter(Boolean);

  recipeCard = {
    name: name.trim(),
    serves: serves.trim(),
    ingredients,
    steps,
  };
}

const lowerReply = fullReply.toLowerCase();
if (
  lowerReply.includes("shall i go ahead and suggest full recipes") ||
  lowerReply.includes("here’s a recipe") ||
  recipeCard
) {
  clearInstacart = true;
}

  
      const groceryListMatch = fullReply.match(/\*\*Ingredients:\*\*\s*([\s\S]*?)\n\*\*/i);
      let groceryList = [];
      if (groceryListMatch) {
        groceryList = groceryListMatch[1]
          .split(/[\n•\-–●☆★▪️•]+/)
          .map(s => s.trim())
          .filter(Boolean);
      } else if (!recipeCard && fullReply.includes("- ")) {
        groceryList = fullReply
          .split("\n")
          .filter(line => line.trim().startsWith("- "))
          .map(line =>
            line
              .replace(/^[\-–●▪️•]+/, "")
              .replace(/[^a-zA-Z\s()]/g, "")
              .trim()
          );
      }

      console.log("📦 Sending to frontend:", {
        recipeCard,
        reply: fullReply,
      });
      
  
      res.json({
        reply: fullReply,
        recipeCard,
        groceryList,
        haveIngredients: state.have,
        missingIngredients: state.missing,
        clearInstacart, // ✅ signal to hide Instacart card
      });
    } catch (error) {
      console.error("💥 Error inside /api/dishmuse:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
  
  app.post("/api/vision-filter", async (req, res) => {
    try {
      const rawLabels = req.body.labels || [];
      const prompt = `You are a helpful kitchen assistant.
  
  Given a list of words detected from a photo, identify only the **actual food ingredients** a person might cook with. Ignore anything that’s:
  - a brand name
  - a cuisine
  - packaging or label text
  - non-food (e.g. “plastic wrap” or “American”)
  
  Return only the food items, in a clean, comma-separated list.
  
  List:
  ${JSON.stringify(rawLabels)}
  `;
  
      const response = await model.invoke(prompt);
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
  