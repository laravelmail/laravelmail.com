/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'payflo-purple': '#7c3aed',
        'payflo-blue': '#0a92dd',
        'payflo-pink': '#ec4899',
        'payflo-gray': '#f1f5f9',
        'payflo-dark': '#0f172a',

        // Leadscaptain Palette (Muted/Dark)
        'leadscaptain-purple': '#7c3aed',
        'leadscaptain-blue': '#0a92dd',
        'leadscaptain-gray': '#cbd5e1',

        // Brand Palette from SCSS
        'brand-primary': '#7c3aed',
        'brand-accent': '#ec4899',
        'brand-blue': '#0a92dd',
        'brand-bg': '#0f172a',
        'brand-bg-darker': '#0a0e27',
        'brand-bg-card': '#1e293b',
        'brand-success': '#10b981',
      },
      fontFamily: {
        sans: ['Nunito', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'gradient-x': 'gradientX 3s ease infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(50px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        gradientX: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
    },
    screens: {
      'xs': '320px',
      'ph': '480px',
      'sm': '576px',
      'md': '768px',
      'lg': '992px',
      'xl': '1200px',
      '2xl': '1536px',
    },
  },
  plugins: [],
}
