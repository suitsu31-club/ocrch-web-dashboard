<script lang="ts">
	import { getTransfers, getWallets, resendTransferWebhook } from '$lib/remote/admin-api.remote.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { SvelteSet } from 'svelte/reactivity';

	type Transfer = {
		id: number;
		blockchain: string;
		token: string;
		from_address: string;
		to_address: string;
		txn_hash: string;
		value: string;
		block_number: number;
		block_timestamp: number;
		blockchain_confirmed: boolean;
		created_at: number;
		status:
			| 'waiting_for_confirmation'
			| 'failed_to_confirm'
			| 'waiting_for_match'
			| 'no_matched_deposit'
			| 'matched';
		fulfillment_id: number | null;
	};

	let walletsPromise = $state.raw(getWallets());
	let selectedAddress = $state('');
	let statusFilter = $state('');
	let blockchainFilter = $state('');
	let tokenFilter = $state('');
	let transfersPromise = $state.raw<Promise<Transfer[]> | null>(null);
	let loadingIds = new SvelteSet<number>();

	function search() {
		if (!selectedAddress) return;
		transfersPromise = getTransfers({
			address: selectedAddress,
			status: (statusFilter as Transfer['status']) || undefined,
			blockchain: blockchainFilter || undefined,
			token: tokenFilter || undefined,
		});
	}

	function truncateAddress(addr: string): string {
		if (addr.length <= 16) return addr;
		return addr.slice(0, 10) + '...' + addr.slice(-6);
	}

	function statusBadgeProps(
		status: Transfer['status'],
	): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; class?: string } {
		switch (status) {
			case 'matched':
				return { variant: 'outline', class: 'text-green-600 border-green-600' };
			case 'waiting_for_confirmation':
			case 'waiting_for_match':
				return { variant: 'secondary' };
			case 'failed_to_confirm':
			case 'no_matched_deposit':
				return { variant: 'destructive' };
			default:
				return { variant: 'default' };
		}
	}

	async function handleResendWebhook(transferId: number) {
		loadingIds.add(transferId);
		try {
			await resendTransferWebhook(transferId);
		} finally {
			loadingIds.delete(transferId);
		}
	}
</script>

<div class="p-6 space-y-6">
	<h1 class="text-2xl font-bold">Transfers</h1>

	{#await walletsPromise}
		<Skeleton class="h-9 w-64 rounded-md" />
	{:then wallets}
		<div class="flex flex-col gap-1">
			<label for="wallet-select" class="text-sm font-medium">Wallet Address</label>
			<select
				id="wallet-select"
				bind:value={selectedAddress}
				onchange={search}
				class="border rounded-md px-3 py-1.5 text-sm h-9 bg-background w-80"
			>
				<option value="">Select a wallet...</option>
				{#each wallets as wallet (wallet.address)}
					<option value={wallet.address}>{wallet.blockchain}: {wallet.address}</option>
				{/each}
			</select>
		</div>

		{#if selectedAddress}
			<div class="flex gap-3 items-end flex-wrap">
				<div class="flex flex-col gap-1">
					<label for="status-filter" class="text-sm font-medium">Status</label>
					<select
						id="status-filter"
						bind:value={statusFilter}
						class="border rounded-md px-3 py-1.5 text-sm h-9 bg-background"
					>
						<option value="">All</option>
						<option value="waiting_for_confirmation">waiting_for_confirmation</option>
						<option value="waiting_for_match">waiting_for_match</option>
						<option value="matched">matched</option>
						<option value="failed_to_confirm">failed_to_confirm</option>
						<option value="no_matched_deposit">no_matched_deposit</option>
					</select>
				</div>
				<div class="flex flex-col gap-1">
					<label for="blockchain-filter" class="text-sm font-medium">Blockchain</label>
					<Input id="blockchain-filter" bind:value={blockchainFilter} placeholder="Filter..." />
				</div>
				<div class="flex flex-col gap-1">
					<label for="token-filter" class="text-sm font-medium">Token</label>
					<Input id="token-filter" bind:value={tokenFilter} placeholder="Filter..." />
				</div>
				<Button onclick={search}>Search</Button>
			</div>
		{/if}
	{:catch err}
		<div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">Failed to load wallets</p>
			<p class="text-sm mt-1">{err?.message ?? String(err)}</p>
		</div>
	{/await}

	{#if transfersPromise !== null}
		{#await transfersPromise}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>ID</Table.Head>
						<Table.Head>Blockchain</Table.Head>
						<Table.Head>Token</Table.Head>
						<Table.Head>From</Table.Head>
						<Table.Head>To</Table.Head>
						<Table.Head>Tx Hash</Table.Head>
						<Table.Head>Value</Table.Head>
						<Table.Head>Block #</Table.Head>
						<Table.Head>Timestamp</Table.Head>
						<Table.Head>Confirmed</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each { length: 5 } as _, i (i)}
						<Table.Row>
							{#each { length: 12 } as _, j (j)}
								<Table.Cell><Skeleton class="h-4 w-16" /></Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:then transfers}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>ID</Table.Head>
						<Table.Head>Blockchain</Table.Head>
						<Table.Head>Token</Table.Head>
						<Table.Head>From</Table.Head>
						<Table.Head>To</Table.Head>
						<Table.Head>Tx Hash</Table.Head>
						<Table.Head>Value</Table.Head>
						<Table.Head>Block #</Table.Head>
						<Table.Head>Timestamp</Table.Head>
						<Table.Head>Confirmed</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each transfers as transfer (transfer.id)}
						{@const badgeProps = statusBadgeProps(transfer.status)}
						{@const isLoading = loadingIds.has(transfer.id)}
						<Table.Row>
							<Table.Cell>{transfer.id}</Table.Cell>
							<Table.Cell>{transfer.blockchain}</Table.Cell>
							<Table.Cell>{transfer.token}</Table.Cell>
							<Table.Cell class="font-mono text-xs" title={transfer.from_address}>
								{truncateAddress(transfer.from_address)}
							</Table.Cell>
							<Table.Cell class="font-mono text-xs" title={transfer.to_address}>
								{truncateAddress(transfer.to_address)}
							</Table.Cell>
							<Table.Cell class="font-mono text-xs" title={transfer.txn_hash}>
								{truncateAddress(transfer.txn_hash)}
							</Table.Cell>
							<Table.Cell>{transfer.value}</Table.Cell>
							<Table.Cell>{transfer.block_number}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">
								{new Date(transfer.block_timestamp * 1000).toLocaleString()}
							</Table.Cell>
							<Table.Cell>{transfer.blockchain_confirmed ? 'Yes' : 'No'}</Table.Cell>
							<Table.Cell>
								<Badge variant={badgeProps.variant} class={badgeProps.class ?? ''}>
									{transfer.status}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<Button
									size="sm"
									variant="ghost"
									disabled={isLoading}
									onclick={() => handleResendWebhook(transfer.id)}
								>
									Resend Webhook
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={12} class="text-center text-muted-foreground py-8">
								No transfers found.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{:catch err}
			<div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
				<p class="font-medium">Failed to load transfers</p>
				<p class="text-sm mt-1">{err?.message ?? String(err)}</p>
			</div>
		{/await}
	{/if}
</div>
