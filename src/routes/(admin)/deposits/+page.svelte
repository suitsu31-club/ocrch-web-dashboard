<script lang="ts">
	import { getDeposits } from '$lib/remote/admin-api.remote.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let orderIdFilter = $state('');
	let blockchainFilter = $state('');
	let tokenFilter = $state('');

	let depositsPromise = $state.raw(getDeposits({}));

	async function refresh() {
		depositsPromise = getDeposits({
			order_id: orderIdFilter || undefined,
			blockchain: blockchainFilter || undefined,
			token: tokenFilter || undefined,
		});
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleString();
	}
</script>

<div class="p-6 space-y-6">
	<h1 class="text-2xl font-bold">Deposits</h1>

	<div class="flex gap-3 items-end flex-wrap">
		<div class="flex flex-col gap-1">
			<label class="text-sm font-medium" for="order-id-filter">Order ID</label>
			<Input id="order-id-filter" bind:value={orderIdFilter} placeholder="Filter..." />
		</div>
		<div class="flex flex-col gap-1">
			<label class="text-sm font-medium" for="blockchain-filter">Blockchain</label>
			<Input id="blockchain-filter" bind:value={blockchainFilter} placeholder="Filter..." />
		</div>
		<div class="flex flex-col gap-1">
			<label class="text-sm font-medium" for="token-filter">Token</label>
			<Input id="token-filter" bind:value={tokenFilter} placeholder="Filter..." />
		</div>
		<Button onclick={refresh}>Apply</Button>
	</div>

	{#await depositsPromise}
		<div class="space-y-2">
			{#each { length: 8 } as _, i (i)}
				<Skeleton class="h-10 w-full rounded-md" />
			{/each}
		</div>
	{:then deposits}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>ID</Table.Head>
					<Table.Head>Order ID</Table.Head>
					<Table.Head>Blockchain</Table.Head>
					<Table.Head>Token</Table.Head>
					<Table.Head>Wallet Address</Table.Head>
					<Table.Head>User Address</Table.Head>
					<Table.Head>Value</Table.Head>
					<Table.Head>Started At</Table.Head>
					<Table.Head>Last Scanned At</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each deposits as deposit (deposit.id)}
					<Table.Row>
						<Table.Cell>{deposit.id}</Table.Cell>
						<Table.Cell class="font-mono text-xs">{deposit.order_id}</Table.Cell>
						<Table.Cell>{deposit.blockchain}</Table.Cell>
						<Table.Cell>{deposit.token}</Table.Cell>
						<Table.Cell class="font-mono text-xs">{deposit.wallet_address}</Table.Cell>
						<Table.Cell class="font-mono text-xs">{deposit.user_address ?? '—'}</Table.Cell>
						<Table.Cell>{deposit.value}</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">{formatDate(deposit.started_at)}</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">{formatDate(deposit.last_scanned_at)}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={9} class="text-center text-muted-foreground py-8">
							No deposits found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{:catch error}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">Failed to load deposits</p>
			<p class="text-sm mt-1">{error?.message ?? 'An unknown error occurred.'}</p>
		</div>
	{/await}
</div>
