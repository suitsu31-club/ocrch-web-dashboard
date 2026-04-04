<script lang="ts">
	import { getHealth } from '$lib/remote/admin-api.remote.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { RefreshCw } from '@lucide/svelte';

	let healthPromise = $state.raw(getHealth());

	function refresh() {
		healthPromise = getHealth();
	}

	function isHealthy(status: string): boolean {
		return status === 'ok' || status === 'healthy';
	}
</script>

<div class="p-8">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold">System Health</h1>
		<Button variant="outline" size="sm" onclick={refresh}>
			<RefreshCw class="size-4 mr-2" />
			Refresh
		</Button>
	</div>

	{#await healthPromise}
		<Card.Root class="max-w-sm">
			<Card.Header>
				<Card.Title>Health Status</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Status</span>
					<Skeleton class="h-6 w-16 rounded-full" />
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Version</span>
					<Skeleton class="h-5 w-24" />
				</div>
			</Card.Content>
		</Card.Root>
	{:then health}
		<Card.Root class="max-w-sm">
			<Card.Header>
				<Card.Title>Health Status</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Status</span>
					{#if isHealthy(health.status)}
						<Badge class="bg-green-100 text-green-800 border border-green-300">{health.status}</Badge>
					{:else}
						<Badge variant="destructive">{health.status}</Badge>
					{/if}
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Version</span>
					<code class="font-mono text-sm">{health.version}</code>
				</div>
			</Card.Content>
		</Card.Root>
	{:catch err}
		<Card.Root class="max-w-sm border-destructive">
			<Card.Header>
				<Card.Title class="text-destructive">Health Status</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-destructive">
					{err?.message ?? 'Failed to fetch health status.'}
				</p>
			</Card.Content>
		</Card.Root>
	{/await}
</div>
