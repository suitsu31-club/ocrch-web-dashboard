<script lang="ts">
	import { getWallets } from '$lib/remote/admin-api.remote.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Wallet, RefreshCw } from '@lucide/svelte';

	let walletsPromise = $state.raw(getWallets());

	function refresh() {
		walletsPromise = getWallets();
	}
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Wallets</h1>
		<Button variant="outline" size="sm" onclick={refresh}>
			<RefreshCw class="size-4 mr-2" />
			Refresh
		</Button>
	</div>

	{#await walletsPromise}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each { length: 3 } as _, i (i)}
				<Card.Root>
					<Card.Header>
						<Skeleton class="h-6 w-32 rounded-md" />
					</Card.Header>
					<Card.Content class="space-y-3">
						<Skeleton class="h-4 w-full rounded-md" />
						<Skeleton class="h-4 w-3/4 rounded-md" />
						<div class="flex gap-1.5">
							<Skeleton class="h-5 w-12 rounded-full" />
							<Skeleton class="h-5 w-12 rounded-full" />
							<Skeleton class="h-5 w-12 rounded-full" />
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:then wallets}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each wallets as wallet (wallet.address)}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Wallet class="size-5" />
							{wallet.blockchain}
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<p class="font-mono text-xs break-all text-muted-foreground">{wallet.address}</p>
						<div class="flex flex-wrap gap-1.5">
							{#each wallet.enabled_coins as coin (coin)}
								<Badge variant="secondary">{coin}</Badge>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{:catch error}
		<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">Failed to load wallets</p>
			<p class="text-sm mt-1">{error?.message ?? 'An unknown error occurred.'}</p>
		</div>
	{/await}
</div>
