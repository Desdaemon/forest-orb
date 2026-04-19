<script lang="ts">
  import { toasts, removeToast } from '$lib/stores/toast';
</script>

<div class="toastContainer" role="status" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div class="toast{toast.icon ? ' theme-' + toast.icon : ''}{toast.persist ? ' systemToast' : ''}">
      {#if toast.icon}
        <div class="icon">{toast.icon}</div>
      {/if}
      <div class="toastMessageContainer">
        <div class="toastMessage">{toast.message}</div>
      </div>
      <button class="closeToast" onclick={() => removeToast(toast.id)} type="button" aria-label="Close">&#10005;</button
      >
    </div>
  {/each}
</div>

<style>
  .toastContainer {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 10000;
    pointer-events: none;
  }

  .toastContainer.top {
    bottom: auto;
    top: 0;
  }

  .toastContainer.right {
    left: auto;
    right: 0;
  }

  .toast {
    pointer-events: auto;
    margin-bottom: 8px;
    padding: 12px 16px;
    border-radius: 4px;
    background: var(--bg-color);
    color: var(--text-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    animation: toastSlideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toast.fade {
    animation: toastFadeOut 1s ease forwards;
  }

  .toastMessageContainer {
    flex: 1;
  }

  .toastMessage {
    word-wrap: break-word;
  }

  .icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .closeToast {
    flex-shrink: 0;
    cursor: pointer;
    margin-left: auto;
    padding: 4px;
    color: var(--text-color);
    text-decoration: none;
  }

  @keyframes toastSlideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes toastFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
