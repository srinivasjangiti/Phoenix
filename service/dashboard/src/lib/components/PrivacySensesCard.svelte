<script>
	/**
	 * PrivacySensesCard.svelte — Consumer-Grade Privacy & Senses Controls
	 * 
	 * Presents sensor observation options in the WHAT / WHY / EXAMPLE / CONTROL format.
	 * Grounded in documentation/PHOENIX-EXPLAINED.md and Phase 6 Productization Plan.
	 */

	let {
		screenEnabled = true,
		webcamPresenceEnabled = true,
		activityEnabled = true,
		privacyEnabled = true,
		onToggle = () => {}
	} = $props();

	function handleToggle(key, currentValue) {
		onToggle(key, !currentValue);
	}
</script>

<div class="privacy-senses-container">
	<div class="privacy-header-card">
		<div class="shield-badge">🛡️ YOUR PRIVACY IS PROTECTED</div>
		<h3 class="privacy-card-title">Senses & Digital Awareness</h3>
		<p class="privacy-card-subtitle">
			Phoenix uses ambient digital awareness to help you stay organized.
			<strong>Background sensing is 100% ephemeral in RAM:</strong> continuous video recordings and screen feeds are never saved to disk or sent to the cloud.
			Photos you explicitly take and send from your phone or face recognition reference crops are stored locally on this PC in private app data (<code>%LOCALAPPDATA%\Phoenix\data\</code>) and can be deleted at any time.
		</p>
	</div>

	<div class="senses-list">
		<!-- 1. Screen Watching -->
		<div class="sense-card" class:active={screenEnabled}>
			<div class="sense-card-header">
				<div class="sense-header-left">
					<span class="sense-icon">🖥️</span>
					<div>
						<h4 class="sense-title">Screen Watching (Active Window Awareness)</h4>
						<span class="sense-status-pill" class:on={screenEnabled}>
							{screenEnabled ? 'Active' : 'Turned Off'}
						</span>
					</div>
				</div>
				<label class="toggle-switch">
					<input
						type="checkbox"
						checked={screenEnabled}
						onchange={() => handleToggle('screen_enabled', screenEnabled)}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<div class="sense-breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">WHAT IT DOES</span>
					<p class="breakdown-text">Notices the name and title of the program you currently have in focus (e.g., <em>"Word — History Paper"</em> or <em>"Visual Studio Code"</em>).</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">WHY PHOENIX NEEDS IT</span>
					<p class="breakdown-text">Allows you to ask questions like <em>"What was I working on before lunch?"</em> without having to manually log your daily hours.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">EVERYDAY EXAMPLE</span>
					<p class="breakdown-text">You were researching Roman history on Wednesday afternoon. On Thursday morning, Phoenix remembers you were reviewing history sources.</p>
				</div>
			</div>

			<div class="sense-footer-note">
				<span class="note-icon">🔒</span>
				<span>Privacy guarantee: Only window titles and summaries are noted. Full screenshots are analyzed in temporary RAM and never saved as images.</span>
			</div>
		</div>

		<!-- 2. Desk Presence (Webcam Glance) -->
		<div class="sense-card" class:active={webcamPresenceEnabled}>
			<div class="sense-card-header">
				<div class="sense-header-left">
					<span class="sense-icon">👁️</span>
					<div>
						<h4 class="sense-title">Desk Presence (Webcam Glance)</h4>
						<span class="sense-status-pill" class:on={webcamPresenceEnabled}>
							{webcamPresenceEnabled ? 'Active' : 'Turned Off'}
						</span>
					</div>
				</div>
				<label class="toggle-switch">
					<input
						type="checkbox"
						checked={webcamPresenceEnabled}
						onchange={() => handleToggle('webcam_presence_enabled', webcamPresenceEnabled)}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<div class="sense-breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">WHAT IT DOES</span>
					<p class="breakdown-text">Periodically checks your webcam for 200 milliseconds to see if someone is sitting at your desk.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">WHY PHOENIX NEEDS IT</span>
					<p class="breakdown-text">Pauses intrusive notifications and audio alerts when you walk away so your computer doesn't chime in an empty room.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">EVERYDAY EXAMPLE</span>
					<p class="breakdown-text">You leave your desk to get a glass of water. Phoenix holds your reminder until it detects that you have sat back down in your chair.</p>
				</div>
			</div>

			<div class="sense-footer-note">
				<span class="note-icon">🔒</span>
				<span>Privacy guarantee: Images are checked in computer memory and immediately discarded. No video is recorded or stored on disk.</span>
			</div>
		</div>

		<!-- 3. Activity Tracking -->
		<div class="sense-card" class:active={activityEnabled}>
			<div class="sense-card-header">
				<div class="sense-header-left">
					<span class="sense-icon">⚡</span>
					<div>
						<h4 class="sense-title">Activity & Idle Tracking</h4>
						<span class="sense-status-pill" class:on={activityEnabled}>
							{activityEnabled ? 'Active' : 'Turned Off'}
						</span>
					</div>
				</div>
				<label class="toggle-switch">
					<input
						type="checkbox"
						checked={activityEnabled}
						onchange={() => handleToggle('activity_tracking_enabled', activityEnabled)}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<div class="sense-breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">WHAT IT DOES</span>
					<p class="breakdown-text">Measures keyboard and mouse usage to determine when you are actively working versus taking a break.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">WHY PHOENIX NEEDS IT</span>
					<p class="breakdown-text">Automatically creates your daily timeline and prevents background tasks from running while you are playing games or watching movies.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">EVERYDAY EXAMPLE</span>
					<p class="breakdown-text">After 5 minutes of no keyboard input, Phoenix marks your session as idle and defers system prompts.</p>
				</div>
			</div>

			<div class="sense-footer-note">
				<span class="note-icon">🔒</span>
				<span>Privacy guarantee: Phoenix only counts activity pulses; it never logs your keystrokes, passwords, or personal messages.</span>
			</div>
		</div>

		<!-- 4. Differential Privacy & Data Safety -->
		<div class="sense-card" class:active={privacyEnabled}>
			<div class="sense-card-header">
				<div class="sense-header-left">
					<span class="sense-icon">🛡️</span>
					<div>
						<h4 class="sense-title">Differential Privacy Protection</h4>
						<span class="sense-status-pill" class:on={privacyEnabled}>
							{privacyEnabled ? 'Active' : 'Turned Off'}
						</span>
					</div>
				</div>
				<label class="toggle-switch">
					<input
						type="checkbox"
						checked={privacyEnabled}
						onchange={() => handleToggle('privacy_enabled', privacyEnabled)}
					/>
					<span class="toggle-slider"></span>
				</label>
			</div>

			<div class="sense-breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">WHAT IT DOES</span>
					<p class="breakdown-text">Applies mathematical noise (Laplace mechanism) to data summaries to protect individual privacy.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">WHY PHOENIX NEEDS IT</span>
					<p class="breakdown-text">Ensures that if memory statistics are summarized, no third party could ever deduce your private notes or habits.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">EVERYDAY EXAMPLE</span>
					<p class="breakdown-text">Aggregated reports protect your personal details while keeping helpful insights intact.</p>
				</div>
			</div>

			<div class="sense-footer-note">
				<span class="note-icon">🔒</span>
				<span>Privacy guarantee: Enabled by default to ensure maximum on-device mathematical protection.</span>
			</div>
		</div>

		<!-- 5. Stored Media & Visual Data Transparency -->
		<div class="sense-card active">
			<div class="sense-card-header">
				<div class="sense-header-left">
					<span class="sense-icon">📷</span>
					<div>
						<h4 class="sense-title">Stored Photos &amp; Visual Identity Reference</h4>
						<span class="sense-status-pill on">Local Only</span>
					</div>
				</div>
			</div>

			<div class="sense-breakdown">
				<div class="breakdown-item">
					<span class="breakdown-label">WHAT IT STORES</span>
					<p class="breakdown-text">Only two visual items are ever saved locally: <strong>(1)</strong> photos you explicitly snap and send to Phoenix from your companion phone, and <strong>(2)</strong> a small facial reference thumbnail when multi-user identity recognition is enrolled.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">WHERE IT LIVES</span>
					<p class="breakdown-text">Saved strictly on this PC in your private Windows AppData directory (<code>%LOCALAPPDATA%\Phoenix\data\captures\</code> and <code>identity-thumbs\</code>). Never uploaded to any external server or cloud.</p>
				</div>
				<div class="breakdown-item">
					<span class="breakdown-label">YOUR CONTROL</span>
					<p class="breakdown-text">You can permanently purge all stored photos and facial thumbnails at any time using the Delete Stored Media button below in Settings.</p>
				</div>
			</div>

			<div class="sense-footer-note">
				<span class="note-icon">🔒</span>
				<span>Privacy guarantee: Zero continuous passive camera or screen recordings are ever written to disk. All stored files are fully user-deletable.</span>
			</div>
		</div>
	</div>
