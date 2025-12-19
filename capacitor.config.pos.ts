import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.abangbob.pos',
    appName: 'AbangBob POS',
    webDir: 'out',
    server: {
        allowNavigation: ['*']
    }
};

export default config;
