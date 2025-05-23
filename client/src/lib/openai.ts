import { apiRequest } from "./queryClient";

export interface ChatCompletionResponse {
  reply: string;
}

export async function getChatbotResponse(message: string): Promise<ChatCompletionResponse> {
  try {
    const response = await apiRequest("POST", "/api/chat", { message });
    return await response.json();
  } catch (error) {
    console.error("Error getting response from OpenAI:", error);
    throw error;
  }
}

export interface PropertyRecommendation {
  propertyIds: number[];
  message: string;
}

export async function getPropertyRecommendations(
  query: string
): Promise<PropertyRecommendation> {
  try {
    const response = await apiRequest("POST", "/api/properties/recommend", { query });
    return await response.json();
  } catch (error) {
    console.error("Error getting property recommendations:", error);
    throw error;
  }
}
