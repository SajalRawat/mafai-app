import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: We can't import the logger lib here directly if it uses Node.js specific APIs not available in Edge runtime,
// but since our logger uses console.log/std out which is supported, it can be okay.
// However, Middleware in Next.js runs on Edge Runtime by default where some Node APIs are restricted.
// Simple console.log works fine.

export function middleware(request: NextRequest) {
    const { method, nextUrl } = request;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log request details to stdout (captured by Docker)
    console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        type: 'ACCESS_LOG',
        method,
        path: nextUrl.pathname,
        ip,
        userAgent
    }));

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/_next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
