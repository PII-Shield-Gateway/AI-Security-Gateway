const API_BASE_URL = "http://localhost:5000";

export async function filterText(text) {
  const response = await fetch(`${API_BASE_URL}/gateway/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Gateway API request failed with status ${response.status}`);
  }

  return response.json();
}

export { API_BASE_URL };
