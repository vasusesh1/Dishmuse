import React from "react";

export default function ChatMessage({ message, isUser }) {
  // Try to match a recipe format
  const recipeMatch = message.match(/\*\*(.+?)\*\*.*?Serves:\*\*\s*(.+?)\s*\*\*Ingredients:\*\*([\s\S]+?)\*\*Steps:\*\*([\s\S]+)/i);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={
          "px-4 py-2 rounded-2xl max-w-[70%] shadow-md " +
          (isUser ? "bg-amber-100 text-right" : "bg-cream text-left")
        }
      >
        {recipeMatch ? (
          <div className="space-y-3 text-left">
            <h2 className="text-lg font-bold">{recipeMatch[1]}</h2>
            <p className="text-sm text-gray-700">Serves: {recipeMatch[2]}</p>
            <div>
              <h3 className="font-semibold">Ingredients:</h3>
              <ul className="list-disc list-inside text-sm">
                {recipeMatch[3]
                  .split(/[\n•\-–●☆★▪️•]+/)
                  .map((line, idx) => line.trim())
                  .filter(Boolean)
                  .map((ingredient, idx) => (
                    <li key={idx}>{ingredient}</li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Steps:</h3>
              <ol className="list-decimal list-inside text-sm space-y-1">
                {recipeMatch[4]
                  .split(/\d+\.\s/)
                  .map((step, idx) => step.trim())
                  .filter(Boolean)
                  .map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
              </ol>
            </div>
          </div>
        ) : (
          <span>{message}</span>
        )}
      </div>
    </div>
  );
}

