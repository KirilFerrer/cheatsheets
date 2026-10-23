const Utils = {
  LIBRARY: {
    fuse: { lib: ['/js/fuse_7.1.0.js'], instance: 'Fuse', attr: { async: !0 } }
  },
  loadScripts(e, t, n = {}, i = document.head) {
    const o = [];
    for (const t in e)
      (o[t] = document.createElement('script')),
        o[t].setAttribute('type', 'text/javascript'),
        o[t].setAttribute('src', e[t]),
        Object.keys(n).forEach((e) => {
          o[t].setAttribute(e, n[e]);
        });
    !(function e() {
      const n = o.shift();
      let s = !1;
      i.appendChild(n),
        (n.onload = n.onreadystatechange =
          function () {
            const n = this.readyState;
            (n && 'complete' !== n && 'loaded' !== n) || s || ((s = !0), o.length ? e() : t());
          });
    })();
  },
  externalLibrary(e) {
    return new Promise((t) => {
      void 0 === window[e.instance] || null === window[e.instance]
        ? this.loadScripts(
            e.lib,
            () => {
              t(window[e.instance]);
            },
            e.attr,
            e.container
          )
        : t(window[e.instance]);
    });
  }
};
function initShareDropdown() {
  const e = document.getElementById('share-dropdown'),
    t = document.getElementById('share-trigger'),
    n = document.getElementById('share-menu');
  function i() {
    'true' === t.getAttribute('aria-expanded') && o();
  }
  function o() {
    const e = t.getBoundingClientRect();
    let i = e.right - 224,
      o = e.bottom + 8;
    const s = window.innerWidth;
    i < 8 && (i = 8),
      i + 224 > s - 8 && (i = s - 224 - 8),
      o + 300 > window.innerHeight && (o = e.top - 300 - 8),
      (n.style.left = `${i}px`),
      (n.style.top = `${Math.max(8, o)}px`);
  }
  function s() {
    t.setAttribute('aria-expanded', 'false'),
      (n.style.pointerEvents = 'none'),
      n.classList.remove('opacity-100', 'visible', 'scale-100'),
      n.classList.add('opacity-0', 'invisible', 'scale-95');
  }
  e &&
    t &&
    n &&
    (t.addEventListener('click', (e) => {
      e.preventDefault(), e.stopPropagation();
      'true' === t.getAttribute('aria-expanded')
        ? s()
        : (t.setAttribute('aria-expanded', 'true'),
          o(),
          (n.style.pointerEvents = 'auto'),
          n.classList.remove('opacity-0', 'invisible', 'scale-95'),
          n.classList.add('opacity-100', 'visible', 'scale-100'));
    }),
    document.addEventListener('click', (t) => {
      e.contains(t.target) || n.contains(t.target) || s();
    }),
    document.addEventListener('keydown', (e) => {
      if ('Escape' === e.key && t.getAttribute('aria-expanded') === 'true') {
        s();
        t.focus();
      }
    }),
    window.addEventListener('scroll', i),
    window.addEventListener('resize', i),
    window.addEventListener('pagehide', s),
    window.addEventListener('pageshow', (e) => {
      e.persisted && s();
    }));
}
function fallbackCopyToClipboard(e) {
  const t = document.createElement('textarea');
  (t.value = e),
    (t.style.position = 'fixed'),
    (t.style.left = '-999999px'),
    (t.style.top = '-999999px'),
    document.body.appendChild(t),
    t.focus(),
    t.select();
  try {
    document.execCommand('copy'), showCopyNotification('Enlace copiado al portapapeles.');
  } catch {
    showCopyNotification('No se pudo copiar el enlace.');
  }
  document.body.removeChild(t);
}
function showCopyNotification(e) {
  const t = document.createElement('div');
  (t.className =
    'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300'),
    (t.textContent = e),
    t.setAttribute('role', 'status'),
    document.body.appendChild(t),
    setTimeout(() => {
      t.classList.remove('translate-x-full');
    }, 100),
    setTimeout(() => {
      t.classList.add('translate-x-full'),
        setTimeout(() => {
          document.body.removeChild(t);
        }, 300);
    }, 2e3);
}
!(function () {
  function e() {
    const e = document.getElementById('toc-container'),
      t = document.getElementById('toc-list');
    if (!e || !t) return;
    const n = document.querySelectorAll('.h2-wrap h2');
    if (0 === n.length) return void (e.style.display = 'none');
    function i() {
      const e = document.querySelectorAll('.toc-link');
      let i = -1;
      const o = window.pageYOffset + 100;
      for (let e = n.length - 1; e >= 0; e--)
        if (n[e].offsetTop <= o) {
          i = e;
          break;
        }
      e.forEach((e, t) => {
        e.classList.remove('active'), t <= i ? e.classList.add('read') : e.classList.remove('read');
      }),
        i >= 0 && e[i] && e[i].classList.add('active');
      let s = 0;
      i >= 0 && (s = ((i + 1) / n.length) * 100);
      const a =
          (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
        c = Math.max(s, a || 0);
      t.style.setProperty('--progress-height', `${Math.min(c, 100)}%`);
    }
    (t.innerHTML = ''),
      n.forEach((e, n) => {
        let i = e.textContent.trim().replace(/^#+\s*/, '');
        const o = e.id || `heading-${n}`;
        e.id || (e.id = o);
        const s = document.createElement('a');
        (s.href = `#${o}`),
          (s.className = 'toc-link'),
          s.setAttribute('data-tooltip', i),
          s.addEventListener('click', (e) => {
            e.preventDefault();
            const t = document.getElementById(o);
            if (t) {
              const e = t.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / 2;
              window.scrollTo({ top: Math.max(0, e), behavior: 'smooth' }),
                window.history.replaceState(window.history.state, '', `#${o}`);
            }
          }),
          t.appendChild(s);
      });
    let o = !1;
    e.addEventListener(
      'touchstart',
      function () {
        (o = !0), (e.style.transition = 'none');
      },
      { passive: !1 }
    ),
      e.addEventListener(
        'touchmove',
        function (t) {
          if (!o) return;
          t.preventDefault();
          const i = t.touches[0].clientY,
            s = e.getBoundingClientRect(),
            a = s.height,
            c = (i - s.top) / a,
            r = Math.floor(c * n.length),
            l = Math.max(0, Math.min(r, n.length - 1)),
            d = document.querySelectorAll('.toc-link');
          d.forEach((e, t) => {
            e.classList.remove('active'),
              t <= l ? e.classList.add('read') : e.classList.remove('read');
          }),
            d[l] && d[l].classList.add('active');
        },
        { passive: !1 }
      ),
      e.addEventListener(
        'touchend',
        function (t) {
          if (!o) return;
          (o = !1), (e.style.transition = '');
          const i = t.changedTouches[0].clientY,
            s = e.getBoundingClientRect(),
            a = s.height,
            c = (i - s.top) / a,
            r = Math.floor(c * n.length),
            l = Math.max(0, Math.min(r, n.length - 1));
          if (n[l]) {
            const e = n[l],
              t = e.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / 2;
            window.scrollTo({ top: Math.max(0, t), behavior: 'smooth' }),
              window.history.replaceState(window.history.state, '', `#${e.id}`);
          }
        },
        { passive: !1 }
      ),
      window.addEventListener('scroll', i, { passive: !0 }),
      window.addEventListener('hashchange', i),
      i();
  }
  'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', e) : e();
})(),
  (window.shareOnX = function () {
    const e = encodeURIComponent(window.location.href),
      t = encodeURIComponent(document.title);
    window.open(`https://x.com/intent/tweet?text=${t}&url=${e}`, '_blank');
  }),
  (window.shareOnFacebook = function () {
    const e = encodeURIComponent(window.location.href);
    window.open(`https://facebook.com/sharer/sharer.php?u=${e}`, '_blank');
  }),
  (window.shareOnReddit = function () {
    const e = encodeURIComponent(window.location.href),
      t = encodeURIComponent(document.title);
    window.open(`https://reddit.com/submit/?url=${e}&resubmit=true&title=${t}`, '_blank');
  }),
  (window.shareOnPinterest = function () {
    const e = encodeURIComponent(window.location.href),
      t = encodeURIComponent(document.title);
    window.open(`https://pinterest.com/pin/create/button/?url=${e}&description=${t}`, '_blank');
  }),
  (window.shareOnLinkedIn = function () {
    const e = encodeURIComponent(window.location.href),
      t = encodeURIComponent(document.title);
    window.open(`https://www.linkedin.com/shareArticle?url=${e}&title=${t}`, '_blank');
  }),
  (window.shareOnLine = function () {
    const e = encodeURIComponent(window.location.href);
    window.open(`https://social-plugins.line.me/lineit/share?url=${e}`, '_blank');
  }),
  (window.shareViaEmail = function () {
    const e = encodeURIComponent(window.location.href),
      t = encodeURIComponent(document.title);
    window.location.href = `mailto:?subject=${t}&body=${e}`;
  }),
  (window.copyToClipboard = function () {
    const e = window.location.href;
    navigator.clipboard && window.isSecureContext
      ? navigator.clipboard
          .writeText(e)
          .then(() => {
            showCopyNotification('Enlace copiado al portapapeles.');
          })
          .catch(() => {
            fallbackCopyToClipboard(e);
          })
      : fallbackCopyToClipboard(e);
  }),
  window.addEventListener('load', () => {
    function e() {
      const e = window.location.hash,
        t = document.querySelector(`a[class="h-anchor"][href="${e}"]`);
      if (null !== t) {
        const e = t.parentElement.parentElement;
        document.querySelectorAll('.boxed').forEach((e) => {
          e.classList.remove('boxed');
        });
        const n = setTimeout(() => {
          e.classList.add('boxed'), clearTimeout(n);
        }, 100);
      }
    }
    function t(e) {
      const t = e || {},
        n = {
          trigger: '#mysearch-trigger',
          container: '#mysearch',
          dbPath: `${location.protocol}//${location.host}/search.json?v=1.0`
        };
      (this.container = void 0 !== t.container ? t.container : n.container),
        (this.trigger = void 0 !== t.trigger ? t.trigger : n.trigger),
        (this.dbPath = void 0 !== t.dbPath ? t.dbPath : n.dbPath),
        (this.lastSearch = {}),
        (window.search = this);
    }
    const updateThemeLabel = () => {
      const label = document.documentElement.classList.contains('dark')
        ? 'Activar tema claro'
        : 'Activar tema oscuro';
      const button = document.querySelector('#darkMode');
      button.setAttribute('aria-label', label);
      button.title = label;
    };
    updateThemeLabel();
    initShareDropdown(),
      document.querySelector('#darkMode').addEventListener('click', () => {
        const e = document.documentElement.classList;
        e.toggle('dark');
        const t = e.contains('dark');
        try {
          localStorage.setItem('theme', t ? 'dark' : '');
        } catch {
          /* Theme stays usable for this visit. */
        }
        updateThemeLabel();
      }),
      document.querySelectorAll('ul.collapsible > li > strong').forEach((e) => {
        const t = e.parentElement;
        t.classList.add('active'),
          e.classList.toggle('arrow-down'),
          e.addEventListener('click', function () {
            t.classList.toggle('active'), this.classList.toggle('arrow-down');
          });
      }),
      document.querySelectorAll('.h3-wrap ul').forEach((e) => {
        const t = e.querySelectorAll('li').length,
          n = e.className.match('cols-([0-9]+)'),
          i = null === n ? 1 : parseInt(n[1]),
          o = 1 === t || t % i === 0 ? i : t % i;
        for (let t = 1; t <= o; t++) {
          const n = e.querySelector(`li:nth-last-child(${t})`);
          null !== n && (n.style.borderBottom = 'none');
        }
      }),
      e(),
      window.addEventListener('popstate', e),
      (t.prototype = {
        start() {
          const e = this;
          (this.search = document.querySelector(this.container)),
            (this.box = document.querySelector('#mysearch-box')),
            (this.input = document.querySelector('#mysearch-input')),
            (this.result = document.querySelector('#mysearch-list')),
            (this.status = document.querySelector('#mysearch-status')),
            (this.lastSearch.query = this.input.value),
            this.detectModal();
          document.querySelector('.cancel').addEventListener('click', () => {
            e.closeModal(!0);
          });
          document.querySelector('#mysearch-clear').addEventListener('click', () => {
            e.input.value = '';
            e.input.focus();
            e.doSearch('', !0);
          });
          this.search.addEventListener('close', () => {
            document.body.classList.remove('overflow-hidden');
            e.searchRequest = (e.searchRequest || 0) + 1;
          });
          document
            .querySelector('#mysearch-retry')
            .addEventListener('click', () => e.doSearch(e.input.value, false));
          const t = document.querySelector(e.trigger);
          t.addEventListener('click', () => {
            e.openModal(!0);
          }),
            document.body.addEventListener('click', (n) => {
              e.isOpened() && (e.box.contains(n.target) || t.contains(n.target) || e.closeModal());
            }),
            this.input.addEventListener('input', (event) => {
              if (event.isComposing) return;
              const t = e.input.value;
              t !== e.lastSearch.query && e.doSearch(t, !0).then();
            }),
            this.input.addEventListener('compositionend', () => e.doSearch(e.input.value, true)),
            document.body.addEventListener('keydown', (t) => {
              if (t.isComposing) return;
              if (!t.target.closest('dialog[open]:not(#mysearch)'))
                if ('ArrowDown' === t.key)
                  e.isOpened() && (e.moveItem(!1), t.preventDefault(), t.stopPropagation());
                else if ('ArrowUp' === t.key)
                  e.isOpened() && (e.moveItem(!0), t.preventDefault(), t.stopPropagation());
                else if ('Enter' === t.key && e.isOpened() && t.target === e.input) {
                  if (e.isOpened()) {
                    const t = e.result.querySelector('li.active > a');
                    null !== t && (window.location.href = t.getAttribute('href'));
                  }
                  t.preventDefault(), t.stopPropagation();
                } else
                  'Escape' === t.key && e.isOpened()
                    ? (e.closeModal(), t.preventDefault(), t.stopPropagation())
                    : (!t.ctrlKey && !t.metaKey) ||
                      'k' !== t.key.toLowerCase() ||
                      t.shiftKey ||
                      (e.toggleModal(), t.preventDefault(), t.stopPropagation());
            });
        },
        moveItem(e) {
          const t = this.result.querySelector('li.active');
          if (!t) return;
          const n = e ? t.previousElementSibling : t.nextElementSibling;
          null !== n &&
            (t.classList.remove('active'),
            t.classList.add('inactive'),
            n.classList.remove('inactive'),
            n.classList.add('active'),
            this.renderPreview(),
            n.scrollIntoView({ block: 'nearest' }));
        },
        detectModal() {
          const e = window.location.href,
            t = new URL(e).searchParams.get('q');
          null !== t && ((this.input.value = t), this.openModal(!1));
        },
        isOpened() {
          return this.search.open;
        },
        toggleModal() {
          this.isOpened() ? this.closeModal() : this.openModal();
        },
        openModal(clear) {
          if (!this.search.open) this.search.showModal();
          if (clear) this.input.value = '';
          document.body.classList.add('overflow-hidden');
          this.doSearch(this.input.value, false);
          this.input.focus();
        },
        closeModal(clear) {
          if (clear) this.input.value = '';
          if (this.search.open) this.search.close();
          document.body.classList.remove('overflow-hidden');
        },
        changeUrl(query) {
          const url = new URL(window.location.href);
          if (query) url.searchParams.set('q', query);
          else url.searchParams.delete('q');
          history.replaceState(history.state, '', url);
        },
        async fetchData() {
          if (this.index) return;
          if (this.fetchPromise) return this.fetchPromise;
          this.fetchPromise = (async () => {
            const response = await fetch(this.dbPath);
            if (!response.ok) throw new Error('Search unavailable');
            this.db = await response.json();
            this.index = new Fuse(this.db, {
              includeMatches: true,
              threshold: 0.25,
              ignoreDiacritics: true,
              keys: [
                { name: 'title', weight: 12 },
                { name: 'tags', weight: 6 },
                { name: 'categories', weight: 6 },
                { name: 'sections.h3.title', weight: 5 },
                { name: 'sections.h2.title', weight: 3 },
                { name: 'intro', weight: 1 }
              ]
            });
            this.lastSearch.whole = this.db.map((item, refIndex) => ({ item, refIndex }));
          })().finally(() => {
            this.fetchPromise = null;
          });
          return this.fetchPromise;
        },
        async doSearch(query, updateUrl) {
          const request = (this.searchRequest = (this.searchRequest || 0) + 1);
          const clear = document.querySelector('#mysearch-clear');
          clear.hidden = query.length === 0;
          document.querySelector('#mysearch-retry').hidden = true;
          if (updateUrl) this.changeUrl(query);
          if (!this.index) this.status.textContent = 'Cargando apuntes…';
          try {
            await this.fetchData();
            if (request !== this.searchRequest) return;
            const results = query.trim() ? this.index.search(query.trim()) : this.lastSearch.whole;
            this.lastSearch.query = query;
            this.lastSearch.resp = results;
            this.renderResult(results);
            document.querySelector('.preview-panel').replaceChildren();
            this.renderPreview();
            this.status.textContent = results.length
              ? `${results.length} ${results.length === 1 ? 'guía encontrada' : 'guías encontradas'}`
              : 'No hay resultados. Prueba otro término o borra la búsqueda.';
          } catch {
            if (request !== this.searchRequest) return;
            this.result.replaceChildren();
            document.querySelector('.preview-panel').replaceChildren();
            this.status.textContent =
              'No se pudieron cargar los apuntes. Comprueba la conexión y vuelve a intentarlo.';
            document.querySelector('#mysearch-retry').hidden = false;
          }
        },
        addEventToResult() {
          const e = this;
          this.result.querySelectorAll('li').forEach((t) => {
            t.addEventListener('mouseover', function () {
              e.isOpened() &&
                (e.result.querySelectorAll('li').forEach((e) => {
                  e.classList.remove('active'), e.classList.add('inactive');
                }),
                this.classList.remove('inactive'),
                this.classList.add('active'),
                e.renderPreview());
            });
          });
        },
        mark(e, t) {
          const n = [];
          t = t.map((range) => [...range]);
          let i = t.shift();
          for (let o = 0; o < e.length; o++) {
            const s = e.charAt(o);
            i && o === i[0] && n.push('<mark>'),
              n.push(s),
              i && o === i[1] && (n.push('</mark>'), (i = t.shift()));
          }
          return n.join('');
        },
        highlightMatches(e) {
          if (void 0 === e.matches || 0 === e.item.length) return;
          const t = this;
          (e.item = JSON.parse(JSON.stringify(t.db[e.refIndex]))),
            e.matches.forEach((n) => {
              switch (n.key) {
                case 'tags':
                case 'categories':
                  e.item[n.key][n.refIndex] = t.mark(n.value, n.indices);
                  break;
                case 'sections.h2.title':
                  e.item.sections[n.refIndex].h2.title = t.mark(n.value, n.indices);
                  break;
                case 'sections.h3.title': {
                  let i = 0,
                    o = 0;
                  for (let s = 0; s < e.item.sections.length; s++) {
                    const a = e.item.sections[s].h3;
                    if (((i += a.length), n.refIndex >= o && n.refIndex < i)) {
                      e.item.sections[s].h3[n.refIndex - o].title = t.mark(n.value, n.indices);
                      break;
                    }
                    o += a.length;
                  }
                  break;
                }
                default:
                  e.item[n.key] = t.mark(n.value, n.indices);
              }
            });
        },
        renderResult(results) {
          this.result.innerHTML = results
            .map((entry, index) => {
              this.highlightMatches(entry);
              const item = entry.item;
              const keywords = [...item.categories, ...item.tags].join(' · ');
              return `<li class="${index === 0 ? 'active' : 'inactive'}" data-index="${index}">
              <a href="${item.path}"><span class="study-result-icon" aria-hidden="true">${item.icon}</span>
              <span class="study-result-copy"><strong>${item.title}</strong><small>${keywords}</small></span></a>
            </li>`;
            })
            .join('');
          this.addEventToResult();
        },
        renderPreview() {
          const active = this.result.querySelector('li.active');
          const panel = document.querySelector('.preview-panel');
          if (!active) {
            panel.replaceChildren();
            return;
          }
          const item = this.lastSearch.resp[Number(active.dataset.index)].item;
          const sections = item.sections
            .map((section) => {
              const children = section.h3.length
                ? `<ul>${section.h3
                    .map(
                      (child) => `<li><a href="${item.path}${child.anchor}">${child.title}</a></li>`
                    )
                    .join('')}</ul>`
                : '';
              return `<li><a href="${item.path}${section.h2.anchor}">${section.h2.title}</a>${children}</li>`;
            })
            .join('');
          panel.innerHTML = `<div class="study-search-preview"><p class="study-preview-title">${item.title}</p><ol>${sections}</ol></div>`;
        }
      }),
      Utils.externalLibrary(Utils.LIBRARY.fuse)
        .then((e) => {
          void 0 !== e ? new t().start() : console.error('Fuse.js library failed to load');
        })
        .catch((e) => {
          console.error('Failed to load search library:', e);
        });
  });