</div>

<style>
	.privacy-senses-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.privacy-header-card {
		background: #181825;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 20px;
	}

	.shield-badge {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #a6e3a1;
		background: rgba(166, 227, 161, 0.1);
		border: 1px solid rgba(166, 227, 161, 0.25);
		padding: 3px 10px;
		border-radius: 9999px;
		margin-bottom: 10px;
	}

	.privacy-card-title {
		font-size: 18px;
		font-weight: 600;
		color: #cdd6f4;
		margin: 0 0 6px;
	}

	.privacy-card-subtitle {
		font-size: 13.5px;
		color: #a6adc8;
		margin: 0;
		line-height: 1.5;
	}

	.privacy-card-subtitle strong {
		color: #cdd6f4;
	}

	.senses-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.sense-card {
		background: #181825;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 18px 20px;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.sense-card.active {
		border-color: rgba(137, 180, 250, 0.4);
	}

	.sense-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.sense-header-left {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.sense-icon {
		font-size: 24px;
	}

	.sense-title {
		font-size: 15.5px;
		font-weight: 600;
		color: #cdd6f4;
		margin: 0 0 4px;
	}

	.sense-status-pill {
		display: inline-block;
		font-size: 10.5px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 9999px;
		background: #313244;
		color: #6c7086;
	}

	.sense-status-pill.on {
		background: rgba(166, 227, 161, 0.12);
		color: #a6e3a1;
		border: 1px solid rgba(166, 227, 161, 0.3);
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		flex-shrink: 0;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #313244;
		transition: 0.2s;
		border-radius: 24px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: #cdd6f4;
		transition: 0.2s;
		border-radius: 50%;
	}

	input:checked + .toggle-slider {
		background-color: #89b4fa;
	}

	input:checked + .toggle-slider:before {
		transform: translateX(20px);
		background-color: #11111b;
	}

	/* WHAT / WHY / EXAMPLE Breakdown */
	.sense-breakdown {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 16px;
		background: #11111b;
		border-radius: 8px;
		border: 1px solid #1e1e2e;
		margin-bottom: 12px;
	}

	.breakdown-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.breakdown-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #89b4fa;
		text-transform: uppercase;
	}

	.breakdown-text {
		font-size: 13px;
		color: #bac2de;
		margin: 0;
		line-height: 1.45;
	}

	.breakdown-text em {
		color: #cdd6f4;
		font-style: normal;
		font-weight: 500;
	}

	/* Footer Note */
	.sense-footer-note {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #a6adc8;
		padding: 2px 4px;
	}

	.note-icon {
		font-size: 12px;
	}
</style>
