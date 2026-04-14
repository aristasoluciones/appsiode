import { NextRequest, NextResponse } from 'next/server';

function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}

function resolveAccessToken(request: NextRequest) {
  return (
    request.cookies.get('AccessToken')?.value ||
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value
  );
}

export function middleware(request: NextRequest) {
  const accessToken = resolveAccessToken(request);
  const signinUrl = request.nextUrl.clone();
  signinUrl.pathname = `${request.nextUrl.basePath || ''}/signin`;
  signinUrl.search = '';
  signinUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);

  if (!accessToken) {
    return NextResponse.redirect(signinUrl);
  }

  // Check JWT expiration without full validation
  try {
    const payload = decodeJwtPayload(accessToken);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return NextResponse.redirect(signinUrl);
    }
  } catch {
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|signin|signup|reset-password|change-password|verify-email|_next/static|_next/image|favicon\.ico|media).*)',
  ],
};
