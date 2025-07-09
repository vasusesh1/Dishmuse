# DishMuse: Your AI Recipe Companion

DishMuse is a **medium-code AI-powered recipe assistant** that helps users turn leftover ingredients into delicious, personalized meals. Built using **LangChain**, this project combines prompt engineering, chaining, and a custom-coded **chatbot UI** to guide users from "What's in the fridge?" to "Dinner is served."

---

## 🔧 Built With

* **LangChain** for prompt chaining and dialogue control
* **OpenAI or Claude** (LLM of choice) for natural language reasoning
* **FastAPI** (or Flask) backend
* **React / Next.js / Streamlit / your frontend of choice** for chatbot UI
* **Instacart API** (or similar grocery service) for delivery option integration
* **OCR / Image-to-Text Model** for ingredient detection from fridge/pantry photos

---

## 💡 Features

### 🥘 Smart Recipe Suggestions

* Suggests 1–2 recipes based on user-provided ingredients
* Accepts **text input** *or* **photo uploads** of fridge/pantry

### 🧠 Prompt-Driven Follow-ups

DishMuse uses layered prompt logic to ask:

* Cuisine preference (e.g., Indian, Mediterranean, Mexican)
* Cooking style (quick, fancy, one-pot, kid-friendly, etc.)
* Number of people / servings
* Spices and dietary constraints
* Available time and effort
* Side dish or dessert interest

### 🧮 Health & Nutrition Aware

If user is calorie-counting or eating for health:

* Collects calorie goals, meals already consumed, health conditions (heart, cancer, bland diets)
* Suggests low-sodium, low-fat, easy-to-digest meals accordingly

### 🛒 Grocery & Delivery Support

If ingredients are missing:

* Offers to generate a **grocery list**
* Lets user choose between **in-store shopping** or ordering via **Instacart API**

### 🔄 Chaining & Branching

* If ingredient quantity is low, DishMuse asks follow-ups:

  * Add other ingredients to stretch recipe?
  * Want 2–3 mini recipes to feed everyone?
  * Time constraint? Suggests quick batch recipes.

### 🍽️ Plating & Presentation

* Offers plating ideas and reference images on request

---

## 🚀 Demo Goals (for LinkedIn / GitHub Portfolio)

* Fully functional chatbot UI with natural back-and-forth
* Ability to upload fridge photos or type ingredients
* API call demo for Instacart
* Shareable experience that demonstrates prompt design + chaining

---

## 🤝 Contribution

This project is a personal portfolio build, but collaboration or feedback is always welcome!

---

## 📄 Prompt Design

The full structured DishMuse prompt is available in [`prompt.txt`](./prompt.txt).

---

# 🍳 DishMuse — Your AI Recipe Companion

DishMuse is an intelligent, friendly AI that turns your leftover ingredients into creative recipes. Built with love, late nights, and a lot of debugging.

## 🚀 Features

- 🧠 Claude 3 Opus-based LLM reasoning
- 🥕 Upload fridge/pantry photo → ingredient detection (Google Vision API)
- 🗣️ Voice input (Speech-to-Text) + AI read-aloud (Text-to-Speech)
- 🔁 Chained conversation: dietary goals, cuisine preferences, serving sizes, allergies, etc.
- 🛒 Walmart API integration: auto-fetch ingredients & links

---

## ⚙️ Tech Stack

| Layer       | Tech Used                         |
|-------------|----------------------------------|
| Frontend    | React + Tailwind CSS             |
| Backend     | Express.js + LangChain           |
| LLM         | Claude 3 Opus via Anthropic API  |
| Vision      | Google Vision API                |
| Shopping    | Walmart API                      |
| Hosting     | localhost (dev only)             |

---

## 🧪 LLMs Tested

| Model              | Verdict                                       |
|--------------------|-----------------------------------------------|
| LLaMA 3 (Groq)     | 🚫 Fast but weak chaining logic               |
| Claude 3.5 Sonnet  | ❌ Not available on current Anthropic tier    |
| Claude 2.1         | ❌ Deprecated                                 |
| Claude 3 Opus      | ✅ Best performance; paid plan required        |

💵 Had to pay **$5** on Anthropic to unlock Claude Opus.

---

## 🧠 Prompt Behavior

DishMuse uses LangChain to structure a rich system prompt that guides conversation through follow-ups like:
- Cuisine type
- Number of servings
- Health goals
- Available spices
- Shopping support if ingredients are missing
- Humor & creativity when user says "just give me something quick!"

---

## 🔌 API Keys Required

- `.env` must contain:
  ```env
  REACT_APP_GOOGLE_VISION_API_KEY=...
  GROQ_API_KEY=...             # (if you ever switch back to LLaMA)
  ANTHROPIC_API_KEY=...        # for Claude Opus
  OPENAI_API_KEY=...           # (for earlier experiments)
  ```

---

## 🛠️ Setup Instructions

```bash
# 1. Backend
cd backend
npm install --legacy-peer-deps
node index.js

# 2. Frontend
cd frontend
npm install
npm start
```

---

## 📸 Image Detection Flow

- User uploads image of pantry/fridge
- Vision API detects top 10 ingredients
- Claude receives these as context for recipe suggestion

---

## 🛍️ Walmart Shopping Links

- Claude mentions ingredients → you can click to buy on Walmart.
- (Instacart version: TBD, Walmart was easier for now)

---

## 🤯 Debug Notes

| Problem                           | Fix                                       |
|----------------------------------|--------------------------------------------|
| ESM / `type: module` issues       | Cleaned up all `cors`, `import` quirks     |
| LangChain version conflicts       | Used `--legacy-peer-deps`                 |
| Claude SDK export error           | Fixed by manually testing export path     |
| LLaMA chaining failure            | Switched to Claude Opus                   |
| Package-lock corruption           | Cleared `node_modules` + reinstalled      |

---

## 🧠 Final Thought

We built this through a LOT of real-time debugging, frustration, and learning. The result is a charming, useful tool — and a powerful GenAI showcase.

---

## 📌 Next Steps

- [ ] Polish UI interactions
- [ ] Add recipe image generation (optional)
- [ ] Deploy to Vercel / Render
- [ ] Write LinkedIn post summarizing Claude vs LLaMA vs OpenAI experience

---

Made with 🍲 by a persistent builder 💪


## 🪪 Author

**Vasupradha Seshadri**
Prompt Engineer | AI UX Explorer
Exploring human-centered GenAI tools for everyday decisions

---

## 📌 Tags

`LangChain` `PromptEngineering` `AIUX` `LLM` `GroceryBot` `FoodTech` `WomenInTech` `ChatbotUI` `MediumCode` `SideProject`

