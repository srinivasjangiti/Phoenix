<script>
  import { getPanMode } from '$lib/stores.svelte.js';
</script>

<div class="topbar-status">
  <span class="status-indicator online" title="Phoenix Online"></span>
</div>

<style>
  .topbar-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a6e3a1;
  }
</style>
