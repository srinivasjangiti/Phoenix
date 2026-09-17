<script>
	// Root route — redirect to /comms so Phoenix dashboard lands on the
	// consumer Assistant hub by default instead of the developer CLI.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	onMount(async () => {
		try {
			const res = await fetch('/api/v1/readiness');
			if (res.ok) {
				const data = await res.json();
				if (data && data.first_run_complete === false) {
					goto(`${base}/setup`, { replaceState: true });
					return;
				}
			}
		} catch {}
		goto(`${base}/comms?view=contacts&thread=thread-phoenix-system`, { replaceState: true });
	});
</script>

<div class="redirecting">Loading Phoenix Assistant…</div>

<style>
	.redirecting {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6c7086;
		font-size: 13px;
	}
</style>
