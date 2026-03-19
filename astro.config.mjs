import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import preact from '@astrojs/preact';

export default defineConfig({
    site: 'https://laravelmail.com',
    output: 'static',
    prefetch: true,
    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'es', 'zh', 'ru'],
        routing: {
            prefixDefaultLocale: false,
        },
    },
    redirects: {
        '/email-automation': '/email-marketing',
        '/es/email-automation': '/es/email-marketing',
        '/zh/email-automation': '/zh/email-marketing',
        '/ru/email-automation': '/ru/email-marketing',
    },
    integrations: [
        tailwind(),
        sitemap({
            i18n: {
                defaultLocale: 'en',
                locales: {
                    en: 'en',
                    es: 'es',
                    zh: 'zh',
                    ru: 'ru',
                },
            },
        }),
        preact(),
        icon({
            include: {
                ph: [
                    "star-duotone",
                    "lightning-duotone",
                    "globe-duotone",
                    "users-duotone",
                    "buildings-duotone",
                    "briefcase-duotone",
                    "check-circle-duotone",
                    "x-circle-duotone",
                    "code-duotone",
                    "puzzle-piece-duotone",
                    "brain-duotone",
                    "shield-check-duotone",
                    "linkedin-logo-duotone",
                    "twitter-logo-duotone",
                    "github-logo-duotone",
                    "currency-dollar-duotone",
                    "arrow-left-duotone",
                    "arrow-right",
                    "file-search",
                    "layout-duotone",
                    "calendar-duotone",
                    "clock-duotone",
                    "link-duotone",
                    "check-square-duotone",
                    "credit-card-duotone",
                    "paint-brush-duotone",
                    "chart-line-duotone",
                    "google-logo-duotone",
                    "lock-key-duotone",
                    "certificate-duotone",
                    "lifebuoy-duotone",
                    "handshake-duotone"
                ]
            }
        })
    ]
});
