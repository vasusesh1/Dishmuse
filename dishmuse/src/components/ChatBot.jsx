import React, { useState, useEffect, useRef } from "react";

export default function ChatBot({
  greeting = "Welcome to DishMuse! Your recipe assistant.",
  typingIndicator = true,
  emojiReactions = true,
}) {
  // ---------- minimal chat state ----------
  const [messages, setMessages] = useState([{ text: greeting, isUser: false }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // minimal stages (optional, used only for UI toggles)
  const [stage, setStage] = useState("chat");

  // Structured shopping list from backend
  const [shoppingList, setShoppingList] = useState([]);
  const [showShoppingCard, setShowShoppingCard] = useState(false);

  // When backend sends a one-big-text shopping list
  const [shoppingTextMsgIndex, setShoppingTextMsgIndex] = useState(null);

  // Recipe scroll (if backend returns one)
  const [recipeCard, setRecipeCard] = useState(null);
  const [showRecipeScroll, setShowRecipeScroll] = useState(false);

  // moodboards kept out on purpose per your request
  const listRef = useRef(null);

  // session id for backend correlation
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem("dishMuseSession");
    if (saved) return saved;
    const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem("dishMuseSession", id);
    return id;
  });

  // ---------- utilities ----------
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping, showShoppingCard, showRecipeScroll]);

  // remove brand/delivery lines that look salesy (kept, but narrower)
  const sanitize = (text = "") => {
    const killLine = /order|deliver(y|ies)|pickup|curbside|instacart|uber\s*eats|shipt|online\s+checkout/i;
    return text
      .split("\n")
      .filter((ln) => !killLine.test(ln))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // very light heuristic for “this looks like a shopping list”
  const looksLikeShoppingList = (txt = "") => {
    const t = txt.trim();
    if (!t) return false;
    const lines = t.split("\n");
    const bulletCount = lines.filter((l) => /^\s*(?:[-•]|\d+\.)\s+/.test(l)).length;
    const hasCue = /shopping list|ingredients you’ll need|you will need/i.test(t);
    return bulletCount >= 6 || hasCue;
  };

  const wantsShoppingList = (txt) =>
    /shopping\s*list|grocery\s*list|what do i need|make.*list|give me.*list|list please|show.*list/i.test(
      txt.toLowerCase()
    ) || /^list$/i.test(txt.trim());

  // helper: push assistant/user message
  const pushAssistant = (text) =>
    setMessages((p) => [...p, { text, isUser: false }]);
  const pushUser = (text) => setMessages((p) => [...p, { text, isUser: true }]);

  // ---------- downloads ----------
  const downloadTextFile = (filename, textOrLines) => {
    const content = Array.isArray(textOrLines) ? textOrLines.join("\n") : String(textOrLines);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadShoppingList = () => {
    if (!shoppingList.length) return;
    const lines = [
      "DishMuse Shopping List",
      "======================",
      ...shoppingList.map(({ name, qty, unit, optional }) =>
        `${optional ? "[optional] " : ""}${name}${qty ? ` — ${qty}${unit ? " " + unit : ""}` : ""}`
      ),
      "",
    ];
    downloadTextFile("DishMuse_Shopping_List.txt", lines);
  };

  const downloadShoppingTextFromMsg = (idx) => {
    const msg = messages[idx]?.text || "";
    if (!msg) return;
    downloadTextFile("DishMuse_Shopping_List.txt", msg);
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
    downloadTextFile(`${(recipeCard.name || "Recipe").replace(/\s+/g, "_")}.txt`, lines);
  };

  // ---------- send ----------
  const handleSend = async () => {
    const userText = input.trim();
    if (!userText) return;

    // Add user bubble
    pushUser(userText);
    setInput("");

    // clear transient panels
    setShowRecipeScroll(false);
    setRecipeCard(null);
    setShowShoppingCard(false);
    setShoppingList([]);
    setStage("chat");
    setShoppingTextMsgIndex(null);

    if (typingIndicator) setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/dishmuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: keep payload minimal; do NOT send inventory/extra flags
        body: JSON.stringify({
          input: userText,
          sessionId,
          noOnlineShopping: true,
          // Only nudge list mode if the USER asked for it explicitly
          forceGroceryStage: wantsShoppingList(userText),
          shoppingListOnly: wantsShoppingList(userText),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        pushAssistant("Server error: " + (data.error || "unknown"));
        return;
      }

      // 1) Structured shopping list
      if (Array.isArray(data.groceryList) && data.groceryList.length > 0) {
        const normalized = (data.groceryList || []).map((g) =>
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
        setShoppingList(normalized);
        setShowShoppingCard(true);
        setStage("shopping_list");
      }

      // 2) Recipe scroll (optional)
      if (data.recipeCard) {
        setRecipeCard(data.recipeCard);
        setShowRecipeScroll(true);
        setStage("recipe");
      }

      // 3) Normal assistant reply
      if (data.reply) {
        const safeReply = sanitize(data.reply);
        const isListText = looksLikeShoppingList(safeReply) && wantsShoppingList(userText);
        const idxBefore = messages.length + 1; // +1 because we already pushed the user message

        pushAssistant(safeReply);

        // If the reply itself looks like a shopping list, offer a download button right under it
        if (isListText) {
          setShoppingTextMsgIndex(idxBefore); // index of the assistant message we just pushed
        }
      }
    } catch (err) {
      console.error(err);
      pushAssistant("Oops! Something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="flex flex-col h-full w-full">
      {/* Conversation */}
      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 -mr-1 scroll-smooth">
        {messages.map((m, i) => {
          const showDownloadForThisTextList = i === shoppingTextMsgIndex;
          return (
            <div key={i} className={`flex ${m.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-2 rounded-2xl max-w-[75%] whitespace-pre-wrap ${
                  m.isUser ? "msg-user text-right" : "msg-assistant text-left"
                }`}
              >
                {m.text}
                {emojiReactions && !m.isUser && <div className="mt-1 text-sm">🤩 🍽️</div>}

                {showDownloadForThisTextList && (
                  <div className="mt-2">
                    <button
                      onClick={() => downloadShoppingTextFromMsg(i)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full"
                    >
                      ⬇️ Download List
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl msg-assistant text-sm">
              <span className="dm-typing"><span>•</span><span>•</span><span>•</span></span>
            </div>
          </div>
        )}

        {/* Structured Shopping List Card (always shows Download when present) */}
        {showShoppingCard && shoppingList.length > 0 && (
          <div className="bg-white mt-2 p-4 rounded-xl shadow-lg border border-green-300">
            <h3 className="text-md font-semibold text-green-800 mb-2">🛒 Shopping List</h3>
            <ul className="list-disc list-inside text-sm text-gray-800">
              {shoppingList.map(({ name, qty, unit, optional }, idx) => (
                <li key={idx}>
                  {optional ? "(optional) " : ""}
                  {name}
                  {qty ? ` — ${qty}${unit ? " " + unit : ""}` : ""}
                </li>
              ))}
            </ul>

            <div className="mt-3">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full"
                onClick={downloadShoppingList}
              >
                ⬇️ Download List
              </button>
            </div>
          </div>
        )}

        {/* Recipe Scroll (optional) */}
        {showRecipeScroll && recipeCard && (
          <div className="dm-scroll">
            <div className="dm-scroll-inner">
              <h2 className="text-xl font-extrabold text-amber-800 mb-2">{recipeCard.name}</h2>
              {!!recipeCard.serves && <p className="text-sm text-amber-900/80 mb-3">{recipeCard.serves}</p>}
              <h3 className="font-semibold text-amber-900 mb-1">Ingredients:</h3>
              <ul className="list-disc list-inside mb-3 text-[15px] leading-relaxed text-amber-900">
                {(recipeCard.ingredients || []).map((x, idx) => <li key={idx}>{x}</li>)}
              </ul>
              <h3 className="font-semibold text-amber-900 mb-1">Steps:</h3>
              <ol className="list-decimal list-inside text-[15px] leading-relaxed text-amber-900">
                {(recipeCard.steps || []).map((s, idx) => <li key={idx} className="mb-1">{s}</li>)}
              </ol>
            </div>

            <div className="mt-3">
              <button onClick={downloadRecipe} className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white">
                ⬇️ Download Recipe
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 pt-3 bg-gradient-to-t from-[rgba(255,243,222,0.96)] to-transparent backdrop-blur-[2px]">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 dm-input focus:outline-none"
            placeholder="Ask me anything…"
          />
          <button onClick={handleSend} className="dm-send-btn px-4 py-2 rounded-full" title="Send">➤</button>
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </div>
  );
}
