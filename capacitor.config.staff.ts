import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.abangbob.staff',
    appName: 'AbangBob Staff',
    webDir: 'out',
    server: {
        allowNavigation: ['*']
    }
};

export default config;
