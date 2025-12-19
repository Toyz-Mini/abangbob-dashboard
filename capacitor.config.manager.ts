import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.abangbob.manager',
    appName: 'AbangBob Manager',
    webDir: 'out',
    server: {
        allowNavigation: ['*']
    }
};

export default config;
