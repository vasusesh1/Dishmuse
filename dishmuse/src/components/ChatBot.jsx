import React, { useState, useEffect, useRef } from "react";

export default function ChatBot({
  greeting = "Welcome to DishMuse! Your recipe assistant.",
  typingIndicator = true,
  emojiReactions = true,
  sendButton = null,
}) {
  const [messages, setMessages] = useState([{ text: greeting, isUser: false }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem("dishMuseSession");
    if (saved) return saved;
    const newId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem("dishMuseSession", newId);
    return newId;
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recipeCard, setRecipeCard] = useState(null);
  const [missingItems, setMissingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showInstacart, setShowInstacart] = useState(false);
  const [chosenDish, setChosenDish] = useState(null);
  const [liked, setLiked] = useState(false);

  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_VISION_API_KEY;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping, showInstacart, recipeCard]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  };

  const cleanIngredient = (item) =>
    item.split(/[–—()\-]/)[0].replace(/[^a-zA-Z\s]/g, "").trim();

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((prev) => [...prev, { text: userText, isUser: true }]);
    setInput("");
    setRecipeCard(null);
    if (typingIndicator) setIsTyping(true);

    const triggers = ["instacart", "order", "buy", "online order", "shop"];
    if (triggers.some((t) => userText.toLowerCase().includes(t))) {
      const mockItems = [
        "Pasta (1 lb)","Parmesan cheese (8 oz)","Tomato sauce (1 jar)","Fresh basil",
        "Paneer","Whole wheat bread","Garlic cloves","Olive oil","Butter","Onion",
        "Salt","Black pepper","Mozzarella (optional)",
      ];
      const cleaned = mockItems.map(cleanIngredient);
      setMissingItems(mockItems);
      setSelectedItems(cleaned);
      setShowInstacart(true);
      setIsTyping(false);
      setMessages((p) => [
        ...p,
        { text:
            "Here's a list of essential items for your recipe. Select what you want and click below to shop on Instacart!",
          isUser: false },
      ]);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/dishmuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userText, sessionId }),
      });
      const data = await res.json();

      if (res.ok) {
        const reply = data.reply || "Hmm… couldn’t think of anything!";
        if (data.recipeCard) {
          setRecipeCard(data.recipeCard);
        } else {
          setMessages((p) => [...p, { text: reply, isUser: false }]);
          speak(reply);
        }
        if (data.groceryList?.length) {
          const cleaned = data.groceryList.map(cleanIngredient);
          setMissingItems(data.groceryList);
          setSelectedItems(cleaned);
        }
        if (data.clearInstacart) {
          setShowInstacart(false);
          setMissingItems([]);
          setSelectedItems([]);
        }
      } else {
        setMessages((p) => [...p, { text: "Server error: " + data.error, isUser: false }]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((p) => [...p, { text: "Oops! Something went wrong.", isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  // === Vision upload ===
  const handleAttachClick = () => fileInputRef.current?.click();

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1];
      const body = {
        requests: [{
          image: { content: base64Image },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "TEXT_DETECTION" },
            { type: "WEB_DETECTION" },
          ],
        }],
      };

      try {
        const res = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        );
        const data = await res.json();
        const labels = data.responses?.[0]?.labelAnnotations || [];
        const texts  = data.responses?.[0]?.textAnnotations?.[0]?.description || "";
        const web    = data.responses?.[0]?.webDetection?.webEntities || [];
        const raw = Array.from(new Set([
          ...labels.map(l => l.description?.toLowerCase()).filter(Boolean),
          ...texts.toLowerCase().split(/\n|,/).map(s => s.trim()),
          ...web.map(e => e.description?.toLowerCase()).filter(Boolean),
        ]));

        setMessages(p => [...p, { text: "Extract ingredients from the image please", isUser: true }]);
        setInput("");
        setRecipeCard(null);
        if (typingIndicator) setIsTyping(true);

        const replyRes = await fetch("http://localhost:5000/api/dishmuse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, imageIngredients: raw }),
        });

        const replyData = await replyRes.json();
        if (replyRes.ok) {
          const reply = replyData.reply || "Here's what I came up with!";
          if (!replyData.recipeCard) setMessages(p => [...p, { text: reply, isUser: false }]);
          speak(reply);
          if (replyData.recipeCard) setRecipeCard(replyData.recipeCard);

          if (replyData.groceryList?.length && chosenDish) {
            const cleaned = replyData.groceryList.map(cleanIngredient);
            setMissingItems(replyData.groceryList);
            setSelectedItems(cleaned.slice(0, 10));
            setShowInstacart(true);
          }
        } else {
          setMessages(p => [...p, { text: "Image upload error: " + replyData.error, isUser: false }]);
        }
      } catch (error) {
        console.error("Vision API error:", error);
        setMessages(p => [...p, { text: "Oops! Vision API failed.", isUser: false }]);
      } finally {
        setIsTyping(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShopClick = () => {
    const trimmed = selectedItems.slice(0, 10);
    const query = trimmed.join(", ");
    if (selectedItems.length > 10) alert("Only the first 10 items are included in the Instacart search.");
    window.open(
      `https://www.instacart.com/store/partner/search?q=${encodeURIComponent(query)}`,
      "_blank"
    );
  };

  const downloadRecipe = () => {
    if (!recipeCard) return;
    const text = `
${recipeCard.name}
Serves: ${recipeCard.serves}

Ingredients:
${recipeCard.ingredients.map(i => `- ${i}`).join("\n")}

Steps:
${recipeCard.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recipeCard.name.replace(/\s+/g,"_")}_DishMuse.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* ===== Scrollable content (messages, cards, etc.) ===== */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 -mr-1 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-2xl max-w-[75%] whitespace-pre-wrap
                             ${msg.isUser ? "msg-user text-right" : "msg-assistant text-left"}`}>
              {msg.text}
              {emojiReactions && !msg.isUser && <div className="mt-1 text-sm">🤩 🍽️</div>}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl msg-assistant text-sm">
              <span className="dm-typing"><span>•</span><span>•</span><span>•</span></span>
            </div>
          </div>
        )}

        {recipeCard && (
          <div className="bg-white mt-4 p-4 rounded-xl shadow-lg border border-amber-300">
            <h2 className="text-lg font-bold text-amber-700 mb-2">{recipeCard.name}</h2>
            <p className="text-sm text-gray-600 mb-2">{recipeCard.serves}</p>

            <h3 className="font-semibold text-amber-800 mt-2 mb-1">Ingredients:</h3>
            <ul className="list-disc list-inside mb-2 text-sm text-gray-800">
              {recipeCard.ingredients.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>

            <h3 className="font-semibold text-amber-800 mt-2 mb-1">Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-800">
              {recipeCard.steps.map((step, idx) => <li key={idx} className="mb-1">{step}</li>)}
            </ol>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setLiked(p => !p)}
                className={`px-4 py-2 rounded-full text-white ${liked ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
              >
                {liked ? "❤️ Liked" : "🤍 Like this recipe"}
              </button>
              <button onClick={downloadRecipe} className="px-4 py-2 rounded-full text-white bg-green-600 hover:bg-green-700">
                ⬇️ Download Recipe
              </button>
            </div>
          </div>
        )}

        {showInstacart && selectedItems.length > 0 && (
          <div className="bg-white mt-4 p-4 rounded-xl shadow-lg border border-green-300">
            <h3 className="text-md font-semibold text-green-800 mb-2">🛍 Your Grocery Basket:</h3>
            <ul className="list-disc list-inside space-y-2 mb-2">
              {selectedItems.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{item}</span>
                  <input type="text" placeholder="Qty" className="w-16 border rounded px-2 py-1 text-sm" />
                </li>
              ))}
            </ul>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full"
              onClick={() => alert("🛒 Order placed! (<will be replaced by instacart api logic after developer api approval>)")}
            >
              ✅ Mark as Ordered
            </button>
            <button className="ml-2 text-green-800 underline text-sm" onClick={() => alert("📧 email sent to your inbox!")}>
              📧 Send to my email
            </button>
          </div>
        )}
      </div>

      {/* ===== Sticky composer with ATTACH + MIC + SEND ===== */}
      <div className="sticky bottom-0 pt-3 bg-gradient-to-t from-[rgba(255,243,222,0.96)] to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button onClick={handleAttachClick} className="dm-attach-btn rounded-full p-2" title="Attach photo">
            📎
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 dm-input focus:outline-none"
            placeholder="Ask me anything…"
          />

          <button onClick={handleMicClick} className="dm-mic-btn rounded-full p-2 text-xl" title="Speak">🎤</button>
          <button onClick={handleSend} className="dm-send-btn px-4 py-2 rounded-full" title="Send">➤</button>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
