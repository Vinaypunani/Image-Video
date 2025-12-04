import { GoogleGenAI } from "@google/genai";

// We create instances dynamically to ensure fresh keys, 
// but keep a default one for simple text tasks if needed.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhances a user's prompt using Gemini 2.5 Flash (Text).
 */
export const enhanceUserPrompt = async (originalPrompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert AI prompt engineer. Rewrite the following simple prompt to be highly descriptive, artistic, and optimized for a generative AI model (image or video). Keep it under 50 words. Only return the enhanced prompt text, no explanations.
      
      Original Prompt: "${originalPrompt}"`,
    });
    
    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return originalPrompt; // Fallback to original if enhancement fails
  }
};

/**
 * Generates or Edits an image using Gemini 2.5 Flash Image.
 */
export const generateImageContent = async (
  prompt: string, 
  referenceImageBase64?: string, 
  mimeType: string = 'image/png'
): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const parts: any[] = [];

    // If a reference image is provided, we add it to the parts (Image Editing Mode)
    if (referenceImageBase64) {
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.warn("No image found in response:", response);
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Generates a Video using Veo (gemini-2.5-flash does not support video gen yet, using Veo preview).
 */
export const generateVideoContent = async (
  prompt: string,
  startImageBase64?: string,
  mimeType: string = 'image/png'
): Promise<string | null> => {
  try {
    // 1. Check/Request API Key (Mandatory for Veo)
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        const success = await (window as any).aistudio.openSelectKey();
        if (!success) {
          throw new Error("API Key selection is required for video generation.");
        }
      }
    }

    // 2. Initialize Client with (potentially new) Key
    const ai = getAiClient();

    // 3. Prepare Config
    // If we have an image, we pass it. Veo supports image input for start frame.
    const imageInput = startImageBase64 ? {
      imageBytes: startImageBase64.split(',')[1] || startImageBase64,
      mimeType: mimeType,
    } : undefined;

    // 4. Start Operation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: imageInput, 
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9', // Defaulting to landscape for video
      }
    });

    // 5. Poll for completion
    // Veo generation takes time, so we loop until done.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // 6. Retrieve Video
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("Video generation completed but no URI returned.");
    }

    // 7. Fetch the actual video bytes using the API Key
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};
