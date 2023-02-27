const template = document.createElement('template');
template.innerHTML = /*html*/ `
  <style>
    #web-access {
      height: 100%;
      width: 100%;
      background: white;
    }
  </style>
  <div id="web-access"></div>`;

class PctWebaccess extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot
      .getElementById('web-access')
      .replaceWith(await this._getIframe());
  }

  async _getIframe() {
    const iframeSrc = await this._getWebAccessUrl();
    if (iframeSrc === 'ERROR') {
      const error = document.createElement('div');
      error.innerHTML =
        'ERROR: No HTTP server found with name: ' +
        this.context.inputs.httpServerName;
      return error;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'web-access');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'fullscreen');
    iframe.scrolling = 'no';
    iframe.src = iframeSrc;
    if (this.context.mode === 'edit') {
      iframe.setAttribute('style', 'pointer-events: none');
    }
    return iframe;
  }

  async getServers() {
    const client = this.context.createResourceDataClient();
    const promise = new Promise(function (resolve) {
      // Queries the "active device" on this page to find its HTTP server
      client.query(
        {
          selector: 'Agent',
          fields: ['servers.publicId', 'servers.type', 'servers.name'],
        },
        (result) => {
          const servers = result[0].data.servers;
          resolve(servers);
          client.destroy();
        }
      );
    });
    return promise;
  }

  async _getWebAccessUrl() {
    const servers = await this.getServers();
    const webServerName = this.context.inputs.httpServerName;
    const publicId = servers.find(
      (server) => server.name === webServerName && server.type === 'http'
    )?.publicId;
    if (!publicId) {
      return 'ERROR';
    }
    const url = this.context.getApiUrl('WebAccess');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.context.appData.accessToken.secretId,
        'Api-Application': this.context.appData.apiAppId,
        'Api-Company': this.context.appData.company.publicId,
        'Api-Version': '2',
      },
      body: JSON.stringify({ server: { publicId } }),
      method: 'POST',
    })
      .then((res) => res.json())
      .catch((error) => {
        console.error('Error:', error);
      });

    if (response) {
      return response.data.url;
    }
  }
}

customElements.define('pct-webaccess', PctWebaccess);
