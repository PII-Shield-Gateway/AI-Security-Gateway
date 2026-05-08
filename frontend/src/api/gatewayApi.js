const API_BASE_URL = "http://localhost:5000";

export async function filterText(text, options = {}) {
  const response = await fetch(`${API_BASE_URL}/gateway/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      save: options.save ?? false,
      output_format: options.outputFormat ?? "txt",
    }),
  });

  if (!response.ok) {
    throw new Error("Gateway API request failed");
  }

  return response.json();
}

export async function saveFilteredText(text, outputFormat = "txt") {
  const response = await fetch(`${API_BASE_URL}/gateway/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      save: true,
      output_format: outputFormat,
    }),
  });

  if (!response.ok) {
    throw new Error("Filtered file save request failed");
  }

  return response.json();
}

export { API_BASE_URL };
