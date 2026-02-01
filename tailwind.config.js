/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--primary)',
                    dark: 'var(--primary-dark)',
                    light: 'var(--primary-light)',
                    50: 'var(--primary-50)',
                    100: 'var(--primary-100)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    dark: 'var(--secondary-dark)',
                    light: 'var(--secondary-light)',
                },
                surface: {
                    DEFAULT: 'var(--bg-card)',
                    secondary: 'var(--bg-secondary)',
                },
                glass: {
                    DEFAULT: 'rgba(255, 255, 255, 0.7)',
                    dark: 'rgba(30, 41, 59, 0.7)',
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'neon': '0 0 10px rgba(204, 21, 18, 0.5)',
            },
            fontFamily: {
                sans: ['var(--font-jakarta)', 'sans-serif'],
            }
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: ["light", "dark"],
    },
}
