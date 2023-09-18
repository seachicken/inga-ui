import install from '@twind/with-web-components';
import config from '../twind.config';

const withTwind = install(config);

export default class TreeItem extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <li>
        <div class="w-full py-1 hover:bg-gray-100 rounded-lg">
          <div id="head" class="flex items-center">
            <div id="expand-icon" class="px-1 invisible"></div>
            <slot name="icon"></slot>
            <slot name="body"></slot>
          </div>
        </div>
        <ul id="children"></ul>
      </li>
    `;
  }

  get expand() {
    return this.getAttribute('expand');
  }

  set expand(value) {
    this.setAttribute('expand', value);
  }

  get nest() {
    return this.getAttribute('nest');
  }

  set nest(value) {
    this.setAttribute('nest', value);
  }

  appendChild(child) {
    const children = this.shadowRoot.querySelector('#children');
    children.appendChild(child);
    const expandIcon = this.shadowRoot.querySelector('#expand-icon');
    expandIcon.classList.remove('invisible');
  }

  connectedCallback() {
    super.connectedCallback();
    const expandIcon = this.shadowRoot.querySelector('#expand-icon');
    expandIcon.addEventListener('click', () => {
      this.expand = !(this.expand === 'true');
    });
    this.expand = true;
  }

  static get observedAttributes() {
    return ['nest', 'expand'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'nest') {
      const head = this.shadowRoot.querySelector('#head');
      head.classList.add(`ml-${Number(newValue) * 2}`);
    } else if (name === 'expand') {
      const expandIcon = this.shadowRoot.querySelector('#expand-icon');
      const children = this.shadowRoot.querySelector('#children');
      if (newValue === 'true') {
        expandIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path></svg>';
        children.classList.remove('hidden');
      } else {
        expandIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path></svg>';
        children.classList.add('hidden');
      }
    }
  }
}
