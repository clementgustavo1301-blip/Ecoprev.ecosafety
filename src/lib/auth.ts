import { cookies } from 'next/headers';
import { prisma } from './db';

export const SESSION_COOKIE_NAME = 'ecoprev_session';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionUserId) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId }
    });
    return user;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
