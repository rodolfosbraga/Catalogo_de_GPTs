import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Using jose for JWT verification as it's edge-compatible

// Define the structure of the environment variables provided by Cloudflare
// interface Env { // Removed unused interface
//   JWT_SECRET: string;
// }

// Define the structure of the JWT payload
interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  // Add other fields if included in your token
}

// Use environment variable directly or fallback
const JWT_SECRET_BYTES = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret'); 

// Function to verify JWT
async function verifyToken(token: string): Promise<JwtPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<JwtPayload>(token, JWT_SECRET_BYTES);
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  // Allow access to static files, API routes (except protected ones if any), login, signup, paywall
  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/') || // Allow all API routes (webhook needs access)
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname === '/paywall' || // Allow access to paywall page
    pathname === '/favicon.ico' || // Allow favicon
    pathname.startsWith('/icons/') // Allow PWA icons
  ) {
    return NextResponse.next();
  }

  // Verify token for all other routes (e.g., the main catalog page '/')
  const user = await verifyToken(authToken || '');

  if (!user) {
    // If no valid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: pass redirect info
    return NextResponse.redirect(loginUrl);
  }

  // --- Role-Based Access Control ---
  // 'invited' and 'paid' users should have access to the main catalog ('/').
  // 'guest' users (signed up without invite/payment) should be redirected to the paywall.

  if (user.role === 'guest' && pathname === '/') {
      // Redirect guests trying to access the main catalog to the paywall page
      console.log('Guest user redirected to paywall from:', pathname);
      return NextResponse.redirect(new URL('/paywall', request.url)); 
  }
  
  // Allow 'invited' and 'paid' users to access the main catalog ('/')
  if ((user.role === 'invited' || user.role === 'paid') && pathname === '/') {
      return NextResponse.next();
  }

  // Add rules for other potential protected routes if necessary

  // Fallback: If the route is not explicitly handled and the user is authenticated but doesn't meet role criteria for it,
  // maybe redirect to home or show an unauthorized page. For now, let's allow if authenticated.
  // Consider refining this based on specific application needs.
  console.log(`Authenticated user (${user.role}) accessed: ${pathname}`);
  return NextResponse.next();
}

// Specify paths where the middleware should run
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons/ (PWA icons)
     * - api/ (API routes, including auth and webhook)
     * - login (login page)
     * - signup (signup page)
     * - paywall (paywall page)
     * But explicitly include '/' (home page) and potentially other protected pages.
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|api/|login|signup|paywall).*)',
    '/', // Ensure home page is matched
  ],
};

