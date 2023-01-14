import { tw } from 'twind';

const report = JSON.stringify(window['__inga__'].report);

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex`}">
    <nav class="${tw`w-64 h-full`}">
      <file-tree report=${report}></file-tree>
    </nav>
    <main>
      <span class="${tw`text-3xl font-bold underline`}">
        Hello!
      </span>
    </main>
  </div>
`;
