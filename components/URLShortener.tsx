"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ShortenResponse {
  short_code: string;
  short_url: string;
  original_url: string;
  expires_at?: string;
  created_at: string;
}

interface URLItem {
  short_code: string;
  original_url: string;
  expires_at?: string;
  created_at: string;
  click_count: number;
}

export default function URLShortener() {
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [editingShortCode, setEditingShortCode] = useState<string | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [viewingStats, setViewingStats] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(24);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch user URLs
  const fetchUrls = async () => {
    if (!session) return;
    
    setLoadingUrls(true);
    try {
      const response = await fetch("/api/urls");
      if (response.ok) {
        const data = await response.json();
        setUrls(data);
      }
    } catch (error) {
      console.error("Error fetching URLs:", error);
    } finally {
      setLoadingUrls(false);
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (session) {
      fetchUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu && !(event.target as Element).closest('.menu-container')) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenu]);

  // Conditional returns after all hooks
  if (status === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-8">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sign in required
          </h3>
          <p className="text-gray-600 mb-4">
            Please sign in to shorten URLs
          </p>
          <Link
            href="/auth/signin"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Validate custom short code if provided
    if (customShortCode.trim()) {
      const trimmedCode = customShortCode.trim();
      
      // Frontend validation
      if (trimmedCode.length < 3) {
        setError("Custom short code must be at least 3 characters long");
        setLoading(false);
        return;
      }
      if (trimmedCode.length > 20) {
        setError("Custom short code must be at most 20 characters long");
        setLoading(false);
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedCode)) {
        setError("Custom short code can only contain letters, numbers, hyphens, and underscores");
        setLoading(false);
        return;
      }
    }

    try {
      const requestBody: any = { url };
      if (customShortCode.trim()) {
        requestBody.short_code = customShortCode.trim();
      }

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to shorten URL: ${response.statusText}`
        );
      }

      const data = await response.json();
      setResult(data);
      setUrl("");
      setCustomShortCode("");
      // Refresh URLs list
      fetchUrls();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to shorten URL";
      setError(errorMessage);
      console.error("Error shortening URL:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      setError("Failed to copy to clipboard");
    }
  };

  const handleDelete = async (shortCode: string) => {
    if (!confirm("Are you sure you want to delete this URL?")) {
      return;
    }

    try {
      const response = await fetch(`/api/urls/${shortCode}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete URL");
      }

      fetchUrls();
      alert("URL deleted successfully");
    } catch (error) {
      console.error("Error deleting URL:", error);
      alert("Failed to delete URL");
    }
  };

  const handleEdit = (urlItem: URLItem) => {
    setEditingShortCode(urlItem.short_code);
    setEditExpiresAt(
      urlItem.expires_at
        ? new Date(urlItem.expires_at).toISOString().slice(0, 16)
        : ""
    );
  };

  const handleSaveEdit = async (shortCode: string) => {
    try {
      const expiresAt = editExpiresAt
        ? new Date(editExpiresAt).toISOString()
        : null;

      const response = await fetch(`/api/urls/${shortCode}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires_at: expiresAt }),
      });

      if (!response.ok) {
        throw new Error("Failed to update URL");
      }

      setEditingShortCode(null);
      setEditExpiresAt("");
      fetchUrls();
      alert("URL updated successfully");
    } catch (error) {
      console.error("Error updating URL:", error);
      alert("Failed to update URL");
    }
  };

  const handleViewStats = async (shortCode: string) => {
    try {
      const response = await fetch(`/api/stats/${shortCode}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setViewingStats(shortCode);
        setSelectedPeriod(24);
        // Fetch initial analytics
        fetchAnalytics(shortCode, 24);
      } else {
        alert("Failed to fetch stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      alert("Failed to fetch stats");
    }
  };

  const fetchAnalytics = async (shortCode: string, hours: number) => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/analytics/${shortCode}?hours=${hours}`);
      if (response.ok) {
        const data = await response.json();
        // Format data for chart - convert UTC to local timezone
        // Ensure data is an array before mapping
        if (Array.isArray(data)) {
          const formattedData = data.map((item: any) => {
            // Parse the UTC time string and convert to local time
            const utcTime = new Date(item.time);
            // Format in local timezone
            return {
              time: format(utcTime, getTimeFormat(hours)),
              clicks: item.count,
            };
          });
          setAnalytics(formattedData);
        } else {
          setAnalytics([]);
        }
      } else {
        setAnalytics([]);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const getTimeFormat = (hours: number): string => {
    if (hours <= 12) return "HH:mm";
    if (hours <= 24) return "HH:mm";
    if (hours <= 72) return "MM-dd HH:mm";
    return "MM-dd";
  };

  const handlePeriodChange = (hours: number) => {
    setSelectedPeriod(hours);
    if (viewingStats) {
      fetchAnalytics(viewingStats, hours);
    }
  };

  const getShortUrl = (shortCode: string) => {
    // Use frontend URL so redirects go through Next.js
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${shortCode}`;
    }
    // Fallback for SSR
    return `/${shortCode}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter URL to shorten
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="customShortCode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Custom Short Code <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="customShortCode"
            value={customShortCode}
            onChange={(e) => {
              // Only allow alphanumeric, hyphens, and underscores
              const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
              setCustomShortCode(value);
              setError(null);
            }}
            placeholder="my-custom-code"
            maxLength={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, letters, numbers, hyphens, and underscores only
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Shortening..." : "Shorten URL"}
        </button>
      </form>

      {result && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            URL Shortened Successfully!
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Short URL:
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={result.short_url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(result.short_url)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Original URL:
              </label>
              <p className="mt-1 text-sm text-gray-600 break-all">
                {result.original_url}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URLs Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your Shortened URLs
        </h2>
        {loadingUrls ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : urls.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No shortened URLs yet. Create your first one above!
          </p>
        ) : (
          <div className="w-full">
            <table className="w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {urls.map((urlItem) => (
                  <tr key={urlItem.short_code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-md truncate" title={urlItem.original_url}>
                        {urlItem.original_url}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-mono text-xs">
                          {getShortUrl(urlItem.short_code)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(getShortUrl(urlItem.short_code))}
                          className="p-1 text-gray-900 hover:text-gray-700 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Copy short URL"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {editingShortCode === urlItem.short_code ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={editExpiresAt}
                            onChange={(e) => setEditExpiresAt(e.target.value)}
                            min={(() => {
                              const now = new Date();
                              // Convert to local time for datetime-local input
                              const year = now.getFullYear();
                              const month = String(now.getMonth() + 1).padStart(2, '0');
                              const day = String(now.getDate()).padStart(2, '0');
                              const hours = String(now.getHours()).padStart(2, '0');
                              const minutes = String(now.getMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day}T${hours}:${minutes}`;
                            })()}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <button
                            onClick={() => handleSaveEdit(urlItem.short_code)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingShortCode(null);
                              setEditExpiresAt("");
                            }}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : urlItem.expires_at ? (
                        format(new Date(urlItem.expires_at), "PPp")
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="relative menu-container">
                        <button
                          onClick={() =>
                            setOpenMenu(
                              openMenu === urlItem.short_code
                                ? null
                                : urlItem.short_code
                            )
                          }
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Actions menu"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                        {openMenu === urlItem.short_code && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleEdit(urlItem);
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleViewStats(urlItem.short_code);
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                  />
                                </svg>
                                View Stats
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenu(null);
                                  handleDelete(urlItem.short_code);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {viewingStats && stats && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">URL Statistics</h3>
              <button
                onClick={() => {
                  setViewingStats(null);
                  setStats(null);
                  setAnalytics([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* URL Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Original URL:</span>
                  <p className="text-gray-900 break-all mt-1">{stats.original_url}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Short URL:</span>
                  <p className="text-gray-900 font-mono mt-1">{getShortUrl(stats.short_code)}</p>
                </div>
                {stats.expires_at ? (
                  <div>
                    <span className="font-medium text-gray-700">Expires At:</span>{" "}
                    <span className="text-gray-900">
                      {format(new Date(stats.expires_at), "PPp")}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-gray-700">Expires At:</span>{" "}
                    <span className="text-gray-400">Never</span>
                  </div>
                )}
              </div>
              
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <span className="font-medium text-gray-700 mb-2">QR Code</span>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <img
                    src={`/api/qrcode/${stats.short_code}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <a
                  href={`/api/qrcode/${stats.short_code}`}
                  download={`qrcode-${stats.short_code}.png`}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Download QR Code
                </a>
              </div>
            </div>

            {/* Time Period Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { hours: 6, label: "6 hrs" },
                  { hours: 12, label: "12 hrs" },
                  { hours: 24, label: "24 hrs" },
                  { hours: 72, label: "3 days" },
                  { hours: 168, label: "7 days" },
                  { hours: 336, label: "14 days" },
                  { hours: 720, label: "30 days" },
                ].map(({ hours, label }) => (
                  <button
                    key={hours}
                    onClick={() => handlePeriodChange(hours)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === hours
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Click Activity
              </h4>
              {loadingAnalytics ? (
                <div className="flex justify-center items-center h-64">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
              ) : analytics.length === 0 ? (
                <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No click data available for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

