import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { UserRole } from '@prisma/client';

const SESSION_COOKIE = 'rdo_session';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET não configurado ou muito curto.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser extends JWTPayload {
  sub: string; // user id
  name: string;
  email: string;
  role: UserRole;
}

// ----------------------------------------------------------------------------
// Senhas
// ----------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------------------------------------------
// Tokens JWT
// ----------------------------------------------------------------------------

export async function signToken(payload: {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionUser;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Sessão (cookies httpOnly)
// ----------------------------------------------------------------------------

export async function createSession(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): Promise<void> {
  const token = await signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { SESSION_COOKIE };
