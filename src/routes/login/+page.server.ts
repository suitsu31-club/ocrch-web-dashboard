import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const key = String(data.get('key') ?? '').trim();

		if (!key) {
			return fail(400, { error: 'Admin key is required' });
		}

		const baseUrl = env.ADMIN_API_BASE_URL;
		let res: Response;
		try {
			res = await fetch(`${baseUrl}/api/v1/admin/wallets`, {
				headers: { 'Ocrch-Admin-Authorization': key }
			});
		} catch {
			return fail(503, { error: 'Could not reach admin API' });
		}

		if (res.status === 401 || res.status === 403) {
			return fail(401, { error: 'Invalid admin key' });
		}

		if (!res.ok) {
			return fail(res.status, { error: `Authentication failed (${res.status})` });
		}

		cookies.set('ocrch_admin_secret', key, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(302, '/orders');
	}
};
