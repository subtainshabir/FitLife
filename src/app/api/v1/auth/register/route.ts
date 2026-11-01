import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userSettings } from "@/db/schema";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check for existing user with duplicate email
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Create user and initialize default settings in a transaction
    const [newUser] = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        });

      await tx.insert(userSettings).values({
        userId: user.id,
        theme: "system",
        language: "en",
        notificationsEnabled: true,
      });

      return [user];
    });

    return NextResponse.json(
      {
        message: "User registered successfully.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while registering user." },
      { status: 500 }
    );
  }
}

