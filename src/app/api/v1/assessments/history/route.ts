import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bodyAssessments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view assessment history." },
        { status: 401 }
      );
    }

    const history = await db
      .select()
      .from(bodyAssessments)
      .where(eq(bodyAssessments.userId, session.user.id))
      .orderBy(desc(bodyAssessments.createdAt))
      .limit(30);

    return NextResponse.json(
      {
        assessments: history,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get assessment history error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

