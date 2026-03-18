const state = {
  allResults: [],
  filteredResults: [],
  page: 1,
  pageSize: 50,
};

const els = {
  nameSearch: document.getElementById('nameSearch'),
  clubFilter: document.getElementById('clubFilter'),
  yearFilter: document.getElementById('yearFilter'),
  eventFilter: document.getElementById('eventFilter'),
  ageFilter: document.getElementById('ageFilter'),
  statusFilter: document.getElementById('statusFilter'),
  resetBtn: document.getElementById('resetBtn'),
  resultCount: document.getElementById('resultCount'),
  resultsBody: document.getElementById('resultsBody'),
  rowTemplate: document.getElementById('rowTemplate'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  pageInfo: document.getElementById('pageInfo'),
};

function uniqSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
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

function matchesFilters(row) {
  const nameQuery = normaliseText(els.nameSearch.value);
  const club = els.clubFilter.value;
  const year = els.yearFilter.value;
  const eventName = els.eventFilter.value;
  const ageGroup = els.ageFilter.value;
  const status = els.statusFilter.value;

  const nameMatch = !nameQuery || normaliseText(row.name_raw).includes(nameQuery) || normaliseText(row.name_normalized).includes(nameQuery);
  const clubMatch = !club || row.club_normalized === club || row.club_raw === club;
  const yearMatch = !year || String(row.year) === String(year);
  const eventMatch = !eventName || row.event_name === eventName;
  const ageMatch = !ageGroup || row.age_group === ageGroup;
  const statusMatch = !status || row.status === status;

  return nameMatch && clubMatch && yearMatch && eventMatch && ageMatch && statusMatch;
}

function applyFilters() {
  state.page = 1;
  state.filteredResults = state.allResults.filter(matchesFilters);
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
    tr.innerHTML = `<td colspan="8">No results found. Humanity remains difficult, but the filters work.</td>`;
    els.resultsBody.appendChild(tr);
  } else {
    for (const row of rows) {
      const fragment = els.rowTemplate.content.cloneNode(true);
      fragment.querySelector('[data-key="year"]').textContent = row.year ?? '';
      fragment.querySelector('[data-key="event_name"]').textContent = row.event_name ?? '';
      fragment.querySelector('[data-key="age_group"]').textContent = row.age_group ?? row.event_group_raw ?? '';
      fragment.querySelector('[data-key="place_raw"]').textContent = row.place_raw ?? '';
      fragment.querySelector('[data-key="name_raw"]').textContent = row.name_raw ?? '';
      fragment.querySelector('[data-key="club_raw"]').textContent = row.club_raw ?? '';
      fragment.querySelector('[data-key="time_raw"]').textContent = row.time_raw ?? '';
      fragment.querySelector('[data-key="status"]').textContent = row.status ?? '';
      els.resultsBody.appendChild(fragment);
    }
  }

  els.resultCount.textContent = total.toLocaleString();
  els.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  els.prevBtn.disabled = state.page <= 1;
  els.nextBtn.disabled = state.page >= totalPages;
}

function wireUpEvents() {
  [els.nameSearch, els.clubFilter, els.yearFilter, els.eventFilter, els.ageFilter, els.statusFilter]
    .forEach(el => el.addEventListener('input', applyFilters));

  els.resetBtn.addEventListener('click', () => {
    els.nameSearch.value = '';
    els.clubFilter.value = '';
    els.yearFilter.value = '';
    els.eventFilter.value = '';
    els.ageFilter.value = '';
    els.statusFilter.value = '';
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
  const response = await fetch('results.json');
  state.allResults = await response.json();

  fillSelect(els.clubFilter, uniqSorted(state.allResults.map(r => r.club_normalized || r.club_raw)), 'All clubs');
  fillSelect(els.yearFilter, uniqSorted(state.allResults.map(r => r.year)), 'All years');
  fillSelect(els.eventFilter, uniqSorted(state.allResults.map(r => r.event_name)), 'All events');
  fillSelect(els.ageFilter, uniqSorted(state.allResults.map(r => r.age_group || r.event_group_raw)), 'All age groups');

  state.filteredResults = [...state.allResults];
  wireUpEvents();
  renderTable();
}

init().catch(err => {
  console.error(err);
  els.resultsBody.innerHTML = `<tr><td colspan="8">Failed to load results.json. Check the file is in the repo root and GitHub Pages is serving it properly.</td></tr>`;
});
