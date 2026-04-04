<script lang="ts">
	import { getOrders, markOrderPaid, resendOrderWebhook } from '$lib/remote/admin-api.remote.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { SvelteSet } from 'svelte/reactivity';

	type Order = {
		order_id: string;
		merchant_order_id: string;
		amount: string;
		status: 'pending' | 'paid' | 'expired' | 'cancelled';
		created_at: number;
		webhook_url: string;
		webhook_retry_count: number;
		webhook_success_at: number | null;
		webhook_last_tried_at: number | null;
	};

	let statusFilter = $state('');
	let merchantFilter = $state('');
	let loadingIds = new SvelteSet<string>();

	let ordersPromise = $state.raw(getOrders({}));

	function refresh() {
		ordersPromise = getOrders({
			status: (statusFilter as Order['status']) || undefined,
			merchant_order_id: merchantFilter || undefined,
		});
	}

	async function handleMarkPaid(orderId: string) {
		loadingIds.add(orderId);
		try {
			await markOrderPaid(orderId);
			refresh();
		} finally {
			loadingIds.delete(orderId);
		}
	}

	async function handleResendWebhook(orderId: string) {
		loadingIds.add(orderId);
		try {
			await resendOrderWebhook(orderId);
			refresh();
		} finally {
			loadingIds.delete(orderId);
		}
	}

	function statusBadgeProps(status: Order['status']): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class?: string } {
		switch (status) {
			case 'paid':
				return { variant: 'outline', class: 'text-green-600 border-green-600' };
			case 'expired':
				return { variant: 'secondary' };
			case 'cancelled':
				return { variant: 'destructive' };
			default:
				return { variant: 'default' };
		}
	}
</script>

<div class="p-6 space-y-6">
	<h1 class="text-2xl font-bold">Orders</h1>

	<div class="flex gap-3 items-end">
		<div class="flex flex-col gap-1">
			<label for="status-filter" class="text-sm font-medium">Status</label>
			<select
				id="status-filter"
				bind:value={statusFilter}
				class="border rounded-md px-3 py-1.5 text-sm h-9 bg-background"
			>
				<option value="">All</option>
				<option value="pending">pending</option>
				<option value="paid">paid</option>
				<option value="expired">expired</option>
				<option value="cancelled">cancelled</option>
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="merchant-filter" class="text-sm font-medium">Merchant Order ID</label>
			<input
				id="merchant-filter"
				type="text"
				bind:value={merchantFilter}
				placeholder="Filter by merchant order ID"
				class="border rounded-md px-3 py-1.5 text-sm h-9 bg-background w-64"
			/>
		</div>

		<Button onclick={refresh}>Apply</Button>
	</div>

	{#await ordersPromise}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Order ID</Table.Head>
					<Table.Head>Merchant Order ID</Table.Head>
					<Table.Head>Amount</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Created At</Table.Head>
					<Table.Head>Webhook Retries</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each { length: 3 } as _, i (i)}
					<Table.Row>
						<Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
						<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
						<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
						<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
						<Table.Cell><Skeleton class="h-4 w-32" /></Table.Cell>
						<Table.Cell><Skeleton class="h-4 w-8" /></Table.Cell>
						<Table.Cell><Skeleton class="h-8 w-24" /></Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{:then orders}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Order ID</Table.Head>
					<Table.Head>Merchant Order ID</Table.Head>
					<Table.Head>Amount</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Created At</Table.Head>
					<Table.Head>Webhook Retries</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each orders as order (order.order_id)}
					{@const badgeProps = statusBadgeProps(order.status)}
					{@const isLoading = loadingIds.has(order.order_id)}
					<Table.Row>
						<Table.Cell>
							<span class="font-mono text-xs truncate max-w-[8rem] block" title={order.order_id}>
								{order.order_id.slice(0, 8)}…
							</span>
						</Table.Cell>
						<Table.Cell>{order.merchant_order_id}</Table.Cell>
						<Table.Cell>{order.amount}</Table.Cell>
						<Table.Cell>
							<Badge variant={badgeProps.variant} class={badgeProps.class ?? ''}>
								{order.status}
							</Badge>
						</Table.Cell>
						<Table.Cell>{new Date(order.created_at * 1000).toLocaleString()}</Table.Cell>
						<Table.Cell>{order.webhook_retry_count}</Table.Cell>
						<Table.Cell>
							<div class="flex gap-2">
								{#if order.status === 'pending'}
									<Button
										size="sm"
										variant="outline"
										disabled={isLoading}
										onclick={() => handleMarkPaid(order.order_id)}
									>
										Mark Paid
									</Button>
								{/if}
								<Button
									size="sm"
									variant="ghost"
									disabled={isLoading}
									onclick={() => handleResendWebhook(order.order_id)}
								>
									Resend Webhook
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if orders.length === 0}
					<Table.Row>
						<Table.Cell colspan={7} class="text-center text-muted-foreground py-8">
							No orders found.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	{:catch error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">Failed to load orders</p>
			<p class="text-sm mt-1">{error?.message ?? String(error)}</p>
		</div>
	{/await}
</div>
