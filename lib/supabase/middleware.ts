// Supabase Middleware Client Configuration
// This file sets up the Supabase client for Edge Runtime / Middleware usage

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from './types';

export function createMiddlewareSupabaseClient(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('[Middleware] Supabase environment variables not set.');
        return { supabase: null, response: NextResponse.next() };
    }

    // Create a response object that we can modify
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Set cookie on the request for subsequent middleware/route handlers
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    // Set cookie on the response to send back to the browser
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    // Remove cookie from request
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    // Remove cookie from response
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    return { supabase, response };
}

// Helper to update response with new cookies after session refresh
export function updateResponseWithCookies(
    request: NextRequest,
    supabase: ReturnType<typeof createServerClient<Database>>
): NextResponse {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    return response;
}
