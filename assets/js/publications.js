(function () {
  var container = document.getElementById('pub-container');
  var authorId = container ? container.dataset.authorId : null;
  if (!authorId) return;

  var searchInput = document.getElementById('pub-search');
  var yearFilter = document.getElementById('pub-year-filter');
  var countEl = document.getElementById('pub-count');

  var allPapers = [];

  function render(papers) {
    if (!papers.length) {
      container.innerHTML = '<p class="pub-loading">No results found.</p>';
      countEl.textContent = '';
      return;
    }
    countEl.textContent = papers.length + ' paper' + (papers.length === 1 ? '' : 's');
    container.innerHTML = papers.map(function (p) {
      var title = p.title || 'Untitled';
      var authors = (p.authors || []).map(function (a) { return a.name; }).join(', ');
      var year = p.year ? String(p.year) : '';
      var venue = p.venue || p.journal || '';
      var extIds = p.externalIds || {};
      var links = [];
      if (p.openAccessPdf && p.openAccessPdf.url) {
        links.push('<a class="pub-link" href="' + p.openAccessPdf.url + '" target="_blank">PDF</a>');
      }
      if (extIds.ArXiv) {
        links.push('<a class="pub-link" href="https://arxiv.org/abs/' + extIds.ArXiv + '" target="_blank">arXiv</a>');
      }
      if (extIds.DOI) {
        links.push('<a class="pub-link" href="https://doi.org/' + extIds.DOI + '" target="_blank">DOI</a>');
      }
      if (p.url) {
        links.push('<a class="pub-link" href="' + p.url + '" target="_blank">Semantic Scholar</a>');
      }

      return '<div class="pub-item">' +
        '<div class="pub-title">' + title + '</div>' +
        (authors ? '<div class="pub-authors">' + authors + '</div>' : '') +
        ((venue || year) ? '<div class="pub-venue">' + [venue, year].filter(Boolean).join(', ') + '</div>' : '') +
        (links.length ? '<div class="pub-links">' + links.join('') + '</div>' : '') +
        '</div>';
    }).join('');
  }

  function applyFilters() {
    var query = searchInput ? searchInput.value.toLowerCase() : '';
    var year = yearFilter ? yearFilter.value : '';
    var filtered = allPapers.filter(function (p) {
      var text = ((p.title || '') + ' ' + (p.authors || []).map(function (a) { return a.name; }).join(' ') + ' ' + (p.venue || '')).toLowerCase();
      var yearMatch = !year || String(p.year) === year;
      return text.includes(query) && yearMatch;
    });
    render(filtered);
  }

  container.innerHTML = '<p class="pub-loading">Loading publications…</p>';

  var fields = 'title,authors,year,venue,externalIds,openAccessPdf,url';
  var apiUrl = 'https://api.semanticscholar.org/graph/v1/author/' + authorId + '/papers?fields=' + fields + '&limit=50';

  fetch(apiUrl)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      allPapers = (data.data || []).sort(function (a, b) { return (b.year || 0) - (a.year || 0); });

      // populate year filter
      if (yearFilter) {
        var years = [...new Set(allPapers.map(function (p) { return p.year; }).filter(Boolean))].sort(function (a, b) { return b - a; });
        years.forEach(function (y) {
          var opt = document.createElement('option');
          opt.value = y;
          opt.textContent = y;
          yearFilter.appendChild(opt);
        });
      }

      render(allPapers);
      if (searchInput) searchInput.addEventListener('input', applyFilters);
      if (yearFilter) yearFilter.addEventListener('change', applyFilters);
    })
    .catch(function () {
      container.innerHTML = '<p class="pub-error">Could not load publications. Please visit my <a href="https://scholar.google.com/citations?user={{ site.author.google_scholar }}" target="_blank">Google Scholar profile</a>.</p>';
    });
})();
