} catch (e) {
  // Fallback if AI doesn't return valid JSON
  result = {
    name: `${args.ingredient1} ${args.ingredient2}`,
    emoji: "🍽️",
  };
}
