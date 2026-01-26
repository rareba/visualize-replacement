/**
 * User database operations using Drizzle ORM
 */
import { eq } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

export const findBySub = async (sub: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.sub, sub))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Ensures an authenticated user has an account
 * on our side.
 *
 * - Uses the "sub" field from the JWT token to ensure
 * uniqueness.
 * - Updates the user name with what is found in the JWT token
 */
export const ensureUserFromSub = async (
  sub: string,
  name: string | undefined | null
) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.sub, sub))
    .limit(1);

  if (user) {
    if (user.name !== name) {
      console.log(`Updating user name from auth provider info`);
      await db
        .update(users)
        .set({ name: name ?? null })
        .where(eq(users.id, user.id));
    }
    return user;
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        sub,
      })
      .returning();
    return newUser;
  }
};
