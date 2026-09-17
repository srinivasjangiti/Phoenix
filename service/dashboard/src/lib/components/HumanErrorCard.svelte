<script>
	let {
		errorCard = null,
		onRetry = null,
		onRecovered = null,
		onDismiss = null,
	} = $props();

	let isPerformingAction = $state(false);
	let actionFeedback = $state(null);
	let copySuccess = $state(false);

	async function handlePrimaryAction() {
		if (!errorCard?.primary_action || isPerformingAction) return;
		const act = errorCard.primary_action;

		if (act.action_type === 'retry') {
			if (typeof onRetry === 'function') onRetry();
			return;
		}

		if (act.action_type === 'navigate' && act.target) {
			window.location.href = act.target;
			return;
		}

		if (act.action_type === 'api_call' && act.endpoint) {
			isPerformingAction = true;
			actionFeedback = 'Taking action...';
			try {
				const res = await fetch(act.endpoint, {
					method: act.method || 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: act.body ? JSON.stringify(act.body) : undefined,
				});
				const data = await res.json().catch(() => ({}));
				if (res.ok && (data.ok !== false)) {
					actionFeedback = 'Recovered successfully!';
					setTimeout(() => {
						isPerformingAction = false;
						if (typeof onRecovered === 'function') onRecovered(data);
					}, 800);
				} else {
					actionFeedback = data.error || 'Action could not be completed';
					setTimeout(() => { isPerformingAction = false; }, 2500);
				}
			} catch (e) {
				actionFeedback = e.message || 'Action failed';
				setTimeout(() => { isPerformingAction = false; }, 2500);
			}
		}
	}

	async function handleSecondaryAction() {
		if (!errorCard?.secondary_action) return;
		const act = errorCard.secondary_action;

		if (act.action_type === 'dismiss') {
			if (typeof onDismiss === 'function') onDismiss();
			return;
		}

		if (act.action_type === 'retry') {
			if (typeof onRetry === 'function') onRetry();
			return;
		}

		if (act.action_type === 'navigate' && act.target) {
			window.location.href = act.target;
			return;
		}

		if (act.action_type === 'copy') {
			copyDiagnostics();
			return;
		}

		if (act.action_type === 'api_call' && act.endpoint) {
			try {
				await fetch(act.endpoint, {
					method: act.method || 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: act.body ? JSON.stringify(act.body) : undefined,
				});
				if (typeof onRecovered === 'function') onRecovered();
			} catch {}
		}
	}

	async function copyDiagnostics() {
		if (!errorCard?.technical_details) return;
		const details = JSON.stringify(errorCard.technical_details, null, 2);
		try {
			await navigator.clipboard.writeText(details);
			copySuccess = true;
			setTimeout(() => { copySuccess = false; }, 2000);
		} catch {
			// Fallback copy
		}
	}
</script>

{#if errorCard}
<div class="human-error-card" class:severity-warning={errorCard.severity === 'warning'} class:severity-error={errorCard.severity === 'error' || errorCard.severity === 'critical'} class:severity-info={errorCard.severity === 'info'}>
	<div class="card-header">
		<div class="badge-icon">
			{#if errorCard.severity === 'warning'}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
			{:else if errorCard.severity === 'info'}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
			{:else}
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
			{/if}
		</div>
		<div class="header-text">
			<h4 class="card-title">{errorCard.title}</h4>
			<p class="card-desc">{errorCard.description}</p>
		</div>
	</div>

	{#if errorCard.primary_action || errorCard.secondary_action}
	<div class="action-row">
		{#if errorCard.primary_action}
			<button class="btn btn-primary" onclick={handlePrimaryAction} disabled={isPerformingAction}>
				{#if isPerformingAction}
					<span class="spinner"></span>
					<span>{actionFeedback || 'Working...'}</span>
				{:else}
					{errorCard.primary_action.label}
				{/if}
			</button>
		{/if}

		{#if errorCard.secondary_action}
			<button class="btn btn-secondary" onclick={handleSecondaryAction} disabled={isPerformingAction}>
				{errorCard.secondary_action.label}
			</button>
		{/if}
	</div>
	{/if}

	{#if errorCard.technical_details}
	<details class="tech-accordion">
		<summary>Technical Details</summary>
		<div class="tech-content">
			<div class="tech-header">
				<span class="subsystem-tag">Subsystem: {errorCard.technical_details.subsystem}</span>
				<button class="copy-btn" onclick={copyDiagnostics}>
					{copySuccess ? 'Copied!' : 'Copy Diagnostics'}
				</button>
			</div>
			<pre class="tech-pre">{JSON.stringify(errorCard.technical_details, null, 2)}</pre>
		</div>
	</details>
	{/if}
</div>
{/if}

<style>
	.human-error-card {
		margin: 12px 0;
		padding: 16px 20px;
		background: rgba(18, 18, 28, 0.85);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
		color: #e2e8f0;
		font-family: inherit;
	}

	.severity-warning {
		border-left: 4px solid #f59e0b;
	}

	.severity-warning .badge-icon {
		color: #f59e0b;
	}

	.severity-error {
		border-left: 4px solid #ef4444;
	}

	.severity-error .badge-icon {
		color: #ef4444;
	}

	.severity-info {
		border-left: 4px solid #3b82f6;
	}

	.severity-info .badge-icon {
		color: #3b82f6;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.badge-icon {
		flex-shrink: 0;
		padding-top: 2px;
	}

	.header-text {
		flex: 1;
	}

	.card-title {
		margin: 0 0 4px 0;
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.card-desc {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.45;
		color: #94a3b8;
	}

	.action-row {
		margin-top: 14px;
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #f97316;
		color: #ffffff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #ea580c;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.14);
		color: #ffffff;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.tech-accordion {
		margin-top: 14px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		padding-top: 10px;
	}

	.tech-accordion summary {
		font-size: 0.82rem;
		color: #64748b;
		cursor: pointer;
		user-select: none;
		transition: color 0.15s ease;
	}

	.tech-accordion summary:hover {
		color: #94a3b8;
	}

	.tech-content {
		margin-top: 10px;
		background: rgba(10, 10, 15, 0.6);
		border-radius: 8px;
		padding: 10px 12px;
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.tech-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.subsystem-tag {
		font-size: 0.75rem;
		color: #71717a;
		font-family: monospace;
	}

	.copy-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #94a3b8;
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 0.72rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.tech-pre {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.76rem;
		line-height: 1.4;
		color: #a1a1aa;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 200px;
		overflow-y: auto;
	}
</style>
