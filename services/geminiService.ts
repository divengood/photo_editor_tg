
// Fix: Import GenerateContentResponse for proper typing.
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash-image';

// Fix: Use GenerateContentResponse type for the response parameter to improve type safety.
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
