/**
 * Pixel Tracker Service
 * Unified interface for tracking events across multiple marketing pixels
 * Supports: Facebook/Meta, TikTok, Google Analytics 4, Google Tag Manager
 */

import { PixelSettings, PixelConfig, DEFAULT_PIXEL_SETTINGS } from '@/lib/types';

// Extend Window interface for pixel globals
declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        ttq?: {
            track: (...args: any[]) => void;
            page: () => void;
            identify: (params: object) => void;
        };
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

type PixelEventName =
    | 'PageView'
    | 'Purchase'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'ViewContent'
    | 'Search'
    | 'Lead'
    | 'CompleteRegistration';

interface PurchaseEventData {
    value: number;
    currency: string;
    orderId?: string;
    items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
}

interface ViewContentData {
    contentId: string;
    contentName: string;
    contentCategory?: string;
    value?: number;
    currency?: string;
}

interface AddToCartData {
    contentId: string;
    contentName: string;
    value: number;
    currency: string;
    quantity?: number;
}

class PixelTracker {
    private settings: PixelSettings = DEFAULT_PIXEL_SETTINGS;
    private initialized = false;
    private scriptsLoaded = {
        facebook: false,
        tiktok: false,
        ga4: false,
        gtm: false,
    };

    /**
     * Initialize pixel tracker with settings
     */
    initialize(settings: PixelSettings) {
        this.settings = settings;

        if (typeof window === 'undefined') return;

        this.loadFacebookPixel();
        this.loadTikTokPixel();
        this.loadGoogleAnalytics();
        this.loadGoogleTagManager();

        this.initialized = true;
        this.log('Pixel Tracker initialized');
    }

    /**
     * Update settings without reloading scripts
     */
    updateSettings(settings: PixelSettings) {
        this.settings = settings;
        this.log('Pixel settings updated');
    }

    /**
     * Log debug messages
     */
    private log(...args: any[]) {
        if (this.settings.debugMode) {
            console.log('[PixelTracker]', ...args);
        }
    }

    // ============ SCRIPT LOADERS ============

