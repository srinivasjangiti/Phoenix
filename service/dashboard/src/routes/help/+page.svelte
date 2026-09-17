<script>
	import { base } from '$app/paths';
	import { api } from '$lib/api.js';
	import { HELP_CATEGORIES, HELP_TOPICS, HELP_FAQS, searchHelp } from '$lib/help-catalog.js';

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let expandedTopicId = $state(null);
	let actionLoading = $state({});
	let actionResult = $state({});
	let openFaqIndex = $state(null);

	let filteredTopics = $derived(searchHelp(searchQuery, selectedCategory));

	function selectCategory(catId) {
		selectedCategory = catId;
	}

	function toggleTopic(id) {
		expandedTopicId = expandedTopicId === id ? null : id;
	}

	function toggleFaq(idx) {
		openFaqIndex = openFaqIndex === idx ? null : idx;
	}

	function clearSearch() {
		searchQuery = '';
	}

	async function handleAction(topic) {
		if (!topic.action) return;
		const action = topic.action;

		if (action.type === 'api_call') {
			actionLoading = { ...actionLoading, [topic.id]: true };
			actionResult = { ...actionResult, [topic.id]: null };

			try {
				const res = await api.post(action.target, action.body || {});
				actionResult = {
					...actionResult,
					[topic.id]: {
						ok: true,
						message: res.message || 'Action executed successfully!'
					}
				};
			} catch (err) {
				actionResult = {
					...actionResult,
					[topic.id]: {
						ok: false,
						message: err.message || 'Failed to execute action. Check system logs.'
					}
				};
			} finally {
				actionLoading = { ...actionLoading, [topic.id]: false };
			}
		}
	}
</script>

