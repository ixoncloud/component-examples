<script lang="ts">
  import type { ComponentContext, ResourceData } from '@ixon-cdk/types';
  import { onMount } from 'svelte';

  export let context: ComponentContext;

  let rootEl: HTMLElement;
  let branding: ResourceData.Branding | null = null;
  let translations: Record<string, string> = {};
  let emailAddress = '';
  let width = 0;

  $: heroImageIsVisible = width >= 700;

  onMount(() => {
    const resourceDataClient = context.createResourceDataClient();
    resourceDataClient.query(
      { selector: 'Branding', fields: ['logo'] },
      ([result]) => (branding = result.data),
    );

    translations = context.translate(['EMAIL_ADDRESS', 'LOG_IN', 'SIGN_UP']);

    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        width = entry.contentRect.width;
      });
    });
    resizeObserver.observe(rootEl);

    return () => {
      resizeObserver.unobserve(rootEl);
      resourceDataClient.destroy();
    };
  });

  function navigateToLogin(): void {
    const params = new URLSearchParams(location.search);
    const url = `/login${params.size ? `?${params}` : ''}`;
    context.navigateByUrl(url);
  }

  function handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const params = new URLSearchParams({ emailAddress });
    const url = `/register?${params}`;
    context.navigateByUrl(url);
  }
</script>

<main bind:this={rootEl}>
  <header>
    {#if branding?.logo}
      <img class="header-logo" src={branding.logo} alt="Company logo" />
    {/if}
    <button on:click={navigateToLogin} class="button login-button">
      {translations.LOG_IN}
    </button>
  </header>
  <div class="hero">
    <section class="hero-content">
      <hgroup>
        <h1>A Thought-Provoking Headline</h1>
        <h2>
          A quick value proposition that will make your visitors want to click
          on or sign up for you offer
        </h2>
      </hgroup>
      <form on:submit={handleFormSubmit} autocomplete="off" novalidate>
        <input
          class="form-input"
          type="email"
          bind:value={emailAddress}
          placeholder={translations.EMAIL_ADDRESS}
        />
        <button class="button" type="submit">{translations.SIGN_UP}</button>
      </form>
    </section>
    {#if heroImageIsVisible}
      <section class="hero-image">
        <svg
          width="330"
          height="330"
          viewBox="0 0 330 330"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M311.792 97.9755C334.327 155.01 331.194 232.3 277.435 280.87C223.778 329.34 119.393 349.191 61.1876 306.768C2.98268 264.344 -9.04231 159.747 20.6665 92.7356C50.3752 25.8253 121.818 -3.49834 181.539 0.33086C241.36 4.05929 289.359 40.9406 311.792 97.9755Z"
            fill="color-mix(in srgb, white, var(--primary) 80%)"
          />
        </svg>
        <hgroup>
          <h1>Hero Image</h1>
          <h2>That highlights your product or its value</h2>
        </hgroup>
      </section>
    {/if}
  </div>
</main>

<style lang="scss">
  $border-radius: 4px;

  header {
    box-sizing: border-box;
    height: 80px;
    padding: 1em;
    display: flex;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    justify-content: center;
    align-items: center;
  }

  main {
    background: white;
    height: 100%;
    width: 100%;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  .hero {
    height: 100%;
    padding: 1em;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    background: var(--primary);
    color: var(--primary-color);

    section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-content {
      form {
        width: 100%;
        max-width: 360px;
        display: flex;
        flex-direction: row;
        font-size: 16px;

        input {
          flex: 1;

          & + button {
            margin-left: 0.5em;
          }
        }
      }

      hgroup {
        display: inline-block;
        max-width: 600px;
        font-weight: 800;

        h1 {
          margin: 0 0 32px;
          font-size: 64px;
        }

        h2 {
          margin: 0 0 32px;
          font-size: 28px;
          line-height: 1.5;
          font-weight: 500;
        }
      }
    }

    .hero-image {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      place-content: center;
      aspect-ratio: 1/1;
      color: var(--accent-color);
      width: 480px;

      @media (max-width: 600px) {
        display: none !important;
      }

      svg {
        height: 100%;
        width: 100%;
        position: absolute;
        inset: 0;
      }

      hgroup {
        display: inline-block;
        max-width: 200px;
        font-weight: 800;
        text-align: center;
        position: relative;
        z-index: 10;

        h1 {
          margin: 0 0 20px;
          font-size: 36px;
        }

        h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.5;
          font-weight: 500;
        }
      }
    }
  }

  .button {
    height: 48px;
    padding: 0.5em 1.5em;
    border: none;
    border-radius: $border-radius;
    background-color: var(--accent);
    color: var(--accent-color);
    font-weight: 400;
    font-size: 18px;
    white-space: nowrap;
    cursor: pointer;
  }

  .header-logo {
    display: block;
    max-height: 100%;
  }

  .form-input {
    box-sizing: border-box;
    height: 48px;
    padding: 8px;
    border: none;
    border-radius: $border-radius;
    outline: none;
    font-size: 18px;
  }

  .login-button {
    margin-left: auto;
  }
</style>
