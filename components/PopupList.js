import install from '@twind/with-web-components';
import config from '../twind.config';

const withTwind = install(config);

export default class PopupList extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div class="overflow-y-auto truncate w-80 max-h-56 bg-white rounded shadow-md">
        <div class="flex items-center pt-1 pl-2 pr-1">
          <p id="title" class="font-semibold"></p>
          <div class="max-w-max mx-auto"></div>
          <button id="trash-button" class="fill-gray-500 hover:bg-gray-100 hover:rounded-full p-2" title="Clear selection">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg>
          </button>
        </div>
        <div class="p-2">
          <input type="text" name="filter" id="filter" class="w-full border-1 px-1" />
        </div>
        <ul id="popup-list" class="h-full divide-y"></ul>
      </div>

      <template id="popup-item-template">
        <li class="popup-item flex items-center px-2 hover:bg-gray-100">
          <div class="check fill-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>
          </div>
          <p class="name truncate py-1 ml-1"></p>
        </li>
      </template>
    `;

    this.popupList = this.shadowRoot.querySelector('#popup-list');
    this.popupItemTemplate = this.shadowRoot.querySelector('#popup-item-template');
    this.items = [];
    this.onCloseCallback = () => {};
    this.handleOutsideClick = (e) => {
      if (!this.classList.contains('hidden') && !this.contains(e.target)) {
        this.shadowRoot.querySelector('#filter').value = '';
        this.onCloseCallback(this.items.filter((i) => i.active));
      }
    };

    this.shadowRoot.querySelector('#filter').addEventListener('input', (e) => {
      const filter = e.target.value.toLowerCase();
      this.shadowRoot.querySelectorAll('.popup-item').forEach((item) => {
        if (item.querySelector('.name').textContent.toLowerCase().includes(filter)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    });

    this.shadowRoot.querySelector('#trash-button').addEventListener('click', () => {
      for (const item of this.items) {
        item.active = false;
        for (const dom of this.shadowRoot.querySelectorAll('.popup-item')) {
          this.applyActiveStyle(false, dom);
        }
      }
    });

    document.addEventListener('click', this.handleOutsideClick);
  }

  set onClose(callback) {
    this.onCloseCallback = callback;
  }

  static get observedAttributes() {
    return ['title', 'items'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'title') {
      this.shadowRoot.querySelector('#title').textContent = newValue;
    }
    if (name === 'items') {
      this.items = JSON.parse(newValue);

      this.popupList.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (const item of this.items) {
        const itemRoot = document.importNode(this.popupItemTemplate.content, true);
        const itemDom = itemRoot.querySelector('.popup-item');
        this.applyActiveStyle(item.active, itemDom);
        itemDom.querySelector('.name').textContent = item.name;
        itemDom.addEventListener('click', () => {
          const target = this.items.find((i) => i.name === item.name);
          target.active = !target.active;
          this.applyActiveStyle(target.active, itemDom);
        });
        fragment.appendChild(itemDom);
      }
      this.popupList.appendChild(fragment);
    }
  }

  applyActiveStyle(active, dom) {
    if (active) {
      dom.querySelector('.check').classList.remove('invisible');
    } else {
      dom.querySelector('.check').classList.add('invisible');
    }
  }
}
