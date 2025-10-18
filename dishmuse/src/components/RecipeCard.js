export default function RecipeCard({ recipe }) {
    if (!recipe) return null;
  
    return (
      <div className="bg-white p-4 mt-2 rounded-xl shadow-lg border border-amber-300 text-amber-800 w-full">
        <h2 className="text-xl font-bold mb-2">🍽️ {recipe.name}</h2>
        <p className="mb-2">
          <strong>Serves:</strong> {recipe.serves}
        </p>
        <div className="mb-2">
          <strong>Ingredients:</strong>
          <ul className="list-disc list-inside mt-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4">
          <strong>Steps:</strong>
          <ol className="list-decimal list-inside">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
  