/**
 * Automatically wraps target SEO keywords with internal links.
 * Used for processing blog content or other large text blocks.
 */
export function injectSeoLinks(html: string): string {
    const links = [
        { phrase: 'email marketing', url: '/email-marketing' },
        { phrase: 'automated email marketing', url: '/email-automation-software' },
        { phrase: 'mailchimp alternative', url: '/mailchimp-alternative' },
        { phrase: 'email deliverability', url: '/email-deliverability-guide' },
        { phrase: 'marketing automation', url: '/email-automation-software' },
        { phrase: 'laravel mail', url: '/' },
        { phrase: 'laravel email', url: '/' },
        { phrase: 'laravel email templates', url: '/laravel-email-templates' },
        { phrase: 'laravel mail queue', url: '/laravel-mail-queue' },
        { phrase: 'laravel transactional email', url: '/laravel-transactional-email' },
        { phrase: 'laravel email campaigns', url: '/laravel-email-campaigns' },
        { phrase: 'laravel newsletter system', url: '/laravel-newsletter-system' },
        { phrase: 'self hosted email marketing', url: '/self-hosted-email-marketing' },
        { phrase: 'open source email marketing', url: '/open-source-email-marketing' },
        { phrase: 'laravel sendgrid alternative', url: '/laravel-sendgrid-alternative' },
        { phrase: 'laravel email automation', url: '/laravel-email-automation-system' }
    ];

    let processedHtml = html;

    links.forEach(({ phrase, url }) => {
        // Use a regex to find the phrase, but avoid replacing it if it's already inside an <a> tag
        // or part of an attribute. This is a simple version; a more robust one would use a DOM parser.
        const regex = new RegExp(`(?<!<a[^>]*?>)\\b${phrase}\\b(?!<\\/a>)`, 'gi');
        
        // We only replace the first few occurrences to avoid over-linking (SEO best practice)
        let count = 0;
        processedHtml = processedHtml.replace(regex, (match) => {
            if (count < 2) {
                count++;
                return `<a href="${url}" class="seo-link hover:underline text-brand-primary font-semibold">${match}</a>`;
            }
            return match;
        });
    });

    return processedHtml;
}
