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
    author: '.author',
    tags: '.tags',
    introduction: '#content > p',
    firstOutline: 'div[id^=outline-container-org]:first-of-type',
    toc: '#table-of-contents',
    tocLabel: '#table-of-contents > h2',
    tocLinks: '#table-of-contents ul li',
    containers: '[id^=outline-container-org]',
    headlines: '[id^=outline-container-org] h2, [id^=outline-container-org] h3'
  });

  const tagMappings = [
    {
      name: 'git',
      color: '#9c6464'
    },
    {
      name: 'automation',
      color: '#8db992'
    },
    {
      name: 'dotfiles',
      color: '#afa6ea'
    },
    {
      name: 'emacs',
      color: '#fdd262'
    }
  ];

  const matchers = {
    date: /(\d+\-?)+/,
    tag: /@\w+/g
  };

  const getDate = () =>
        refs.createdDate.innerText.match(matchers.date)[0];

  const getAuthor = () =>
        refs.author.innerText.split('Author: ').join('');

  const getTags = () => {
    const tags = refs.title?.innerText.trim().match(matchers.tag)?.map(s => s.replace('@', ''));

    if (!tags) return [];

    return tags.map(tag =>
      tagMappings.find(t => t.name === tag) ?? { name: tag, color: '#6095ad' }
    );
  };

  const setTitle = () => {
    if (refs.title) {
      refs.title.innerText = refs.title.innerText.trim().replace(matchers.tag, '');
      refs.header.insertAdjacentElement('afterbegin', refs.title);
    }
  };

  const setSubtitle = () =>
        refs.tags.insertAdjacentElement('beforebegin', refs.subtitle);

  const setAuthor = () =>
        refs.tags.insertAdjacentHTML('beforebegin', `<p class="author"><span>by</span> ${getAuthor()}</p>`);

  const changeLinkState = () => {
    const { containers, content, tocLinks: links } = refs;

    if (!links) return;

    const deactivateAll = () =>
          links.forEach((link) => link.classList.remove('active'));

    let index = containers.length;

    while (--index && refs.content.scrollTop < containers[index].offsetTop) { }

    if (links.length) {
      links.forEach(link => {
        link.onclick = () => {
          deactivateAll();
          link.classList.add('active');
        };
      });

      deactivateAll();

      const parent = links[index]?.parentNode?.parentNode;

      if (parent?.tagName === 'LI')
        parent.classList.add('active');

      links[index].classList.add('active');

      if (content.scrollTop >= (content.scrollHeight - content.offsetHeight)) {
        deactivateAll();
        links[links.length - 1].classList.add('active');
      }
    }
  };

  const addHeadlineLinks = () => {
    if (!refs.headlines) return;

    Array.from(refs.headlines).forEach(headline => {
      headline.innerHTML = `<a href="#${headline.getAttribute('id')}">${headline.innerHTML}</a>`;
    });
  };

  const createHeader = () => {
    const header = `
      <div class="header">
        <div class="tags">
          ${refs.createdDate ? `<div class="created-date tag">${getDate()}</div>` : ''}
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

    if (refs.introduction) {
      if (refs.introduction.length)
        Array.from(refs.introduction)
          .reverse()
          .forEach(paragraph => refs.firstOutline.insertAdjacentElement('afterbegin', paragraph));
      else
        refs.firstOutline.insertAdjacentElement('afterbegin', refs.introduction);
    }

    refs.content.insertAdjacentHTML('afterbegin', header);

    if (refs.tocLabel)
      refs.tocLabel.innerText = 'Contents';

    if (refs.tags && refs.subtitle) setSubtitle();
    if (refs.tags && refs.author) setAuthor();
    if (refs.header && refs.title) setTitle();
  };

  addHeadlineLinks();
  createHeader();
  changeLinkState();

  refs.content.onscroll = changeLinkState;
};
