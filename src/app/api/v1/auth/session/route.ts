import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
