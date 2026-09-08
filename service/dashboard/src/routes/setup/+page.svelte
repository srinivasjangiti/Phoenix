<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	// Step management (1 to 7)
	let currentStep = $state(1);
	const totalSteps = 7;

	// User onboarding state
	let userName = $state('');
	let aiChoice = $state('local'); // 'local' | 'cloud' | 'keyword'
	let apiKey = $state('');
	let apiProvider = $state('anthropic'); // 'anthropic' | 'openai' | 'gemini'

	// Senses & permissions
	let screenEnabled = $state(true);
	let voiceEnabled = $state(true);
	let activityEnabled = $state(true);

	// Live readiness polling
	let readinessLoading = $state(false);
	let readinessData = $state(null);
	let readinessError = $state(null);
	let submitting = $state(false);

	async function fetchReadiness() {
		readinessLoading = true;
		readinessError = null;
		try {
			const res = await fetch(`${window.location.origin}/api/v1/readiness`);
			if (res.ok) {
				readinessData = await res.json();
			} else {
				readinessError = 'Unable to reach readiness service';
			}
		} catch (err) {
			readinessError = err.message || 'Connection failed';
		} finally {
			readinessLoading = false;
		}
	}

	let setupBodyEl = $state(null);

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep += 1;
			if (setupBodyEl) setupBodyEl.scrollTop = 0;
			if (currentStep === 7) {
				fetchReadiness();
			}
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep -= 1;
			if (setupBodyEl) setupBodyEl.scrollTop = 0;
		}
	}

	async function completeOnboarding() {
		submitting = true;
		try {
			const payload = {
				userName: userName.trim(),
				aiChoice,
				screenEnabled,
				voiceEnabled,
				activityEnabled,
				apiKey: apiKey.trim() || null,
				apiProvider,
			};

			const res = await fetch(`${window.location.origin}/api/v1/setup/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				// Navigate to the main application
				goto(`${base}/terminal`, { replaceState: true });
			} else {
				const data = await res.json();
				alert(`Failed to save setup: ${data.error || 'Unknown error'}`);
			}
		} catch (err) {
			alert(`Network error saving setup: ${err.message}`);
		} finally {
			submitting = false;
		}
	}

	function getStatusClass(status) {
		switch (status) {
			case 'READY': return 'badge-ready';
			case 'CHECKING': return 'badge-checking';
			case 'INSTALLING': return 'badge-installing';
			case 'NEEDS_ACTION': return 'badge-action';
			case 'UNAVAILABLE': return 'badge-unavailable';
			case 'DISABLED': return 'badge-disabled';
			case 'ERROR': return 'badge-error';
			default: return 'badge-default';
		}
	}

	onMount(() => {
		// Load existing user name if present
		fetch(`${window.location.origin}/api/v1/settings`)
			.then(r => r.ok ? r.json() : {})
			.then(data => {
				if (data.user_name) userName = data.user_name;
			})
			.catch(() => {});
	});
</script>

<svelte:head>
	<title>Phoenix Setup — First-Run Guide</title>
</svelte:head>

<div class="setup-container">
	<div class="setup-card">
		<!-- Header / Stepper -->
		<header class="setup-header">
			<div class="brand">
				<div class="logo-circle">
					<svg class="flame-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 2C9.5 5.5 6 9 6 13C6 16.31 8.69 19 12 19C15.31 19 18 16.31 18 13C18 9 14.5 5.5 12 2Z" fill="url(#setup-fire-grad)" />
						<path d="M12 9C10.5 11 9 13 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13 13.5 11 12 9Z" fill="#FFF275" />
						<defs>
							<linearGradient id="setup-fire-grad" x1="12" y1="2" x2="12" y2="19" gradientUnits="userSpaceOnUse">
								<stop stop-color="#FF8A00" />
								<stop offset="1" stop-color="#E52E71" />
							</linearGradient>
						</defs>
					</svg>
				</div>
				<span class="brand-text">PHOENIX</span>
			</div>

			<div class="stepper">
				{#each Array(totalSteps) as _, idx}
					<div class="step-dot" class:active={currentStep === idx + 1} class:completed={currentStep > idx + 1}>
						{idx + 1}
					</div>
					{#if idx < totalSteps - 1}
						<div class="step-line" class:completed={currentStep > idx + 1}></div>
					{/if}
				{/each}
			</div>
		</header>

		<!-- Step Content -->
		<main class="setup-body" bind:this={setupBodyEl}>
			<!-- STEP 1: Welcome -->
			{#if currentStep === 1}
				<div class="step-view">
					<h1 class="title">Welcome to Phoenix</h1>
					<p class="subtitle">
						Phoenix is a desktop assistant and memory system that runs on your computer.
						It manages your desktop context, organizes your notes and tasks, and provides a local workspace.
					</p>

					<div class="info-grid">
						<div class="info-box">
							<div class="info-icon">📁</div>
							<div class="info-title">Local Storage</div>
							<div class="info-desc">Conversations, tasks, and system events are stored locally on this machine (%LOCALAPPDATA%\Phoenix\data).</div>
						</div>
						<div class="info-box">
							<div class="info-icon">⚡</div>
							<div class="info-title">Managed Desktop App</div>
							<div class="info-desc">Runs as a single desktop application without requiring manual terminal commands or developer scripts.</div>
						</div>
						<div class="info-box">
							<div class="info-icon">🛡️</div>
							<div class="info-title">Explicit Permissions</div>
							<div class="info-desc">You choose whether Phoenix can capture screenshots, transcribe audio, or read active window titles.</div>
						</div>
					</div>
				</div>

			<!-- STEP 2: How Phoenix Works -->
			{:else if currentStep === 2}
				<div class="step-view">
					<h1 class="title">How Phoenix Works</h1>
					<p class="subtitle">
						Phoenix connects three local subsystems on your computer:
					</p>

					<div class="pillars-container">
						<div class="pillar-card">
							<div class="pillar-header">
								<span class="pillar-icon">🧠</span>
								<span class="pillar-tag">1. Memory</span>
							</div>
							<h3>Local Database</h3>
							<p>
								Maintains notes, conversation history, and project events in a local SQLite database (phoenix.db).
								Searches your history via full-text and vector indexing.
							</p>
						</div>

						<div class="pillar-card">
							<div class="pillar-header">
								<span class="pillar-icon">👁️</span>
								<span class="pillar-tag">2. Senses</span>
							</div>
							<h3>Desktop Inputs</h3>
							<p>
								With your permission, Phoenix can take desktop screenshots, transcribe microphone dictation, and note active application titles.
							</p>
						</div>

						<div class="pillar-card">
							<div class="pillar-header">
								<span class="pillar-icon">⚡</span>
								<span class="pillar-tag">3. Reasoning</span>
							</div>
							<h3>AI Processing</h3>
							<p>
								Processes prompts and tasks through either a local model runtime (Ollama) or an external cloud API provider that you configure.
							</p>
						</div>
					</div>
				</div>

			<!-- STEP 3: AI Engine Choice -->
			{:else if currentStep === 3}
				<div class="step-view">
					<h1 class="title">Choose Your AI Engine</h1>
					<p class="subtitle">
						Select how you want Phoenix to process intelligence. Local processing runs on your own hardware; cloud models transmit prompts over HTTPS to external API providers.
					</p>

					<div class="options-list">
						<label class="option-item" class:selected={aiChoice === 'local'}>
							<input type="radio" name="aiChoice" value="local" bind:group={aiChoice} />
							<div class="option-content">
								<div class="option-title">
									<span>Local AI (Ollama)</span>
									<span class="badge badge-accent">Runs On Device</span>
								</div>
								<div class="option-desc">
									Runs open-weight models locally on this PC via Ollama (127.0.0.1:11434). Text prompts are processed on your hardware without sending requests to external AI vendors.
								</div>
								<div class="option-note">
									Requires ~4 GB to 8 GB of available RAM and free disk space for model weights.
								</div>
							</div>
						</label>

						<label class="option-item" class:selected={aiChoice === 'cloud'}>
							<input type="radio" name="aiChoice" value="cloud" bind:group={aiChoice} />
							<div class="option-content">
								<div class="option-title">
									<span>Cloud AI Service</span>
									<span class="badge">External API</span>
								</div>
								<div class="option-desc">
									Connect your existing API key (Anthropic Claude, OpenAI, or Google Gemini).
									Faster on lower-spec hardware, but prompts are sent over HTTPS to the selected provider subject to their terms and privacy policies.
								</div>
								{#if aiChoice === 'cloud'}
									<div class="cloud-config-box">
										<div class="input-group">
											<label for="provider-select">Provider:</label>
											<select id="provider-select" bind:value={apiProvider} class="input-field">
												<option value="anthropic">Anthropic (Claude)</option>
												<option value="openai">OpenAI (ChatGPT)</option>
												<option value="gemini">Google (Gemini)</option>
											</select>
										</div>
										<div class="input-group">
											<label for="api-key-input">API Key (Optional now, can configure later):</label>
											<input
												id="api-key-input"
												type="password"
												placeholder="sk-..."
												bind:value={apiKey}
												class="input-field"
											/>
										</div>
									</div>
								{/if}
							</div>
						</label>

						<label class="option-item" class:selected={aiChoice === 'keyword'}>
							<input type="radio" name="aiChoice" value="keyword" bind:group={aiChoice} />
							<div class="option-content">
								<div class="option-title">
									<span>Keyword Search (No AI Model)</span>
									<span class="badge">Minimal Resources</span>
								</div>
								<div class="option-desc">
									Uses SQLite full-text search across your notes without running neural network runtimes.
									Ideal for lightweight note-taking on low-spec PCs.
								</div>
							</div>
						</label>
					</div>
				</div>

			<!-- STEP 4: Memory & Storage Transparency -->
			{:else if currentStep === 4}
				<div class="step-view">
					<h1 class="title">Data Storage & Boundaries</h1>
					<p class="subtitle">
						Here is where your data is stored on this machine and how it is handled.
					</p>

					<div class="transparency-card">
						<div class="transparency-row">
							<div class="t-label">Database Location</div>
							<div class="t-val code-text">%LOCALAPPDATA%\Phoenix\data\phoenix.db</div>
						</div>
						<div class="transparency-row">
							<div class="t-label">Database Encryption</div>
							<div class="t-val">SQLCipher AES-256 encrypted SQLite file. Key is stored locally at %LOCALAPPDATA%\Phoenix\data\phoenix.key.</div>
						</div>
						<div class="transparency-row">
							<div class="t-label">Captured Media</div>
							<div class="t-val">Screenshots are saved as local image files in %LOCALAPPDATA%\Phoenix\data\screenshots.</div>
						</div>
						<div class="transparency-row">
							<div class="t-label">Network & Sync</div>
							<div class="t-val">
								<span class="badge badge-warning">No default cloud sync</span>
								<span class="t-subtext">All database records remain on your local disk. Optional Tailscale mesh can be enabled in settings.</span>
							</div>
						</div>
					</div>

					<div class="notice-callout">
						<strong>Data Boundary:</strong> Phoenix does not send telemetry or sell your data. When using Local AI (Ollama), prompts remain on 127.0.0.1. When using Cloud AI, prompts are transmitted to your selected vendor API over HTTPS.
					</div>
				</div>

			<!-- STEP 5: Senses & Permissions -->
			{:else if currentStep === 5}
				<div class="step-view">
					<h1 class="title">Senses & Permissions</h1>
					<p class="subtitle">
						Phoenix can monitor your desktop context when enabled. Select which senses to activate. You can toggle these anytime in Settings.
					</p>

					<div class="permissions-list">
						<!-- Screen Watcher -->
						<div class="perm-card">
							<div class="perm-top">
								<div class="perm-info">
									<div class="perm-name">🖥️ Screen Awareness</div>
									<div class="perm-desc">Allows Phoenix to capture desktop screenshots to help answer questions about what you are seeing.</div>
								</div>
								<label class="switch">
									<input type="checkbox" bind:checked={screenEnabled} />
									<span class="slider"></span>
								</label>
							</div>
							<div class="perm-breakdown">
								<div><strong>WHAT:</strong> Captures desktop screenshots on an interval or when requested.</div>
								<div><strong>STORAGE:</strong> Saved locally as image files in your Phoenix data directory.</div>
								<div><strong>CONTROL:</strong> Can be turned off here or paused anytime from the top bar.</div>
							</div>
						</div>

						<!-- Voice Dictation -->
						<div class="perm-card">
							<div class="perm-top">
								<div class="perm-info">
									<div class="perm-name">🎙️ Voice & Dictation</div>
									<div class="perm-desc">Allows speech-to-text dictation and voice input.</div>
								</div>
								<label class="switch">
									<input type="checkbox" bind:checked={voiceEnabled} />
									<span class="slider"></span>
								</label>
							</div>
							<div class="perm-breakdown">
								<div><strong>WHAT:</strong> Listens to microphone audio only when dictation hotkey is triggered.</div>
								<div><strong>PROCESSING:</strong> Transcribed locally via Whisper STT binary or browser speech recognition.</div>
								<div><strong>CONTROL:</strong> Audio recording stops immediately when hotkey is released.</div>
							</div>
						</div>

						<!-- Activity Tracking -->
						<div class="perm-card">
							<div class="perm-top">
								<div class="perm-info">
									<div class="perm-name">📊 Window & Activity Context</div>
									<div class="perm-desc">Notes active window titles and application names.</div>
								</div>
								<label class="switch">
									<input type="checkbox" bind:checked={activityEnabled} />
									<span class="slider"></span>
								</label>
							</div>
							<div class="perm-breakdown">
								<div><strong>WHAT:</strong> Reads the foreground window title and process name.</div>
								<div><strong>STORAGE:</strong> Logged as context rows in phoenix.db to associate memories with your active apps.</div>
								<div><strong>CONTROL:</strong> Can be toggled off at any time.</div>
							</div>
						</div>
					</div>
				</div>

			<!-- STEP 6: Your Name / Personalization -->
			{:else if currentStep === 6}
				<div class="step-view">
					<h1 class="title">Personalize Your Experience</h1>
					<p class="subtitle">
						How should Phoenix address you in conversations?
					</p>

					<div class="name-form">
						<label for="name-input" class="name-label">Your Name or Nickname</label>
						<input
							id="name-input"
							type="text"
							class="name-input"
							placeholder="e.g. Alex"
							bind:value={userName}
							autofocus
						/>
						<p class="name-hint">
							Saved locally in your settings table in phoenix.db.
						</p>
					</div>
				</div>

			<!-- STEP 7: Readiness Check & Launch -->
			{:else if currentStep === 7}
				<div class="step-view">
					<h1 class="title">System Readiness</h1>
					<p class="subtitle">
						Verifying local runtime status and storage integrity before opening Phoenix.
					</p>

					{#if readinessLoading}
						<div class="loading-state">
							<div class="spinner"></div>
							<span>Evaluating local subsystems...</span>
						</div>
					{:else if readinessError}
						<div class="error-notice">
							<span>⚠️ {readinessError}</span>
							<button class="btn btn-secondary" onclick={fetchReadiness}>Retry Check</button>
						</div>
					{:else if readinessData}
						<div class="readiness-grid">
							{#each Object.entries(readinessData.components) as [key, comp]}
								<div class="readiness-card">
									<div class="comp-top">
										<span class="comp-label">{comp.label}</span>
										<span class="badge {getStatusClass(comp.status)}">{comp.status}</span>
									</div>
									<div class="comp-msg">{comp.message}</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="launch-summary">
						<p>You are all set! Click below to enter Phoenix.</p>
					</div>
				</div>
			{/if}
		</main>

		<!-- Footer Navigation -->
		<footer class="setup-footer">
			<div>
				{#if currentStep > 1}
					<button class="btn btn-secondary" onclick={prevStep} disabled={submitting}>
						&larr; Back
					</button>
				{/if}
			</div>

			<div class="footer-actions">
				{#if currentStep < totalSteps}
					<button class="btn btn-primary" onclick={nextStep}>
						Continue &rarr;
					</button>
				{:else}
					<button class="btn btn-primary btn-launch" onclick={completeOnboarding} disabled={submitting}>
						{submitting ? 'Preparing Phoenix...' : 'Enter Phoenix 🚀'}
					</button>
				{/if}
			</div>
		</footer>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #0a0a0f;
		color: #e2e8f0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	}

	.setup-container {
		width: 100vw;
		height: 100vh;
		max-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		box-sizing: border-box;
		overflow: hidden;
		background: radial-gradient(circle at 50% 20%, #171829 0%, #0a0a0f 75%);
	}

	.setup-card {
		width: 100%;
		max-width: 820px;
		height: 100%;
		max-height: min(780px, calc(100vh - 32px));
		background: rgba(18, 19, 31, 0.95);
		border: 1px solid rgba(255, 138, 0, 0.18);
		border-radius: 16px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 138, 0, 0.05);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		backdrop-filter: blur(20px);
		box-sizing: border-box;
		position: relative;
	}

	.setup-header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 32px 18px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(18, 19, 31, 0.98);
		z-index: 5;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-circle {
		width: 38px;
		height: 38px;
		background: rgba(255, 138, 0, 0.12);
		border: 1px solid rgba(255, 138, 0, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flame-icon {
		width: 22px;
		height: 22px;
	}

	.brand-text {
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 2px;
		background: linear-gradient(135deg, #ff8a00 0%, #e52e71 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.step-dot {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		color: #64748b;
		font-size: 11px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.step-dot.active {
		background: #ff8a00;
		color: #0a0a0f;
		box-shadow: 0 0 12px rgba(255, 138, 0, 0.5);
	}

	.step-dot.completed {
		background: rgba(255, 138, 0, 0.25);
		color: #ff8a00;
	}

	.step-line {
		width: 14px;
		height: 2px;
		background: rgba(255, 255, 255, 0.06);
	}

	.step-line.completed {
		background: rgba(255, 138, 0, 0.4);
	}

	.setup-body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 28px 32px;
		display: flex;
		flex-direction: column;
		overscroll-behavior: contain;
	}

	.setup-body::-webkit-scrollbar {
		width: 6px;
	}

	.setup-body::-webkit-scrollbar-track {
		background: transparent;
	}

	.setup-body::-webkit-scrollbar-thumb {
		background: rgba(255, 138, 0, 0.25);
		border-radius: 99px;
	}

	.setup-body::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 138, 0, 0.5);
	}

	.step-view {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.title {
		font-size: 26px;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 10px 0;
	}

	.subtitle {
		font-size: 14px;
		color: #94a3b8;
		line-height: 1.6;
		margin: 0 0 28px 0;
	}

	/* Step 1 Grid */
	.info-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.info-box {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 20px;
	}

	.info-icon {
		font-size: 28px;
		margin-bottom: 12px;
	}

	.info-title {
		font-size: 15px;
		font-weight: 600;
		color: #f1f5f9;
		margin-bottom: 6px;
	}

	.info-desc {
		font-size: 12px;
		color: #94a3b8;
		line-height: 1.5;
	}

	/* Step 2 Pillars */
	.pillars-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.pillar-card {
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 12px;
		padding: 20px;
	}

	.pillar-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 14px;
	}

	.pillar-icon {
		font-size: 22px;
	}

	.pillar-tag {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #ff8a00;
	}

	.pillar-card h3 {
		font-size: 15px;
		font-weight: 600;
		color: #f8fafc;
		margin: 0 0 8px 0;
	}

	.pillar-card p {
		font-size: 12px;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0;
	}

	/* Step 3 Options */
	.options-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.option-item {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 18px 20px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.option-item:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 138, 0, 0.3);
	}

	.option-item.selected {
		background: rgba(255, 138, 0, 0.05);
		border-color: #ff8a00;
	}

	.option-item input[type="radio"] {
		margin-top: 4px;
		accent-color: #ff8a00;
	}

	.option-content {
		flex: 1;
	}

	.option-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 15px;
		font-weight: 600;
		color: #f8fafc;
		margin-bottom: 6px;
	}

	.option-desc {
		font-size: 12px;
		color: #94a3b8;
		line-height: 1.5;
	}

	.option-note {
		margin-top: 6px;
		font-size: 11px;
		color: #64748b;
	}

	.cloud-config-box {
		margin-top: 14px;
		padding: 14px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.input-group label {
		font-size: 11px;
		color: #cbd5e1;
		font-weight: 500;
	}

	.input-field {
		background: #0f101a;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #f8fafc;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
	}

	/* Step 4 Transparency */
	.transparency-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 20px;
	}

	.transparency-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.t-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #64748b;
		font-weight: 700;
	}

	.t-val {
		font-size: 13px;
		color: #f1f5f9;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.t-subtext {
		font-size: 11px;
		color: #94a3b8;
	}

	.code-text {
		font-family: monospace;
		background: rgba(0, 0, 0, 0.4);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		color: #ff8a00;
		width: fit-content;
	}

	.notice-callout {
		background: rgba(255, 138, 0, 0.08);
		border-left: 3px solid #ff8a00;
		padding: 12px 16px;
		border-radius: 0 8px 8px 0;
		font-size: 12px;
		color: #cbd5e1;
		line-height: 1.5;
	}

	/* Step 5 Permissions */
	.permissions-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.perm-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 12px;
		padding: 16px 20px;
	}

	.perm-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.perm-name {
		font-size: 15px;
		font-weight: 600;
		color: #f8fafc;
	}

	.perm-desc {
		font-size: 12px;
		color: #94a3b8;
		margin-top: 2px;
	}

	.perm-breakdown {
		background: rgba(0, 0, 0, 0.25);
		border-radius: 6px;
		padding: 10px 14px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 11px;
		color: #cbd5e1;
	}

	.perm-breakdown strong {
		color: #ff8a00;
	}

	/* Toggle Switch */
	.switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		flex-shrink: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.15);
		transition: 0.3s;
		border-radius: 24px;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #ff8a00;
	}

	input:checked + .slider:before {
		transform: translateX(20px);
	}

	/* Step 6 Name */
	.name-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 400px;
		margin-top: 10px;
	}

	.name-label {
		font-size: 13px;
		font-weight: 600;
		color: #cbd5e1;
	}

	.name-input {
		background: #0f101a;
		border: 1px solid rgba(255, 138, 0, 0.3);
		border-radius: 8px;
		padding: 12px 16px;
		font-size: 16px;
		color: #f8fafc;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.name-input:focus {
		border-color: #ff8a00;
		box-shadow: 0 0 10px rgba(255, 138, 0, 0.2);
	}

	.name-hint {
		font-size: 11px;
		color: #64748b;
	}

	/* Step 7 Readiness */
	.readiness-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 24px;
	}

	.readiness-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		padding: 12px 16px;
	}

	.comp-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.comp-label {
		font-size: 13px;
		font-weight: 600;
		color: #f8fafc;
	}

	.comp-msg {
		font-size: 11px;
		color: #94a3b8;
		line-height: 1.4;
	}

	.launch-summary {
		text-align: center;
		margin-top: 10px;
		font-size: 13px;
		color: #cbd5e1;
	}

	/* Badges */
	.badge {
		font-size: 10px;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge-ready { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
	.badge-checking { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
	.badge-installing { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
	.badge-action { background: rgba(249, 115, 22, 0.2); color: #fb923c; }
	.badge-unavailable { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
	.badge-disabled { background: rgba(100, 116, 139, 0.2); color: #64748b; }
	.badge-error { background: rgba(239, 68, 68, 0.2); color: #f87171; }
	.badge-accent { background: rgba(255, 138, 0, 0.2); color: #ff8a00; }
	.badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

	/* Footer Navigation — Pinned/Sticky at Bottom */
	.setup-footer {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 32px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(14, 15, 24, 0.98);
		backdrop-filter: blur(12px);
		z-index: 10;
		box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.3);
	}

	.footer-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn {
		padding: 10px 22px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #ff8a00 0%, #e52e71 100%);
		color: #ffffff;
		box-shadow: 0 4px 14px rgba(255, 138, 0, 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.92;
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(255, 138, 0, 0.4);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.06);
		color: #cbd5e1;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: #f8fafc;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-launch {
		padding: 12px 28px;
		font-size: 14px;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 40px;
		color: #94a3b8;
		font-size: 13px;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 138, 0, 0.2);
		border-top-color: #ff8a00;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-notice {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
		padding: 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 13px;
		color: #f87171;
		margin-bottom: 20px;
	}

	@media (max-height: 840px) {
		.setup-container {
			padding: 12px;
		}

		.setup-card {
			max-height: calc(100vh - 24px);
		}

		.setup-header {
			padding: 14px 24px 12px;
		}

		.setup-body {
			padding: 18px 24px;
		}

		.title {
			font-size: 22px;
			margin-bottom: 6px;
		}

		.subtitle {
			font-size: 13px;
			margin-bottom: 16px;
		}

		.perm-card {
			padding: 12px 16px;
		}

		.perm-breakdown {
			padding: 8px 12px;
			gap: 3px;
			font-size: 10.5px;
		}

		.setup-footer {
			padding: 12px 24px;
		}

		.btn {
			padding: 8px 18px;
			font-size: 12.5px;
		}
	}

	@media (max-width: 768px) {
		.setup-container {
			padding: 8px;
		}

		.setup-card {
			max-height: calc(100vh - 16px);
		}

		.info-grid,
		.pillars-container {
			grid-template-columns: 1fr;
		}

		.readiness-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
