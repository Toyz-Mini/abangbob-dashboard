import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email-required',
        '/verification-success',
        '/verification-failed',
        '/pos-login',
        '/manager-login',
        '/order-online',
        '/api/auth',
        '/api/webhooks',
    ];

    // Check if current path is public
    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Allow public paths without authentication
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Protected Routes - everything else requires authentication
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
        '/notifications',
        '/menu-management',
        '/outlets',
        '/promotions',
        '/order',
        '/order-display',
        '/order-history',
        '/pending-approval',
        '/complete-profile',
        '/setup',
        '/help',
    ];

    const isProtected = protectedPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // If not a protected path, allow through
    if (!isProtected) {
        return NextResponse.next();
    }

    // Create Supabase client for middleware
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    // If Supabase is not configured, allow through (offline mode)
    if (!supabase) {
        console.warn('[Middleware] Supabase not configured, allowing request through');
        return NextResponse.next();
    }

    try {
        // Get the session - this will refresh the session if needed
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('[Middleware] Session error:', error.message);
        }

        // If no session and trying to access protected route, redirect to login
        if (!session) {
            const url = new URL('/login', request.url);
            url.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(url);
        }

        // Session exists, allow the request and return response with updated cookies
        return response;

    } catch (err) {
        console.error('[Middleware] Unexpected error:', err);
        // On error, redirect to login for safety
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        url.searchParams.set('error', 'session_error');
        return NextResponse.redirect(url);
    }
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
