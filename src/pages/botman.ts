
export const prerender = false;

export async function POST({ request }) {
    const data = await request.formData();
    const message = data.get('message');

    return new Response(
        JSON.stringify({
            messages: [
                {
                    type: 'text',
                    text: `You said: "${message}". This is a mock response from the Astro backend.`
                }
            ]
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}
