import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/api-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    console.log("Analytics route hit");
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { shortCode } = resolvedParams;
    console.log("Fetching analytics for:", shortCode);
    const { searchParams } = new URL(request.url);
    const hours = searchParams.get("hours") || "24";

    // Get JWT token from session
    const token = (session as any).accessToken;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token not found" },
        { status: 401 }
      );
    }

    const response = await fetch(
      API_ENDPOINTS.analytics(shortCode, parseInt(hours)),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch analytics" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

