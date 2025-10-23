import React, { useState, useEffect, useRef } from "react";

export default function ChatBot({
  greeting = "Hi there! 👋 I'm DishMuse, your friendly kitchen companion!\n\nTell me what you'd like to cook or what ingredients you have. You can also tap 📎 to upload a photo of your fridge/pantry.",
  typingIndicator = true,
  emojiReactions = true,
}) {
  // ---------- basic chat state ----------
  const [messages, setMessages] = useState([{ text: greeting, isUser: false }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // UI toggles
  const [stage, setStage] = useState("chat");

  // Shopping list (structured, view-only; NO buttons)
  const [shoppingList, setShoppingList] = useState([]);
  const [showShoppingCard, setShowShoppingCard] = useState(false);

  // Recipe scroll (ONLY visual for recipes; never as a chat bubble)
  const [recipeCard, setRecipeCard] = useState(null);
  const [showRecipeScroll, setShowRecipeScroll] = useState(false);
  const [liked, setLiked] = useState(false);

  // Optional extras slot
  const [moodboardImages, setMoodboardImages] = useState([]);

  // Refs
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  // Session id
  const [sessionId] = useState(() => {
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return id;
  });

  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_VISION_API_KEY;

  // ---------- effects ----------
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping, showShoppingCard, showRecipeScroll]);

  // STT
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const SR = new window.webkitSpeechRecognition();
    SR.lang = "en-US";
    SR.interimResults = false;
    SR.onresult = (e) => setInput(e.results[0][0].transcript);
    recognitionRef.current = SR;
  }, []);

  // TTS
  const speak = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    } catch {}
  };

  // ---------- helpers ----------
  const pushAssistant = (text) =>
    setMessages((p) => [...p, { text, isUser: false }]);

  const pushUser = (text) =>
    setMessages((p) => [...p, { text, isUser: true }]);

  const wantsShoppingList = (txt = "") =>
    /shopping\s*list|grocery\s*list|what do i need|make.*list|give me.*list|list please|show.*list/i.test(
      txt.toLowerCase()
    ) || /^list$/i.test(txt.trim());

  const normalizeList = (list) =>
    (list || []).map((g) =>
      typeof g === "string"
        ? { name: String(g).trim(), qty: "", unit: "", optional: false }
        : {
            name: (g.name ?? g.item ?? "").toString().trim(),
            qty:
              g.qty !== undefined && g.qty !== null && `${g.qty}` !== ""
                ? `${g.qty}`
                : "",
            unit: g.unit || "",
            optional: !!g.optional,
          }
    );

  // ---------- downloads (recipe only) ----------
  const downloadTextFile = (filename, textOrLines) => {
    const content = Array.isArray(textOrLines)
      ? textOrLines.join("\n")
      : String(textOrLines);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRecipe = () => {
    if (!recipeCard) return;
    const lines = [
      recipeCard.name || "Recipe",
      recipeCard.serves ? `Serves: ${recipeCard.serves}` : "",
      "",
      "Ingredients:",
      ...((recipeCard.ingredients || []).map(String)),
      "",
      "Steps:",
      ...((recipeCard.steps || []).map(String)),
      "",
    ];
    downloadTextFile(
      `${(recipeCard.name || "Recipe").replace(/\s+/g, "_")}.txt`,
      lines
    );
  };

  // ---------- recipe fetch (scroll only) ----------
  const fetchRecipeNow = async () => {
    if (typingIndicator) setIsTyping(true);
    try {
      const res = await fetch("http://localhost:5000/api/dishmuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "recipe",
          sessionId,
          noOnlineShopping: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        pushAssistant("Server error: " + (data.error || "unknown"));
        return;
      }

      if (data.recipeCard) {
        setRecipeCard(data.recipeCard);
        setShowRecipeScroll(true);
        setStage("recipe");
      } else if (data.reply) {
        // Only speak text if no recipe card was provided
        pushAssistant(data.reply);
        speak(data.reply);
      }
    } catch (e) {
      console.error(e);
      pushAssistant("Oops! Something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  // ---------- send ----------
  const handleSend = async () => {
    const userText = input.trim();
    if (!userText) return;

    // user bubble
    pushUser(userText);
    setInput("");

    // clear transient UI
    setShowRecipeScroll(false);
    setRecipeCard(null);
    setMoodboardImages([]);
    setLiked(false);
    setStage("chat");
    setShowShoppingCard(false);
    setShoppingList([]);

    if (typingIndicator) setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/dishmuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userText,
          sessionId,
          noOnlineShopping: true,
          // Only hint list mode if user explicitly asked
          forceGroceryStage: wantsShoppingList(userText),
          shoppingListOnly: wantsShoppingList(userText),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        pushAssistant("Server error: " + (data.error || "unknown"));
        return;
      }

      // Handle recipe stage - show scroll ONLY, split plating message PROPERLY
      if (data.stage === "recipe" && data.recipeCard) {
        let mainReply = "";
        let platingReply = "";
        
        if (data.reply) {
          // Split on plating-related phrases
          const split = data.reply.split(/(Want to serve it café-style|Would you like.*?plating|café-style or thali-style)/i);
          
          mainReply = split[0].trim();
          
          // Rejoin plating parts
          if (split.length > 1) {
            platingReply = split.slice(1).join('').trim();
          }
          
          // Show main reply if it doesn't contain recipe content
          if (mainReply && 
              !mainReply.includes("**Ingredients:**") && 
              !mainReply.includes("**Steps:**") &&
              !mainReply.includes("**FUSION PAV") &&
              !mainReply.includes("**CREAMY AAMRAS")) {
            pushAssistant(mainReply);
            speak(mainReply);
          }
        }
        
        // Show recipe scroll
        setRecipeCard(data.recipeCard);
        setShowRecipeScroll(true);
        setStage("recipe");
        
        // Show plating message as separate bubble after delay
        if (platingReply) {
          setTimeout(() => {
            pushAssistant(platingReply);
          }, 800);
        }
      } else if (data.reply) {
        // For non-recipe stages, show full conversational reply
        pushAssistant(data.reply);
        speak(data.reply);
      }

      // Only show grocery list if explicitly in grocery stage AND has valid items
      if (data.stage === "grocery" && Array.isArray(data.groceryList) && data.groceryList.length > 0) {
        const normalized = normalizeList(data.groceryList);
        setShoppingList(normalized);
        setShowShoppingCard(true);
        setStage("shopping_list");

        // Immediately fetch recipe scroll AFTER showing the list
        fetchRecipeNow();
      }
    } catch (err) {
      console.error(err);
      pushAssistant("Oops! Something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  // ---------- speech / attach ----------
  const handleMicClick = () => recognitionRef.current?.start();
  const handleAttachClick = () => fileInputRef.current?.click();

  // ---------- Vision ----------
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      const body = {
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: "LABEL_DETECTION", maxResults: 10 },
              { type: "TEXT_DETECTION" },
              { type: "WEB_DETECTION" },
            ],
          },
        ],
      };

      pushUser("Extract ingredients from the image please");
      setShowRecipeScroll(false);
      setRecipeCard(null);
      setShowShoppingCard(false);
      setShoppingList([]);
      if (typingIndicator) setIsTyping(true);

      try {
        const vis = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await vis.json();
        const labels = data.responses?.[0]?.labelAnnotations || [];
        const texts =
          data.responses?.[0]?.textAnnotations?.[0]?.description || "";
        const web = data.responses?.[0]?.webDetection?.webEntities || [];
        const raw = Array.from(
          new Set([
            ...labels.map((l) => l.description?.toLowerCase()).filter(Boolean),
            ...texts.toLowerCase().split(/\n|,/).map((s) => s.trim()),
            ...web.map((e) => e.description?.toLowerCase()).filter(Boolean),
          ])
        );

        const replyRes = await fetch("http://localhost:5000/api/dishmuse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            imageIngredients: raw,
            noOnlineShopping: true,
          }),
        });
        const replyData = await replyRes.json();

        if (replyRes.ok) {
          // Handle recipe stage separately with plating split
          if (replyData.stage === "recipe" && replyData.recipeCard) {
            if (replyData.reply) {
              const platingSplit = replyData.reply.split(/(?=Want to serve|Would you like.*plating|café-style|thali-style)/i);
              
              if (platingSplit[0] && platingSplit[0].trim() && 
                  !platingSplit[0].includes("**Ingredients:**") && 
                  !platingSplit[0].includes("**Steps:**")) {
                pushAssistant(platingSplit[0].trim());
                speak(platingSplit[0].trim());
              }
              
              setRecipeCard(replyData.recipeCard);
              setShowRecipeScroll(true);
              setStage("recipe");
              
              if (platingSplit[1]) {
                setTimeout(() => {
                  pushAssistant(platingSplit[1].trim());
                }, 500);
              }
            } else {
              setRecipeCard(replyData.recipeCard);
              setShowRecipeScroll(true);
              setStage("recipe");
            }
          } else if (replyData.reply) {
            pushAssistant(replyData.reply);
            speak(replyData.reply);
          }

          if (replyData.stage === "grocery" && replyData.groceryList?.length) {
            const normalized = normalizeList(replyData.groceryList);
            setShoppingList(normalized);
            setShowShoppingCard(true);
            setStage("shopping_list");
            // Auto move to recipe after list
            fetchRecipeNow();
          }
        } else {
          pushAssistant("Image upload error: " + replyData.error);
        }
      } catch (err) {
        console.error(err);
        pushAssistant("Oops! Vision API failed.");
      } finally {
        setIsTyping(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------- recipe actions ----------
  const likeRecipe = () => {
    setLiked(true);
    pushAssistant("Saved as a favorite. Happy cooking! 💛");
  };

  // ---------- UI ----------
  return (
    <div className="flex flex-col h-full w-full">
      {/* Conversation */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 -mr-1 scroll-smooth"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-[75%] whitespace-pre-wrap ${
                m.isUser ? "msg-user text-right" : "msg-assistant text-left"
              }`}
            >
              {m.text}
              {emojiReactions && !m.isUser && (
                <div className="mt-1 text-sm">🤩 🍽️</div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl msg-assistant text-sm">
              <span className="dm-typing">
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </span>
            </div>
          </div>
        )}

        {/* Shopping List Card (VIEW-ONLY — NO BUTTONS) */}
        {showShoppingCard && shoppingList.length > 0 && (
          <div className="bg-white mt-2 p-4 rounded-xl shadow-lg border border-green-300">
            <h3 className="text-md font-semibold text-green-800 mb-2">
              🛒 Shopping List
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-800">
              {shoppingList.map(({ name, qty, unit, optional }, idx) => (
                <li key={idx}>
                  {optional ? "(optional) " : ""}
                  {name}
                  {qty ? ` — ${qty}${unit ? " " + unit : ""}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe Scroll (ONLY format for recipes) */}
        {showRecipeScroll && recipeCard && (
          <div className="dm-scroll">
            <div className="dm-scroll-inner">
              <h2 className="text-xl font-extrabold mb-2" style={{ color: '#5b3b1e' }}>
                {recipeCard.name}
              </h2>
              {!!recipeCard.serves && (
                <p className="text-sm mb-3" style={{ color: '#5b3b1e', opacity: 0.8 }}>
                  {recipeCard.serves}
                </p>
              )}

              <h3 className="font-semibold mb-1" style={{ color: '#5b3b1e' }}>Ingredients:</h3>
              <ul className="list-disc list-inside mb-3 text-[15px] leading-relaxed" style={{ color: '#5b3b1e' }}>
                {(recipeCard.ingredients || []).map((x, idx) => (
                  <li key={idx}>{x}</li>
                ))}
              </ul>

              <h3 className="font-semibold mb-1" style={{ color: '#5b3b1e' }}>Steps:</h3>
              <ol className="list-decimal list-inside text-[15px] leading-relaxed" style={{ color: '#5b3b1e' }}>
                {(recipeCard.steps || []).map((s, idx) => (
                  <li key={idx} className="mb-1">
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={downloadRecipe}
                className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium"
              >
                ⬇️ Download Recipe
              </button>
              <button
                onClick={likeRecipe}
                className={`px-4 py-2 rounded-full text-white text-sm font-medium ${
                  liked ? "bg-amber-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {liked ? "★ Liked" : "☆ Like"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 pt-3 bg-gradient-to-t from-[rgba(255,243,222,0.96)] to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={handleAttachClick}
            className="dm-attach-btn rounded-full p-2"
            title="Attach photo"
          >
            📎
          </button>

          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // clear panels on new typing
              if (showShoppingCard) {
                setShowShoppingCard(false);
                setShoppingList([]);
              }
              if (showRecipeScroll) {
                setShowRecipeScroll(false);
                setRecipeCard(null);
              }
              if (moodboardImages.length) setMoodboardImages([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 dm-input focus:outline-none"
            placeholder="Tell me what you'd like to cook…"
          />

          <button
            onClick={handleMicClick}
            className="dm-mic-btn rounded-full p-2 text-xl"
            title="Speak"
          >
            🎤
          </button>
          <button
            onClick={handleSend}
            className="dm-send-btn px-4 py-2 rounded-full"
            title="Send"
          >
            ➤
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}