import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    if (!shortCode) {
      return NextResponse.json(
        { error: "Short code is required" },
        { status: 400 }
      );
    }

    // Proxy request to backend
    const response = await fetch(API_ENDPOINTS.qrcode(shortCode), {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate QR code" },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename=qrcode-${shortCode}.png`,
      },
    });
  } catch (error) {
    console.error("Error proxying QR code request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

