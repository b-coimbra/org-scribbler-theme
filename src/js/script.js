const $ = (e) => {
  const elems = document.querySelectorAll(e);

  if (elems.length > 1) return elems;

  return elems[0];
};

const refProxy = (target) => new Proxy(target, {
  get: (obj, prop) => $(obj[prop])
});

window.onload = () => {
  const refs = refProxy({
    title: '.title',
    subtitle: '.subtitle',
    header: '.header',
    content: '#content',
    createdDate: '.date:first-child',
    tags: '.tags',
    introduction: '#content > p',
    firstOutline: 'div[id^=outline-container-org]:first-of-type',
    toc: '#table-of-contents'
  });

  const tagMappings = [
    {
      name: 'git',
      color: '#9c6464'
    },
    {
      name: 'automation',
      color: '#8db992'
    }
  ];

  const matchers = {
    date: /(\d+\-?)+/,
    tag: /@\w+/g
  };

  const getDate = () =>
        refs.createdDate.innerText.match(matchers.date)[0];

  const getTags = () => {
    const tags = refs.title.innerText.trim().match(matchers.tag).map(s => s.replace('@', ''));

    return tagMappings.filter(tag => tags.includes(tag.name));
  };

  const setTitle = () => {
    if (refs.title) {
      refs.title.innerText = refs.title.innerText.trim().replace(matchers.tag, '');
      refs.header.insertAdjacentElement('afterbegin', refs.title);
    }
  };

  const setTags = () =>
        refs.tags.insertAdjacentElement('beforebegin', refs.subtitle);

  const createHeader = () => {
    const header = `
      <div class="header">
        <div class="tags">
          <div class="created-date tag">${getDate()}</div>
          ${
            getTags()
              .map(tag =>
                `<div class="tag" style="--tag-color: ${tag.color}">${tag.name}</div>`)
              .join('')
          }
        </div>
      </div>`;

    if (refs.toc)
      refs.content.insertAdjacentElement('beforebegin', refs.toc);

    if (refs.introduction)
      [...refs.introduction].reverse().forEach(paragraph => refs.firstOutline.insertAdjacentElement('afterbegin', paragraph));

    refs.content.insertAdjacentHTML('afterbegin', header);

    setTags();
    setTitle();
  };

  createHeader();
};
