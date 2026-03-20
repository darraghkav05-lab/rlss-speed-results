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
  profileHint: document.getElementById('profileHint'),
  resultsBody: document.getElementById('resultsBody'),
  rowTemplate: document.getElementById('rowTemplate'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  pageInfo: document.getElementById('pageInfo'),
};

function uniqSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => Number(a) - Number(b));
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
  const yearQuery = els.yearFilter.value;

  const rowName = normaliseText(row.search_name || row.name);
  const yearMatch = !yearQuery || String(row.year) === String(yearQuery);
  const nameMatch = !nameQuery || rowName.includes(nameQuery);

  return yearMatch && nameMatch;
}

function sortResults(a, b) {
  if (Number(a.year) !== Number(b.year)) {
    return Number(b.year) - Number(a.year);
  }

  const nameCompare = String(a.name || '').localeCompare(String(b.name || ''));
  if (nameCompare !== 0) {
    return nameCompare;
  }

  const eventCompare = String(a.event || '').localeCompare(String(b.event || ''));
  if (eventCompare !== 0) {
    return eventCompare;
  }

  return String(a.final_time || '').localeCompare(String(b.final_time || ''), undefined, { numeric: true });
}

function applyFilters() {
  state.page = 1;
  state.filteredResults = state.allResults.filter(matchesFilters).sort(sortResults);
  renderTable();
}

function renderEmptyState() {
  const tr = document.createElement('tr');
  tr.innerHTML = '<td colspan="6">No swimmer results found. Try a different spelling or clear the year filter.</td>';
  els.resultsBody.appendChild(tr);
}

function renderRows(rows) {
  rows.forEach(row => {
    const fragment = els.rowTemplate.content.cloneNode(true);
    fragment.querySelector('[data-key="year"]').textContent = row.year ?? '';
    fragment.querySelector('[data-key="event"]').textContent = row.event ?? '';
    fragment.querySelector('[data-key="age_group"]').textContent = row.age_group ?? '';
    fragment.querySelector('[data-key="name"]').textContent = row.name ?? '';
    fragment.querySelector('[data-key="club"]').textContent = row.club ?? '';
    fragment.querySelector('[data-key="final_time"]').textContent = row.final_time ?? '';
    els.resultsBody.appendChild(fragment);
  });
}

function updateSummary(total) {
  const query = els.nameSearch.value.trim();
  const year = els.yearFilter.value;

  if (query && year) {
    els.profileTitle.textContent = `Results for ${query} in ${year}`;
    els.profileHint.textContent = 'Showing matches for the selected swimmer and year.';
  } else if (query) {
    els.profileTitle.textContent = `Results for ${query}`;
    els.profileHint.textContent = 'Showing matching results across all available years.';
  } else if (year) {
    els.profileTitle.textContent = `Showing all swimmers in ${year}`;
    els.profileHint.textContent = 'Filter by name to narrow this year further.';
  } else {
    els.profileTitle.textContent = 'Showing all swimmers';
    els.profileHint.textContent = 'Type a swimmer name to narrow the archive.';
  }

  els.resultCount.textContent = total.toLocaleString();
}

function renderTable() {
  const total = state.filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

  if (state.page > totalPages) {
    state.page = totalPages;
  }

  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  const rows = state.filteredResults.slice(start, end);

  els.resultsBody.innerHTML = '';

  if (!rows.length) {
    renderEmptyState();
  } else {
    renderRows(rows);
  }

  updateSummary(total);
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
  const response = await fetch('results.json');
  if (!response.ok) {
    throw new Error(`Failed to load results.json (${response.status})`);
  }

  state.allResults = await response.json();

  const years = uniqSorted(state.allResults.map(result => result.year));
  fillSelect(els.yearFilter, years, 'All years');

  state.filteredResults = [...state.allResults];
  wireUpEvents();
  applyFilters();
}

init().catch(err => {
  console.error(err);
  els.resultsBody.innerHTML = '<tr><td colspan="6">Failed to load results.json. Make sure all files are in the same folder before uploading to GitHub Pages.</td></tr>';
});
