import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Check for Supabase session cookies
    // Supabase uses different cookie patterns based on project ref
    const cookies = request.cookies.getAll();
    const hasSupabaseSession = cookies.some(cookie =>
        cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );

    const { pathname } = request.nextUrl;

    // Protected Routes
    const protectedPaths = [
        '/',
        '/hr',
        '/finance',
        '/inventory',
        '/settings',
        '/kitchen',
        '/pos',
        '/production',
        '/kds',
        '/staff-portal',
        '/admin',
        '/analytics',
        '/customers',
        '/recipes',
        '/suppliers',
        '/equipment',
        '/delivery',
        '/audit-log',
        '/notifications'
    ];

    const isProtected = protectedPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Auth Routes
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

    // If no session and trying to access protected route, redirect to login
    if (isProtected && !hasSupabaseSession) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // If session exists and trying to access auth pages, redirect to home
    if (isAuthPage && hasSupabaseSession) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
