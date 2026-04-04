<script lang="ts">
	import { page } from '$app/state';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { ShoppingCart, ArrowDownCircle, ArrowLeftRight, Wallet, Activity, LogOut } from '@lucide/svelte';

	let { children } = $props();

	const navLinks = [
		{ href: '/orders', label: 'Orders', icon: ShoppingCart },
		{ href: '/deposits', label: 'Deposits', icon: ArrowDownCircle },
		{ href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
		{ href: '/wallets', label: 'Wallets', icon: Wallet },
		{ href: '/health', label: 'Health', icon: Activity },
	];

</script>

<div class="flex h-screen overflow-hidden">
	<aside class="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
		<div class="p-4">
			<p class="font-bold">OCRCH Admin</p>
			<p class="text-sm text-sidebar-foreground/60">Dashboard</p>
		</div>

		<Separator />

		<nav class="flex-1 p-2">
			{#each navLinks as link (link.href)}
				{@const isActive = page.url.pathname === link.href || page.url.pathname.startsWith(link.href + '/')}
				<a
					href={link.href}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors {isActive
						? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
						: 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
				>
					<link.icon class="size-4" />
					{link.label}
				</a>
			{/each}
		</nav>

		<Separator />

		<div class="p-4">
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
				>
					<LogOut class="size-4" />
					Sign Out
				</button>
			</form>
		</div>
	</aside>

	<main class="flex-1 overflow-y-auto bg-background">
		{@render children()}
	</main>
</div>
