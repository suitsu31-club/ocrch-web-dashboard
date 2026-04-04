import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete('ocrch_admin_secret', { path: '/' });
	redirect(302, '/login');
};
