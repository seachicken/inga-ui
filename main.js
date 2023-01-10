const report = JSON.stringify(window['__inga__'].report);

document.querySelector('#app').innerHTML = `
  <div class="flex">
    <nav class="w-64 h-full">
      <file-tree report=${report}></file-tree>
    </nav>
    <main>
      <span class="text-3xl font-bold underline">
        Hello!
      </span>
    </main>
  </div>
`;
