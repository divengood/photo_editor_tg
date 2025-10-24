import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const model = 'gemini-2.5-flash-image';

/**
 * Lazily initializes and returns the GoogleGenAI client.
 * Throws an error if the API key is not configured.
 * This prevents the entire app from crashing on load if the key is missing.
 */
const getAiClient = () => {
  // Fix: Per Gemini guidelines, the API key must be obtained from process.env.API_KEY.
  // This resolves issues with Vite-specific environment variable types.
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    // Fix: Updated error message to reference the correct API_KEY environment variable.
    throw new Error("Google AI API Key is not configured. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

const extractImage = (response: GenerateContentResponse): string => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }
  throw new Error("No image data found in Gemini response");
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  return extractImage(response);
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = imageBase64.split(',')[1];
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  return extractImage(response);
};