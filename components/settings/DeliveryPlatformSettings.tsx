'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Globe, Key, Copy, Check, RefreshCw, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';

interface PlatformConfig {
    id: string;
    name: string;
    enabled: boolean;
    apiKey?: string;
    webhookSecret?: string;
    color: string;
    logo?: string;
}

const DEFAULT_PLATFORMS: PlatformConfig[] = [
    { id: 'gomamam', name: 'GoMamam', enabled: true, color: '#CC1512' },
    { id: 'grabfood', name: 'GrabFood', enabled: false, color: '#00b14f' },
    { id: 'foodpanda', name: 'FoodPanda', enabled: false, color: '#d70f64' },
    { id: 'shopeefood', name: 'ShopeeFood', enabled: false, color: '#ee4d2d' },
];

const SETTING_KEY = 'delivery_platforms';

export default function DeliveryPlatformSettings() {
    const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState<string | null>(null);
    const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
    const [tempApiKey, setTempApiKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load from Supabase on mount
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { data, error } = await supabase
                    .from('settings')
                    .select('setting_value')
                    .eq('setting_key', SETTING_KEY)
                    .eq('user_id', 'global')
                    .single();

                if (data && !error) {
                    setPlatforms(data.setting_value as PlatformConfig[]);
                } else {
                    // Fallback to localStorage, then default
                    const saved = localStorage.getItem('delivery_platform_settings');
                    setPlatforms(saved ? JSON.parse(saved) : DEFAULT_PLATFORMS);
                }
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('delivery_platform_settings');
                setPlatforms(saved ? JSON.parse(saved) : DEFAULT_PLATFORMS);
            }
        } catch (err) {
            console.error('Failed to load delivery settings:', err);
            setPlatforms(DEFAULT_PLATFORMS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Save to Supabase and localStorage
    const savePlatforms = async (updated: PlatformConfig[]) => {
        setPlatforms(updated);
        setSaving(true);

        // Always save to localStorage as backup
        localStorage.setItem('delivery_platform_settings', JSON.stringify(updated));

        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const { error } = await supabase
                    .from('settings')
                    .upsert({
                        user_id: 'global',
                        setting_key: SETTING_KEY,
                        setting_value: updated,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,setting_key'
                    });

                if (error) {
                    console.error('Failed to save to Supabase:', error);
                } else {
                    console.log('✅ Delivery platform settings synced to Supabase');
                }
            }
        } catch (err) {
            console.error('Supabase sync error:', err);
        } finally {
            setSaving(false);
        }
    };

    const togglePlatform = (id: string) => {
        const updated = platforms.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        );
        savePlatforms(updated);
    };

    const updateApiKey = (id: string, apiKey: string) => {
        const updated = platforms.map(p =>
            p.id === id ? { ...p, apiKey } : p
        );
        savePlatforms(updated);
        setEditingPlatform(null);
        setTempApiKey('');
    };

    const generateWebhookSecret = (id: string) => {
        const secret = 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        const updated = platforms.map(p =>
            p.id === id ? { ...p, webhookSecret: secret } : p
        );
        savePlatforms(updated);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const getWebhookUrl = (platformId: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/api/webhooks/${platformId}`;
        }
        return `/api/webhooks/${platformId}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Delivery Platforms</h3>
                    <p className="text-sm text-gray-500">Configure delivery platform integrations</p>
                </div>
            </div>

            <div className="space-y-4">
                {platforms.map((platform) => (
                    <div
                        key={platform.id}
                        className="border rounded-lg p-4"
                        style={{ borderLeftWidth: '4px', borderLeftColor: platform.color }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ background: platform.color }}
                                >
                                    {platform.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold">{platform.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {platform.enabled ? '🟢 Active' : '⚪ Inactive'}
                                    </div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={platform.enabled}
                                    onChange={() => togglePlatform(platform.id)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {platform.enabled && (
                            <div className="space-y-4 pt-3 border-t">
                                {/* API Key */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Key size={14} className="inline mr-1" />
                                        API Key
                                    </label>
                                    {editingPlatform === platform.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tempApiKey}
                                                onChange={(e) => setTempApiKey(e.target.value)}
                                                placeholder="Enter API key from GoMamam..."
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                            />
                                            <button
                                                onClick={() => updateApiKey(platform.id, tempApiKey)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingPlatform(null); setTempApiKey(''); }}
                                                className="btn btn-outline btn-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type={showApiKey === platform.id ? 'text' : 'password'}
                                                value={platform.apiKey || ''}
                                                readOnly
                                                placeholder="No API key configured"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
                                            />
                                            {platform.apiKey && (
                                                <button
                                                    onClick={() => setShowApiKey(showApiKey === platform.id ? null : platform.id)}
                                                    className="btn btn-outline btn-sm"
                                                >
                                                    {showApiKey === platform.id ? 'Hide' : 'Show'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setEditingPlatform(platform.id); setTempApiKey(platform.apiKey || ''); }}
                                                className="btn btn-outline btn-sm"
                                            >
                                                {platform.apiKey ? 'Edit' : 'Add'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Webhook URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Globe size={14} className="inline mr-1" />
                                        Webhook URL
                                        <span className="text-xs text-gray-400 ml-2">(Give this to {platform.name})</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={getWebhookUrl(platform.id)}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(getWebhookUrl(platform.id), `webhook-${platform.id}`)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            {copied === `webhook-${platform.id}` ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Webhook Secret */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Key size={14} className="inline mr-1" />
                                        Webhook Secret
                                        <span className="text-xs text-gray-400 ml-2">(For validating incoming requests)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={platform.webhookSecret || ''}
                                            readOnly
                                            placeholder="Not generated"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
                                        />
                                        {platform.webhookSecret && (
                                            <button
                                                onClick={() => copyToClipboard(platform.webhookSecret!, `secret-${platform.id}`)}
                                                className="btn btn-outline btn-sm"
                                            >
                                                {copied === `secret-${platform.id}` ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => generateWebhookSecret(platform.id)}
                                            className="btn btn-outline btn-sm"
                                            title="Generate new secret"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Help Text */}
                                {platform.id === 'gomamam' && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                        <div className="font-medium text-blue-800 mb-1">📘 Setup Instructions</div>
                                        <ol className="list-decimal list-inside text-blue-700 space-y-1">
                                            <li>Copy the Webhook URL above</li>
                                            <li>Go to GoMamam merchant dashboard</li>
                                            <li>Paste the URL in their webhook settings</li>
                                            <li>Enter your API key from GoMamam above</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
