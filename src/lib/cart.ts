"use server";

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { v4 as uuidv4 } from "uuid";

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;
  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set("cart_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
    });
  }
  return sessionId;
}

export async function getCart(sessionId: string) {
  return prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getCartItemCount(sessionId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: { items: true },
  });
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
