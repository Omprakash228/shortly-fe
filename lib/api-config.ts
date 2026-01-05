export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  shorten: `${API_BASE_URL}/api/v1/shorten`,
  redirect: (shortCode: string) => `${API_BASE_URL}/api/v1/redirect/${shortCode}`,
  stats: (shortCode: string) => `${API_BASE_URL}/api/v1/url/${shortCode}`,
  analytics: (shortCode: string, hours?: number) => {
    const base = `${API_BASE_URL}/api/v1/url/${shortCode}/analytics`;
    return hours ? `${base}?hours=${hours}` : base;
  },
  delete: (shortCode: string) => `${API_BASE_URL}/api/v1/url/${shortCode}`,
  update: (shortCode: string) => `${API_BASE_URL}/api/v1/url/${shortCode}`,
  userURLs: `${API_BASE_URL}/api/v1/urls`,
  register: `${API_BASE_URL}/api/v1/auth/register`,
  login: `${API_BASE_URL}/api/v1/auth/login`,
  qrcode: (shortCode: string) => `${API_BASE_URL}/api/v1/qrcode/${shortCode}`,
} as const;

