const PIXELLAB_ENDPOINT = 'https://api.pixellab.ai/v1/generate-image-pixflux';

function toSafeInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

/**
 * Creates a PixelLab image from a text description.
 * Mirrors the provided curl request to /generate-image-pixflux.
 */
export async function generatePixfluxImage({
  description,
  width = 128,
  height = 128,
  noBackground = true,
  token = import.meta.env.VITE_PIXELLAB_SECRET_TOKEN || import.meta.env.PIXELLAB_SECRET_TOKEN,
  signal,
} = {}) {
  const prompt = (description || '').trim();
  if (!prompt) {
    throw new Error('PixelLab description is required.');
  }

  if (!token) {
    throw new Error('Missing PixelLab token. Set VITE_PIXELLAB_SECRET_TOKEN in .env or pass token explicitly.');
  }

  const payload = {
    description: prompt,
    image_size: {
      width: toSafeInteger(width, 128),
      height: toSafeInteger(height, 128),
    },
    no_background: Boolean(noBackground),
  };

  const response = await fetch(PIXELLAB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const responseText = await response.text();
  let responseData = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
  }

  if (!response.ok) {
    const details = responseData?.error || responseData?.message || responseText || `HTTP ${response.status}`;
    throw new Error(`PixelLab request failed: ${details}`);
  }

  return responseData;
}
