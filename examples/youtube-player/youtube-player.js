const template = document.createElement('template');
template.innerHTML = /*html*/`
  <style>
    #player {
      height: 100%;
      width: 100%;
      background: black;
    }
  </style>
  <div id="player"></div>`;

class PctYoutubePlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.getElementById('player').replaceWith(this._getIframe());
  }

  _getIframe() {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'player');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    const params = new URLSearchParams({
      autoplay: this.context.inputs.autoplay ? 1 : 0,
      modestbranding: 1,
      playsinline: 1,
    });
    iframe.src = `https://www.youtube.com/embed/${this._getVideoId()}?${params.toString()}`;
    if (this.context.mode === 'edit') {
      iframe.setAttribute('style', 'pointer-events: none');
    }
    return iframe;
  }

  _getVideoId() {
    const input = this.context.inputs.video || '';
    const matches = input.match(/v=([^&#]{5,})/);
    return matches && typeof matches[1] == 'string' ? matches[1] : input;
  }
}

customElements.define('pct-youtube-player', PctYoutubePlayer);
