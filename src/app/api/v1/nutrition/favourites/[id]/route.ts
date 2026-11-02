import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favouriteFoods } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const targetId = params.id;

    // Check by favouriteId or foodItemId
    const [existing] = await db
      .select()
      .from(favouriteFoods)
      .where(
        and(
          eq(favouriteFoods.userId, userId),
          or(eq(favouriteFoods.id, targetId), eq(favouriteFoods.foodItemId, targetId))
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Favourite not found" }, { status: 404 });
    }

    await db.delete(favouriteFoods).where(eq(favouriteFoods.id, existing.id));

    return NextResponse.json({
      success: true,
      message: "Removed from favourite foods",
    });
  } catch (error: any) {
    console.error("DELETE /api/v1/nutrition/favourites/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to remove favourite", details: error.message },
      { status: 500 }
    );
  }
}

