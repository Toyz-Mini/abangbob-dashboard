import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.abangbob.admin',
    appName: 'AbangBob Admin',
    webDir: 'out',
    server: {
        allowNavigation: ['*']
    }
};

export default config;
