import { cssomSheet } from 'twind';
import install from '@twind/with-web-components';
import config from '../twind.config';

const withTwind = install(config);
const sheet = cssomSheet({ target: new CSSStyleSheet() });
sheet.target.replaceSync(`
  .open {
    animation: open-animation 0.2s ease-in-out;
  }
  @keyframes open-animation {
    0% {
      transform: translateY(-10%);
      opacity: 0;
    }
    100% {
      transform: translateY(0%);
      opacity: 1;
    }
  }
`);

export default class SettingsPopup extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <div id="root" class="w-96 p-5 bg-white rounded-xl shadow-md">
        <p class="text-gray-500 my-1 text-sm">Copy the <span class="font-bold">.inga.yml</span> file to your project root directory to make the settings permanent.</p>
        <div class="relative">
          <textarea id="config" class="w-full mt-1 p-2 rounded text-gray-500" rows="5" disabled>
          </textarea>
          <button id="copy-button" class="absolute top-2 right-2 hover:bg-gray-100 rounded-md border-1" title="Copy to clipboard">
            <div class="fill-gray-500 m-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>
            </div>
          </button>
        </div>
      </div>
    `;

    this.root = this.shadowRoot.querySelector('#root');
    this.root.classList.add('hidden');
    this.onCloseCallback = () => {};
    this.handleOutsideClick = (e) => {
      if (!this.root.classList.contains('hidden') && !this.contains(e.target)) {
        this.onCloseCallback();
      }
    };

    this.shadowRoot.querySelector('#copy-button').addEventListener('click', async () => {
      await navigator.clipboard.writeText(this.shadowRoot.querySelector('#config').value);
    });

    document.addEventListener('click', this.handleOutsideClick);
  }

  set onClose(callback) {
    this.onCloseCallback = callback;
  }

  async open() {
    this.root.classList.remove('hidden');
    this.root.classList.add('open');
    const response = await fetch('report/.inga.yml', { cache: 'no-cache' });
    if (response.ok) {
      this.shadowRoot.querySelector('#config').value = await response.text();
    }
  }

  close() {
    this.root.classList.add('hidden');
  }
}
