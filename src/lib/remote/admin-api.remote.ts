import { getRequestEvent, query, command } from '$app/server';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

const ADMIN_API_BASE_URL = env.ADMIN_API_BASE_URL!;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const OrderStatusSchema = v.picklist(['pending', 'paid', 'expired', 'cancelled']);
const TransferStatusSchema = v.picklist([
	'waiting_for_confirmation',
	'failed_to_confirm',
	'waiting_for_match',
	'no_matched_deposit',
	'matched',
]);

const OrderSchema = v.object({
	order_id: v.string(),
	merchant_order_id: v.string(),
	amount: v.string(),
	status: OrderStatusSchema,
	created_at: v.number(),
	webhook_url: v.string(),
	webhook_retry_count: v.number(),
	webhook_success_at: v.nullable(v.number()),
	webhook_last_tried_at: v.nullable(v.number()),
});

const DepositSchema = v.object({
	id: v.number(),
	order_id: v.string(),
	blockchain: v.string(),
	token: v.string(),
	user_address: v.nullable(v.string()),
	wallet_address: v.string(),
	value: v.string(),
	started_at: v.number(),
	last_scanned_at: v.number(),
});

const TransferSchema = v.object({
	id: v.number(),
	blockchain: v.string(),
	token: v.string(),
	from_address: v.string(),
	to_address: v.string(),
	txn_hash: v.string(),
	value: v.string(),
	block_number: v.number(),
	block_timestamp: v.number(),
	blockchain_confirmed: v.boolean(),
	created_at: v.number(),
	status: TransferStatusSchema,
	fulfillment_id: v.nullable(v.number()),
});

const WalletSchema = v.object({
	blockchain: v.string(),
	address: v.string(),
	enabled_coins: v.array(v.string()),
});

const HealthSchema = v.object({
	status: v.string(),
	version: v.string(),
});

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function adminFetch(path: string, init?: RequestInit): Promise<Response> {
	const { cookies } = getRequestEvent();
	const secret = cookies.get('ocrch_admin_secret');
	if (!secret) error(401, 'Unauthorized');
	return fetch(`${ADMIN_API_BASE_URL}/api/v1/admin${path}`, {
		...init,
		headers: {
			'Ocrch-Admin-Authorization': secret,
			...init?.headers,
		},
	});
}

function buildQuery(params: Record<string, string | number | undefined>): string {
	const qs = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) qs.set(key, String(value));
	}
	const str = qs.toString();
	return str ? `?${str}` : '';
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const OrderFiltersSchema = v.object({
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
	status: v.optional(OrderStatusSchema),
	merchant_order_id: v.optional(v.string()),
});

export const getOrders = query(OrderFiltersSchema, async (filters) => {
	const qs = buildQuery(filters);
	const res = await adminFetch(`/orders${qs}`);
	if (!res.ok) error(res.status, await res.text());
	return v.parse(v.array(OrderSchema), await res.json());
});

export const markOrderPaid = command(v.string(), async (orderId) => {
	const res = await adminFetch(`/orders/${orderId}/mark-paid`, { method: 'POST' });
	if (!res.ok) error(res.status, await res.text());
});

export const resendOrderWebhook = command(v.string(), async (orderId) => {
	const res = await adminFetch(`/orders/${orderId}/resend-webhook`, { method: 'POST' });
	if (!res.ok) error(res.status, await res.text());
});

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

const DepositFiltersSchema = v.object({
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
	order_id: v.optional(v.string()),
	blockchain: v.optional(v.string()),
	token: v.optional(v.string()),
});

export const getDeposits = query(DepositFiltersSchema, async (filters) => {
	const qs = buildQuery(filters);
	const res = await adminFetch(`/deposits${qs}`);
	if (!res.ok) error(res.status, await res.text());
	return v.parse(v.array(DepositSchema), await res.json());
});

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

const TransferFiltersSchema = v.object({
	address: v.string(),
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
	status: v.optional(TransferStatusSchema),
	blockchain: v.optional(v.string()),
	token: v.optional(v.string()),
});

export const getTransfers = query(TransferFiltersSchema, async ({ address, ...params }) => {
	const qs = buildQuery(params);
	const res = await adminFetch(`/wallets/${address}/transfers${qs}`);
	if (!res.ok) error(res.status, await res.text());
	return v.parse(v.array(TransferSchema), await res.json());
});

export const resendTransferWebhook = command(v.number(), async (transferId) => {
	const res = await adminFetch(`/transfers/${transferId}/resend-webhook`, { method: 'POST' });
	if (!res.ok) error(res.status, await res.text());
});

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export const getWallets = query(async () => {
	const res = await adminFetch('/wallets');
	if (!res.ok) error(res.status, await res.text());
	return v.parse(v.array(WalletSchema), await res.json());
});

// ---------------------------------------------------------------------------
// Health (no auth required)
// ---------------------------------------------------------------------------

export const getHealth = query(async () => {
	const res = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/health`);
	if (!res.ok) error(res.status, await res.text());
	return v.parse(HealthSchema, await res.json());
});
