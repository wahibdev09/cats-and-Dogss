import { GoogleGenAI, Type } from "@google/genai";
import { ClassItem, PredictionResult, ModelType } from '../types';

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    if (!process.env.API_KEY) {
      console.error("API Key not found");
      return null;
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const classifyWithGemini = async (
  imageBase64: string, 
  classes: ClassItem[]
): Promise<PredictionResult> => {
  const ai = getGenAI();
  if (!ai) {
    return {
      modelName: ModelType.GEMINI,
      className: "Error",
      confidence: 0,
      reasoning: "API Key Missing"
    };
  }

  const classNames = classes.map(c => c.name).join(", ");
  
  // Clean base64 string
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image and classify it into exactly one of the following categories: [${classNames}]. 
                   Return the class name, a confidence score between 0 and 1, and a short reasoning.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            className: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["className", "confidence", "reasoning"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        modelName: ModelType.GEMINI,
        className: result.className,
        confidence: result.confidence,
        reasoning: result.reasoning
      };
    }
    
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Classification Error:", error);
    return {
      modelName: ModelType.GEMINI,
      className: "Error",
      confidence: 0,
      reasoning: "API Request Failed"
    };
  }
};