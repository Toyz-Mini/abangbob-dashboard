import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach((cookie) => {
                        request.cookies.set(cookie.name, cookie.value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach((cookie) => {
                        response.cookies.set(cookie.name, cookie.value, cookie.options)
                    })
                },
            },
        }
    )

    // const {
    //     data: { user },
    // } = await supabase.auth.getUser()

    // Protected Routes
    // const protectedPaths = ['/hr', '/finance', '/inventory', '/settings', '/kitchen', '/pos']
    // const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    // if (isProtected && !user) {
    //     return NextResponse.redirect(new URL('/login', request.url))
    // }

    // Auth Routes (redirect to home if already logged in)
    // if (user && request.nextUrl.pathname.startsWith('/login')) {
    //     return NextResponse.redirect(new URL('/', request.url))
    // }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
