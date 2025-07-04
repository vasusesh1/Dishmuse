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

## 🪪 Author

**Vasupradha Seshadri**
Prompt Engineer | AI UX Explorer
Exploring human-centered GenAI tools for everyday decisions

---

## 📌 Tags

`LangChain` `PromptEngineering` `AIUX` `LLM` `GroceryBot` `FoodTech` `WomenInTech` `ChatbotUI` `MediumCode` `SideProject`