<div class="help-page">
	<header class="help-header">
		<div class="header-badge">IN-APP USER GUIDE</div>
		<h1 class="header-title">Phoenix Help Center</h1>
		<p class="header-subtitle">
			Search guides, understand how your memory works, or resolve technical issues with one click.
		</p>

		<!-- Search Bar -->
		<div class="search-container">
			<span class="search-icon">🔍</span>
			<input
				type="text"
				class="search-input"
				placeholder="How can we help you today? (e.g., 'ollama', 'memory', 'private', 'backup')..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="search-clear-btn" onclick={clearSearch} title="Clear search">✕</button>
			{/if}
		</div>
	</header>

	<!-- Category Filter Tabs -->
	<nav class="category-tabs">
		<button
			class="category-pill"
			class:active={selectedCategory === 'all'}
			onclick={() => selectCategory('all')}
		>
			<span class="pill-icon">📚</span>
			All Guides
		</button>
		{#each HELP_CATEGORIES as cat}
			<button
				class="category-pill"
				class:active={selectedCategory === cat.id}
				onclick={() => selectCategory(cat.id)}
			>
				<span class="pill-icon">{cat.icon}</span>
				{cat.title}
			</button>
		{/each}
	</nav>

	<!-- Category Overview Grid (Visible when no active search and 'all' is selected) -->
	{#if !searchQuery && selectedCategory === 'all'}
		<section class="categories-grid">
			{#each HELP_CATEGORIES as cat}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div class="category-card" onclick={() => selectCategory(cat.id)}>
					<div class="category-card-top">
						<span class="category-card-icon">{cat.icon}</span>
						<span class="category-card-badge">{cat.badge}</span>
					</div>
					<h3 class="category-card-title">{cat.title}</h3>
					<p class="category-card-summary">{cat.summary}</p>
					<span class="category-card-link">Browse articles →</span>
				</div>
			{/each}
		</section>
	{/if}

	<!-- Results / Articles Section -->
	<section class="articles-section">
		<div class="section-heading-row">
			<h2 class="section-title">
				{#if searchQuery}
					Search Results for "{searchQuery}"
				{:else if selectedCategory !== 'all'}
					{HELP_CATEGORIES.find(c => c.id === selectedCategory)?.title || 'Articles'}
				{:else}
					Featured Topics & Guides
				{/if}
			</h2>
			<span class="results-count">{filteredTopics.length} {filteredTopics.length === 1 ? 'article' : 'articles'}</span>
		</div>

		{#if filteredTopics.length === 0}
			<div class="empty-state">
				<span class="empty-icon">🔎</span>
				<h3>No guides found matching "{searchQuery}"</h3>
				<p>Try searching for words like <em>ollama</em>, <em>memory</em>, <em>offline</em>, or <em>backup</em>.</p>
				<button class="empty-reset-btn" onclick={clearSearch}>Show All Guides</button>
			</div>
		{:else}
			<div class="topics-list">
				{#each filteredTopics as topic}
					<article class="topic-card" class:expanded={expandedTopicId === topic.id}>
						<div
							class="topic-card-header"
							role="button"
							tabindex="0"
							onclick={() => toggleTopic(topic.id)}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTopic(topic.id); } }}
						>
							<div class="topic-header-left">
								<span class="topic-badge">{topic.badge}</span>
								<h3 class="topic-title">{topic.title}</h3>
								<p class="topic-summary">{topic.summary}</p>
							</div>
							<div class="topic-header-right">
								<span class="expand-indicator">{expandedTopicId === topic.id ? '▲' : '▼'}</span>
							</div>
						</div>

						{#if expandedTopicId === topic.id}
							<div class="topic-card-body">
								<div class="topic-markdown-content">
									{#each topic.content.trim().split('\n\n') as paragraph}
										<p>{paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
									{/each}
								</div>

								{#if topic.action}
									<div class="topic-action-box">
										{#if topic.action.type === 'navigate'}
											<a href="{base}{topic.action.target}" class="action-btn navigate">
												{topic.action.label} ↗
											</a>
										{:else if topic.action.type === 'api_call'}
											<button
												class="action-btn api-trigger"
												disabled={actionLoading[topic.id]}
												onclick={() => handleAction(topic)}
											>
												{#if actionLoading[topic.id]}
													<span class="spinner"></span> Running...
												{:else}
													{topic.action.label} ⚡
												{/if}
											</button>
										{/if}

										{#if actionResult[topic.id]}
											<div
												class="action-result-banner"
												class:success={actionResult[topic.id].ok}
												class:error={!actionResult[topic.id].ok}
											>
												<span class="result-icon">{actionResult[topic.id].ok ? '✓' : '⚠️'}</span>
												<span class="result-text">{actionResult[topic.id].message}</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Frequently Asked Questions (FAQ) Accordion -->
	<section class="faq-section">
		<h2 class="faq-title">Frequently Asked Questions</h2>
		<p class="faq-subtitle">Common questions from normal users getting started with Phoenix.</p>

		<div class="faq-accordion">
			{#each HELP_FAQS as faq, idx}
				<div class="faq-item" class:open={openFaqIndex === idx}>
					<button class="faq-question-btn" onclick={() => toggleFaq(idx)}>
						<span class="faq-q-text">{faq.q}</span>
						<span class="faq-icon">{openFaqIndex === idx ? '−' : '+'}</span>
					</button>
					{#if openFaqIndex === idx}
						<div class="faq-answer-box">
							<p>{faq.a}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- Security & Privacy Reassurance Card -->
	<footer class="help-footer-card">
		<div class="footer-card-left">
			<span class="footer-dot"></span>
			<div>
				<strong>100% On-Device Knowledge</strong>
				<p>All guides, search indexing, and troubleshooting triggers operate entirely on your PC with zero cloud tracking.</p>
			</div>
		</div>
		<a href="{base}/settings" class="footer-card-btn">Open Settings ⚙</a>
	</footer>
</div>

<style>
	.help-page {
		max-width: 960px;
		margin: 0 auto;
		padding: 24px 20px 60px;
		color: #cdd6f4;
		font-family: inherit;
	}

	/* Header */
	.help-header {
		text-align: center;
		margin-bottom: 28px;
	}

	.header-badge {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgba(137, 180, 250, 0.12);
		color: #89b4fa;
		border: 1px solid rgba(137, 180, 250, 0.3);
		padding: 4px 12px;
		border-radius: 9999px;
		margin-bottom: 12px;
	}

	.header-title {
		font-size: 28px;
		font-weight: 700;
		color: #cdd6f4;
		margin: 0 0 8px;
	}

	.header-subtitle {
		font-size: 15px;
		color: #a6adc8;
		margin: 0 auto 24px;
		max-width: 600px;
		line-height: 1.5;
	}

	/* Search Bar */
	.search-container {
		position: relative;
		max-width: 680px;
		margin: 0 auto;
	}

	.search-icon {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 16px;
		color: #6c7086;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		box-sizing: border-box;
		padding: 14px 44px 14px 46px;
		background: #181825;
		border: 1px solid #313244;
		border-radius: 12px;
		font-size: 14px;
		color: #cdd6f4;
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.search-input:focus {
		border-color: #89b4fa;
		box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.15);
	}

	.search-clear-btn {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
		background: #313244;
		border: none;
		color: #cdd6f4;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Category Pills */
	.category-tabs {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 6px 2px 18px;
		margin-bottom: 20px;
		scrollbar-width: thin;
	}

	.category-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: #181825;
		border: 1px solid #313244;
		border-radius: 20px;
		font-size: 13px;
		color: #a6adc8;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.category-pill:hover {
		background: #1e1e2e;
		color: #cdd6f4;
		border-color: #45475a;
	}

	.category-pill.active {
		background: rgba(137, 180, 250, 0.15);
		color: #89b4fa;
		border-color: #89b4fa;
		font-weight: 600;
	}

	/* Overview Categories Grid */
	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 14px;
		margin-bottom: 36px;
	}

	.category-card {
		background: #181825;
		border: 1px solid #313244;
		border-radius: 12px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
	}

	.category-card:hover {
		border-color: #89b4fa;
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
	}

	.category-card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.category-card-icon {
		font-size: 22px;
	}

	.category-card-badge {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		background: #313244;
		color: #a6adc8;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.category-card-title {
		font-size: 16px;
		font-weight: 600;
		color: #cdd6f4;
		margin: 0 0 6px;
	}

	.category-card-summary {
		font-size: 13px;
		color: #a6adc8;
		margin: 0 0 12px;
		line-height: 1.4;
		flex-grow: 1;
	}

	.category-card-link {
		font-size: 12px;
		font-weight: 600;
		color: #89b4fa;
	}

	/* Articles Section */
	.articles-section {
		margin-bottom: 40px;
	}

	.section-heading-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: #cdd6f4;
		margin: 0;
	}

	.results-count {
		font-size: 12px;
		color: #6c7086;
	}

	/* Topic Card */
	.topics-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.topic-card {
		background: #181825;
		border: 1px solid #313244;
		border-radius: 10px;
		overflow: hidden;
		transition: border-color 0.15s ease;
	}

	.topic-card:hover {
		border-color: #45475a;
	}

	.topic-card.expanded {
		border-color: #89b4fa;
	}

	.topic-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px;
		cursor: pointer;
		user-select: none;
	}

	.topic-header-left {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.topic-badge {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		color: #89b4fa;
		letter-spacing: 0.04em;
	}

	.topic-title {
		font-size: 15px;
		font-weight: 600;
		color: #cdd6f4;
		margin: 0;
	}

	.topic-summary {
		font-size: 13px;
		color: #a6adc8;
		margin: 0;
		line-height: 1.4;
	}

	.expand-indicator {
		font-size: 11px;
		color: #6c7086;
		margin-left: 12px;
	}

	.topic-card-body {
		padding: 0 16px 16px;
		border-top: 1px solid #232334;
		margin-top: 2px;
	}

	.topic-markdown-content {
		font-size: 13.5px;
		line-height: 1.6;
		color: #bac2de;
		margin: 14px 0 16px;
		white-space: pre-line;
	}

	.topic-action-box {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		width: fit-content;
		transition: all 0.15s ease;
	}

	.action-btn.navigate {
		background: #313244;
		color: #cdd6f4;
		border: 1px solid #45475a;
	}

	.action-btn.navigate:hover {
		background: #45475a;
		border-color: #89b4fa;
	}

	.action-btn.api-trigger {
		background: #89b4fa;
		color: #11111b;
		border: none;
	}

	.action-btn.api-trigger:hover:not(:disabled) {
		background: #b4befe;
	}

	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(17, 17, 27, 0.3);
		border-top-color: #11111b;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.action-result-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 12px;
	}

	.action-result-banner.success {
		background: rgba(166, 227, 161, 0.12);
		border: 1px solid rgba(166, 227, 161, 0.3);
		color: #a6e3a1;
	}

	.action-result-banner.error {
		background: rgba(243, 139, 168, 0.12);
		border: 1px solid rgba(243, 139, 168, 0.3);
		color: #f38ba8;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 40px 20px;
		background: #181825;
		border: 1px dashed #313244;
		border-radius: 12px;
	}

	.empty-icon {
		font-size: 32px;
		display: block;
		margin-bottom: 8px;
	}

	.empty-state h3 {
		font-size: 16px;
		color: #cdd6f4;
		margin: 0 0 6px;
	}

	.empty-state p {
		font-size: 13px;
		color: #a6adc8;
		margin: 0 0 16px;
	}

	.empty-reset-btn {
		padding: 8px 16px;
		background: #313244;
		border: 1px solid #45475a;
		border-radius: 6px;
		color: #cdd6f4;
		font-size: 13px;
		cursor: pointer;
	}

	/* FAQ Accordion */
	.faq-section {
		margin-bottom: 40px;
		padding-top: 20px;
		border-top: 1px solid #1e1e2e;
	}

	.faq-title {
		font-size: 20px;
		font-weight: 700;
		color: #cdd6f4;
		margin: 0 0 4px;
	}

	.faq-subtitle {
		font-size: 13px;
		color: #a6adc8;
		margin: 0 0 18px;
	}

	.faq-accordion {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.faq-item {
		background: #181825;
		border: 1px solid #313244;
		border-radius: 8px;
		overflow: hidden;
	}

	.faq-question-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: #cdd6f4;
		font-size: 14px;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
	}

	.faq-icon {
		font-size: 16px;
		color: #89b4fa;
		margin-left: 12px;
	}

	.faq-answer-box {
		padding: 0 16px 14px;
		font-size: 13px;
		line-height: 1.5;
		color: #bac2de;
		border-top: 1px solid #232334;
		margin-top: 2px;
	}

	.faq-answer-box p {
		margin: 10px 0 0;
	}

	/* Footer Reassurance Card */
	.help-footer-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: rgba(166, 227, 161, 0.05);
		border: 1px solid rgba(166, 227, 161, 0.2);
		border-radius: 12px;
		flex-wrap: wrap;
		gap: 12px;
	}

	.footer-card-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.footer-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #a6e3a1;
		box-shadow: 0 0 8px rgba(166, 227, 161, 0.6);
	}

	.footer-card-left strong {
		display: block;
		font-size: 13px;
		color: #cdd6f4;
		margin-bottom: 2px;
	}

	.footer-card-left p {
		font-size: 12px;
		color: #a6adc8;
		margin: 0;
	}

	.footer-card-btn {
		padding: 8px 14px;
		background: #181825;
		border: 1px solid #313244;
		border-radius: 6px;
		color: #cdd6f4;
		font-size: 12px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.footer-card-btn:hover {
		border-color: #89b4fa;
	}
</style>
