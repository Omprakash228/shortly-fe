import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    // Call backend public redirect endpoint to get the original URL
    const response = await fetch(API_ENDPOINTS.redirect(shortCode), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If URL not found, return 404
      return NextResponse.json(
        { error: "Short URL not found or expired" },
        { status: 404 }
      );
    }

    // Get the original URL from the response
    const data = await response.json();
    const originalURL = data.original_url;

    if (!originalURL) {
      return NextResponse.json(
        { error: "Invalid URL data" },
        { status: 500 }
      );
    }

    // Redirect to the original URL with 301 (Moved Permanently)
    return NextResponse.redirect(originalURL, { status: 301 });
  } catch (error) {
    console.error("Error redirecting URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

