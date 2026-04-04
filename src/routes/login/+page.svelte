<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ActionData } from './$types.js';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Admin Login</Card.Title>
			<Card.Description>Enter your admin key to access the dashboard</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="flex flex-col gap-4"
			>
				<div class="flex flex-col gap-2">
					<Label for="key">Admin Key</Label>
					<Input id="key" name="key" type="password" autocomplete="off" required />
				</div>

				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}

				<Button type="submit" disabled={loading} class="w-full">
					{loading ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
