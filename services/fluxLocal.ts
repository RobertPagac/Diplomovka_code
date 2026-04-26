
export async function generateFluxTexture(prompt: string, isSeamless: boolean) {
  // Lokálna adresa vášho Python servera
  const LOCAL_SERVER_URL = "http://localhost:5000/generate";
  const textureKeywords = "seamless texture, tiling pattern, flat lighting, top-down view, orthographic, high resolution 8k, highly detailed material, professional game asset, no shadows, no perspective";
  const enhancedPrompt = `${prompt}, ${textureKeywords}`;
  try {
    const response = await fetch(LOCAL_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        seamless: isSeamless,
        num_inference_steps: 20,
        guidance_scale: 3.5,
      }),
    });

    if (!response.ok) throw new Error("Lokálny model neodpovedá. Skontrolujte, či beží Python server.");

    const data = await response.json();
    // Predpokladáme, že server vráti obrázok v base64
    return `data:image/png;base64,${data.image}`;
  } catch (error) {
    console.error("Chyba pri volaní lokálneho modelu:", error);
    throw error;
  }
}
