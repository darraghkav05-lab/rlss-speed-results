const state = {
  allResults: [],
  filteredResults: [],
  page: 1,
  pageSize: 50,
};

const els = {
  nameSearch: document.getElementById('nameSearch'),
  yearFilter: document.getElementById('yearFilter'),
  resetBtn: document.getElementById('resetBtn'),
  resultCount: document.getElementById('resultCount'),
  profileTitle: document.getElementById('profileTitle'),
  resultsBody: document.getElementById('resultsBody'),
  rowTemplate: document.getElementById('rowTemplate'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  pageInfo: document.getElementById('pageInfo'),
};

function uniqSorted(values) {
  return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ''))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function fillSelect(select, values, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function normaliseText(value) {
  return String(value || '').toLowerCase().trim();
}

function cleanAgeGroup(value) {
  if (!value) return '';

  let v = String(value).trim();
  v = v.replace(/\s+/g, ' ');
  v = v.replace(/Yrs\/Over/gi, '+');
  v = v.replace(/Yrs\/Ov/gi, '+');
  v = v.replace(/Years\/Over/gi, '+');
  v = v.replace(/Years/gi, '');
  v = v.replace(/Yrs/gi, '');
  v = v.replace(/Age Group/gi, '');
  v = v.replace(/\/Over/gi, '+');
  v = v.replace(/\/Ov/gi, '+');
  v = v.replace(/\s+/g, '');

  if (/^0\d{1,2}\+$/.test(v)) {
    v = String(parseInt(v, 10)) + '+';
  }

  if (/^\d{1,2}\/\d{1,2}$/.test(v)) return v;
  if (/^\d{1,3}\+$/.test(v)) return v;

  return String(value).trim();
}

function getRowName(row) {
  return String(row.name || '').trim();
}

function getRowClub(row) {
  return String(row.club || '').trim();
}

function matchesFilters(row) {
  const nameQuery = normaliseText(els.nameSearch.value);
  const year = els.yearFilter.value;

  const rowName = normaliseText(getRowName(row));
  const nameMatch = !nameQuery || rowName.includes(nameQuery);
  const yearMatch = !year || String(row.year) === String(year);

  return nameMatch && yearMatch;
}

function applyFilters() {
  state.page = 1;
  state.filteredResults = state.allResults
    .filter(matchesFilters)
    .sort((a, b) => {
      if (String(a.year) !== String(b.year)) return Number(b.year) - Number(a.year);

      const eventCompare = String(a.event || '').localeCompare(String(b.event || ''));
      if (eventCompare !== 0) return eventCompare;

      const placeA = Number(a.place ?? 9999);
      const placeB = Number(b.place ?? 9999);
      return placeA - placeB;
    });

  renderTable();
}

function renderTable() {
  const total = state.filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  const rows = state.filteredResults.slice(start, end);

  els.resultsBody.innerHTML = '';

  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8">No results found. Try a different spelling.</td>';
    els.resultsBody.appendChild(tr);
  } else {
    for (const row of rows) {
      const fragment = els.rowTemplate.content.cloneNode(true);
      fragment.querySelector('[data-key="year"]').textContent = row.year ?? '';
      fragment.querySelector('[data-key="event"]').textContent = row.event ?? '';
      fragment.querySelector('[data-key="age_group"]').textContent = cleanAgeGroup(row.age_group ?? '');
      fragment.querySelector('[data-key="place"]').textContent = row.place ?? '';
      fragment.querySelector('[data-key="name"]').textContent = getRowName(row);
      fragment.querySelector('[data-key="club"]').textContent = getRowClub(row);
      fragment.querySelector('[data-key="time"]').textContent = row.time ?? '';
      fragment.querySelector('[data-key="status"]').textContent = row.status ?? '';
      els.resultsBody.appendChild(fragment);
    }
  }

  const query = els.nameSearch.value.trim();
  els.profileTitle.textContent = query ? `Results for ${query}` : 'Showing all swimmers';

  els.resultCount.textContent = total.toLocaleString();
  els.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  els.prevBtn.disabled = state.page <= 1;
  els.nextBtn.disabled = state.page >= totalPages;
}

function wireUpEvents() {
  [els.nameSearch, els.yearFilter].forEach(el => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  els.resetBtn.addEventListener('click', () => {
    els.nameSearch.value = '';
    els.yearFilter.value = '';
    applyFilters();
  });

  els.prevBtn.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      renderTable();
    }
  });

  els.nextBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(state.filteredResults.length / state.pageSize));
    if (state.page < totalPages) {
      state.page += 1;
      renderTable();
    }
  });
}

async function init() {
  const response = await fetch('./results.json');

  if (!response.ok) {
    throw new Error(`Failed to load results.json: ${response.status}`);
  }

  state.allResults = await response.json();

  const years = uniqSorted(state.allResults.map(r => r.year));
  fillSelect(els.yearFilter, years, 'All years');

  state.filteredResults = [...state.allResults];
  wireUpEvents();
  applyFilters();
}

init().catch(err => {
  console.error(err);
  els.resultsBody.innerHTML = '<tr><td colspan="8">Failed to load results.json. Make sure index.html, style.css, script.js and results.json are all in the same GitHub repo folder.</td></tr>';
});