    private loadFacebookPixel() {
        if (this.scriptsLoaded.facebook || typeof window === 'undefined') return;

        const enabledPixels = this.settings.facebookPixels.filter(p => p.enabled);
        if (enabledPixels.length === 0) return;

        // Load Facebook Pixel base code
        (function (f: any, b: Document, e: string, v: string, n?: any, t?: HTMLScriptElement, s?: HTMLScriptElement) {
            if (f.fbq) return;
            n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e) as HTMLScriptElement;
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
            s?.parentNode?.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        // Initialize all enabled pixels
        enabledPixels.forEach(pixel => {
            window.fbq?.('init', pixel.id);
            this.log(`Facebook Pixel initialized: ${pixel.id} (${pixel.name || 'unnamed'})`);
        });

        this.scriptsLoaded.facebook = true;
    }

    private loadTikTokPixel() {
        if (this.scriptsLoaded.tiktok || typeof window === 'undefined') return;

        const enabledPixels = this.settings.tiktokPixels.filter(p => p.enabled);
        if (enabledPixels.length === 0) return;

        // Store reference to this for use inside IIFE
        const self = this;

        // Load TikTok Pixel base code
        (function (w: any, d: Document, t: string) {
            w.TiktokAnalyticsObject = t;
            var ttq = w[t] = w[t] || [];
            ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
            ttq.setAndDefer = function (t: any, e: string) {
                t[e] = function () {
                    t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                };
            };
            for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
            ttq.instance = function (t: string) {
                var e = ttq._i[t] || [];
                for (var n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                return e;
            };
            ttq.load = function (e: string, n?: any) {
                var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
                ttq._i = ttq._i || {};
                ttq._i[e] = [];
                ttq._i[e]._u = i;
                ttq._t = ttq._t || {};
                ttq._t[e] = +new Date();
                ttq._o = ttq._o || {};
                ttq._o[e] = n || {};
                var o = d.createElement('script');
                o.type = 'text/javascript';
                o.async = true;
                o.src = i + '?sdkid=' + e + '&lib=' + t;
                var a = d.getElementsByTagName('script')[0];
                a?.parentNode?.insertBefore(o, a);
            };

            // Load all enabled pixels
            enabledPixels.forEach(pixel => {
                ttq.load(pixel.id);
                self.log(`TikTok Pixel initialized: ${pixel.id} (${pixel.name || 'unnamed'})`);
            });
        })(window, document, 'ttq');

        this.scriptsLoaded.tiktok = true;
    }

    private loadGoogleAnalytics() {
        if (this.scriptsLoaded.ga4 || typeof window === 'undefined') return;

        const enabledPixels = this.settings.googleAnalytics.filter(p => p.enabled);
        if (enabledPixels.length === 0) return;

        // Load gtag.js
        const firstPixel = enabledPixels[0];
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${firstPixel.id}`;
        document.head.appendChild(script);

        // Initialize dataLayer and gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());

        // Configure all enabled measurement IDs
        enabledPixels.forEach(pixel => {
            window.gtag?.('config', pixel.id);
            this.log(`Google Analytics initialized: ${pixel.id} (${pixel.name || 'unnamed'})`);
        });

        this.scriptsLoaded.ga4 = true;
    }

    private loadGoogleTagManager() {
        if (this.scriptsLoaded.gtm || typeof window === 'undefined') return;

        const enabledPixels = this.settings.googleTagManager.filter(p => p.enabled);
        if (enabledPixels.length === 0) return;

        enabledPixels.forEach(pixel => {
            // Load GTM
            (function (w: any, d: Document, s: string, l: string, i: string) {
                w[l] = w[l] || [];
                w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s) as HTMLScriptElement,
                    dl = l != 'dataLayer' ? '&l=' + l : '';
                j.async = true;
                j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                f?.parentNode?.insertBefore(j, f);
            })(window, document, 'script', 'dataLayer', pixel.id);

            this.log(`Google Tag Manager initialized: ${pixel.id} (${pixel.name || 'unnamed'})`);
        });

        this.scriptsLoaded.gtm = true;
    }

    // ============ EVENT TRACKING ============

    /**
     * Track page view
     */
    trackPageView(pagePath?: string) {
        if (!this.settings.trackPageViews) return;

        const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/');
        this.log('PageView:', path);

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('track', 'PageView');
        }

        // TikTok
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.page();
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', 'page_view', { page_path: path });
        }
    }

    /**
     * Track purchase event
     */
    trackPurchase(data: PurchaseEventData) {
        if (!this.settings.trackPurchases) return;

        this.log('Purchase:', data);

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('track', 'Purchase', {
                value: data.value,
                currency: data.currency,
                content_ids: data.items?.map(i => i.id),
                content_type: 'product',
                contents: data.items?.map(i => ({
                    id: i.id,
                    quantity: i.quantity,
                    item_price: i.price,
                })),
            });
        }

        // TikTok
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.track('CompletePayment', {
                value: data.value,
                currency: data.currency,
                contents: data.items?.map(i => ({
                    content_id: i.id,
                    content_name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                })),
            });
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', 'purchase', {
                transaction_id: data.orderId,
                value: data.value,
                currency: data.currency,
                items: data.items?.map(i => ({
                    item_id: i.id,
                    item_name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                })),
            });
        }
    }

    /**
     * Track add to cart event
     */
    trackAddToCart(data: AddToCartData) {
        if (!this.settings.trackAddToCart) return;

        this.log('AddToCart:', data);

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('track', 'AddToCart', {
                content_ids: [data.contentId],
                content_name: data.contentName,
                content_type: 'product',
                value: data.value,
                currency: data.currency,
            });
        }

        // TikTok
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.track('AddToCart', {
                content_id: data.contentId,
                content_name: data.contentName,
                quantity: data.quantity || 1,
                price: data.value,
                currency: data.currency,
            });
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', 'add_to_cart', {
                currency: data.currency,
                value: data.value,
                items: [{
                    item_id: data.contentId,
                    item_name: data.contentName,
                    price: data.value,
                    quantity: data.quantity || 1,
                }],
            });
        }
    }

    /**
     * Track initiate checkout event
     */
    trackInitiateCheckout(value: number, currency: string, itemCount: number) {
        if (!this.settings.trackCheckout) return;

        this.log('InitiateCheckout:', { value, currency, itemCount });

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('track', 'InitiateCheckout', {
                value,
                currency,
                num_items: itemCount,
            });
        }

        // TikTok
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.track('InitiateCheckout', {
                value,
                currency,
                quantity: itemCount,
            });
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', 'begin_checkout', {
                currency,
                value,
                items: [{ quantity: itemCount }],
            });
        }
    }

    /**
     * Track view content event
     */
    trackViewContent(data: ViewContentData) {
        this.log('ViewContent:', data);

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('track', 'ViewContent', {
                content_ids: [data.contentId],
                content_name: data.contentName,
                content_category: data.contentCategory,
                content_type: 'product',
                value: data.value,
                currency: data.currency,
            });
        }

        // TikTok
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.track('ViewContent', {
                content_id: data.contentId,
                content_name: data.contentName,
                content_category: data.contentCategory,
                value: data.value,
                currency: data.currency,
            });
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', 'view_item', {
                currency: data.currency,
                value: data.value,
                items: [{
                    item_id: data.contentId,
                    item_name: data.contentName,
                    item_category: data.contentCategory,
                }],
            });
        }
    }

    /**
     * Track custom event
     */
    trackCustomEvent(eventName: string, eventData?: Record<string, any>) {
        this.log('CustomEvent:', eventName, eventData);

        // Facebook
        if (this.scriptsLoaded.facebook) {
            window.fbq?.('trackCustom', eventName, eventData);
        }

        // TikTok (as custom event)
        if (this.scriptsLoaded.tiktok) {
            window.ttq?.track(eventName, eventData);
        }

        // Google Analytics
        if (this.scriptsLoaded.ga4) {
            window.gtag?.('event', eventName, eventData);
        }
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            scripts: this.scriptsLoaded,
            pixelCounts: {
                facebook: this.settings.facebookPixels.filter(p => p.enabled).length,
                tiktok: this.settings.tiktokPixels.filter(p => p.enabled).length,
                ga4: this.settings.googleAnalytics.filter(p => p.enabled).length,
                gtm: this.settings.googleTagManager.filter(p => p.enabled).length,
            },
        };
    }
}

// Export singleton instance
export const pixelTracker = new PixelTracker();

// Export types
export type { PurchaseEventData, ViewContentData, AddToCartData, PixelEventName };
