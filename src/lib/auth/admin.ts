import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function verifyAdmin() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    // When called outside Next.js request context or if token is absent/invalid
    session = null;
  }

  if (!session || !session.user?.id) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Please log in to access this endpoint." },
        { status: 401 }
      ),
      user: null,
    };
  }

  const [userRecord] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord || userRecord.role !== "admin") {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. Administrative privileges required." },
        { status: 403 }
      ),
      user: null,
    };
  }

  return {
    errorResponse: null,
    user: userRecord,
  };
}
