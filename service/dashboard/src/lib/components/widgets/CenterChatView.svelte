<script>
	let { scrollElBind = $bindable(null), ...rest } = $props();
</script>
<div class="widget-centerchatview" bind:this={scrollElBind}></div>
