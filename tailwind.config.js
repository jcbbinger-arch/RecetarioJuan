/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                chef: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    500: '#64748b',
                    600: '#475569',
                    800: '#1e293b',
                    900: '#0f172a',
                    accent: '#f59e0b',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Merriweather', 'serif'],
            }
        },
    },
    plugins: [],
}
