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
    fileTags: '.tag:not(.created-date)',
    introduction: '#content > *:not(.header):not([id^=outline])',
    firstOutline: 'div[id^=outline-container-org]:first-of-type',
    toc: '#table-of-contents',
    tocLabel: '#table-of-contents > h2',
    tocLinks: '#table-of-contents ul li',
    containers: '[id^=outline-container-org]',
    headlines: '[id^=outline-container-org] h2, [id^=outline-container-org] h3',
    tagViewer: '.tag-viewer',
    toolbar: '#toolbar',
    toolbarFavButton: '.favorite-button',
    toolbarGoUpButton: '.go-upward-button'
  });

  const matchers = {
    date: /(\d+\-?)+/,
    tag: /@\w+/g
  };

  const getDate = () =>
    refs.createdDate.innerText.match(matchers.date)[0];

  const getAuthor = () =>
    refs.author.innerText.split('Author: ').join('');

  const getAllTags = async () => {
    if (document.URL.startsWith('file')) return [];

    return await fetch(`${window.location.origin}/tags.json`)
      .then(response => response.json())
      .catch(() => console.log('No tags.json found.'));
  };

  const getCurrentTags = async () => {
    const filepath = window.location.pathname
      .split('/')
      .slice(-1)[0]
      .split('.')[0];

    const tags = await getAllTags()
      .then(data => data?.tags?.filter(x => x.files.includes(filepath)))
      .catch(() => console.log('Error fetching tags for current file.'));

    if (!tags) return [];

    return tags;
  };

  const searchByTag = async (tagNames) => {
    if (!tagNames.length) {
      refs?.tagViewer?.remove();
      return;
    }

    await getAllTags()
      .then(data => Array.from(new Set(
        data?.tags
          ?.filter(x => tagNames.includes(x.name))
          ?.map(x => x.files)
          ?.flat())))
      .then(files => setTagViewer(files));
  };

  const addFileTagEvents = () => {
    const fileTags = Array.from(document.querySelectorAll('.tag:not(.created-date)'));

    fileTags.forEach(tag => {
      tag.onclick = ({ currentTarget: target }) => {
        target.classList.toggle('active');

        const selectedTags = fileTags
          .filter(f => f.classList.contains('active'));

        searchByTag(selectedTags.map(x => x.getAttribute('tagName')));
      };
    });
  };

  const setTagViewer = (files) => {
    if (refs.tagViewer) refs?.tagViewer?.remove();

    refs.header.insertAdjacentHTML(
      'beforeend',
      `<div class="tag-viewer">
        <div class="file-tag-references">
          ${
            files.map(file => `<a href='/${file}'>${file}</a>`).join('&#65372;')
          }
        </div>
      </div>`);
  };

  const setTitle = () => {
    refs.title.innerText = refs.title.innerText.trim().replace(matchers.tag, '');
    refs.header.insertAdjacentElement('afterbegin', refs.title);
  };

  const setSubtitle = () => {
    return refs.tags.insertAdjacentElement('beforebegin', refs.subtitle);
  };

  const setAuthor = () => {
    return refs.tags.insertAdjacentHTML(
      'beforebegin',
      `<p class="author"><span>by</span> ${getAuthor()}</p>`);
  };

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

      if (content.scrollTop === 0)
        refs.toolbar?.classList?.add('hidden');
      else
        refs.toolbar?.classList?.remove('hidden');

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

  const addCredits = () => {
    const credits = `
        <p class="credits">
          <span>Made with<span>
          <a href="https://github.com/b-coimbra/org-scribbler-theme" ignore-icon="link" class="credits-button">
            org-scribbler
          </a>
        </p>
      `;

    refs.toc.insertAdjacentHTML('beforeend', credits);
  };

  const addToolbar = () => {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="toolbar" class="hidden">
        <button class="go-upward-button toolbar-button" title="Go up">
          <span class="material-icons">arrow_upward</span>
        </button>
      </div>`);

    refs.toolbarGoUpButton.onclick = () =>
      refs.content.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createHeader = async () => {
    const tags = await getCurrentTags();

    const header = `
      <div class="header">
        <div class="tags">
          ${refs.createdDate ? `<div class="created-date tag">${getDate()}</div>` : ''}
          ${tags.map(tag => `
            <div class="tag" tagName="${tag.name}" style="--tag-color: ${tag.color || '#6095ad'}">
              ${tag.name}
              <span class="tag-count">${tag.files.length}</span>
            </div>`).join('')
          }
        </div>
      </div>`;

    if (refs.toc)
      refs.content.insertAdjacentElement('beforebegin', refs.toc);

    if (refs.introduction) {
      if (refs.introduction.length && refs.firstOutline)
        Array.from(refs.introduction)
          .reverse()
          .forEach(paragraph => refs.firstOutline.insertAdjacentElement('afterbegin', paragraph));
      else
        refs.firstOutline?.insertAdjacentElement('afterbegin', refs.introduction);
    }

    refs.content.insertAdjacentHTML('afterbegin', header);

    if (refs.tocLabel)
      refs.tocLabel.innerText = 'Contents';

    if (refs.tags && refs.subtitle) setSubtitle();
    if (refs.tags && refs.author) setAuthor();
    if (refs.header && refs.title) setTitle();
    if (refs.fileTags) addFileTagEvents();
  };

  addHeadlineLinks();
  createHeader();
  changeLinkState();
  addCredits();
  addToolbar();

  refs.content.onscroll = changeLinkState;
};
