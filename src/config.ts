export const config = {
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL,
  model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
}
