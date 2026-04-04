import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/logout')) {
		return resolve(event);
	}

	const secret = event.cookies.get('ocrch_admin_secret');
	if (!secret) {
		redirect(302, '/login');
	}

	return resolve(event);
};
