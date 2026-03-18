const state = {
  allResults: [],
  filteredResults: [],
  page: 1,
  pageSize: 50,
};

function isValidClub(value) {
  if (!value) return false;

  const v = String(value).trim();

  if (!v) return false;

  // reject obvious junk starters
  if (/^[-+]/.test(v)) return false;

  // reject pure times or time-like strings
  if (/\d+:\d+\.\d+/.test(v)) return false;
  if (/^\d+\.\d+$/.test(v)) return false;

  // reject reaction-time / split-looking values
  if (/^\+?\s*\d+(\.\d+)?$/.test(v)) return false;

  // reject age/group-like values
  if (/^\d{1,3}\/\d{1,3}/.test(v)) return false;
  if (/^\d{1,3}\+$/.test(v)) return false;

  // reject anything containing digits at all
  // real club names here should basically be text only
  if (/\d/.test(v)) return false;

  // reject tiny junk
  if (v.length < 3) return false;

  return true;
}

function cleanAgeGroup(value) {
  if (!value) return null;

  let v = String(value).trim();

  // normalize spacing
  v = v.replace(/\s+/g, " ");

  // common replacements
  v = v.replace(/Yrs\/Over/gi, "+");
  v = v.replace(/Yrs\/Ov/gi, "+");
  v = v.replace(/Yrs/gi, "");
  v = v.replace(/Age Group/gi, "");
  v = v.replace(/Years\/Over/gi, "+");
  v = v.replace(/Years/gi, "");

  // remove spaces
  v = v.replace(/\s+/g, "");

  // Convert things like 15/Over → 15+
  v = v.replace(/\/Over/gi, "+");
  v = v.replace(/\/Ov/gi, "+");

  // convert leading zero versions like 015+ -> 15+, 019+ -> 19+
  if (/^0\d{2}\+$/.test(v)) {
    v = String(parseInt(v, 10)) + "+";
  }

  // convert things like 012+ -> 12+
  if (/^0\d{1,2}\+$/.test(v)) {
    v = String(parseInt(v, 10)) + "+";
  }

  // valid formats only
  if (/^\d{1,2}\/\d{1,2}$/.test(v)) return v;
  if (/^\d{1,3}\+$/.test(v)) return v;

  return null;
}

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
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
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

function getRowClub(row) {
  const candidates = [
    row.club_normalized,
    row.club_raw
  ];

  for (const candidate of candidates) {
    if (isValidClub(candidate)) {
      return String(candidate).trim();
    }
  }

  return '';
}

function getRowAgeGroup(row) {
  const cleaned = cleanAgeGroup(row.age_group || row.event_group_raw || '');
  return cleaned || '';
}

function matchesFilters(row) {
  const nameQuery = normaliseText(els.nameSearch.value);
  const club = els.clubFilter.value;
  const year = els.yearFilter.value;
  const eventName = els.eventFilter.value;
  const ageGroup = els.ageFilter.value;
  const status = els.statusFilter.value;

  const rowClub = getRowClub(row);
  const rowAgeGroup = getRowAgeGroup(row);

  const nameMatch =
    !nameQuery ||
    normaliseText(row.name_raw).includes(nameQuery) ||
    normaliseText(row.name_normalized).includes(nameQuery);

  const clubMatch = !club || rowClub === club;
  const yearMatch = !year || String(row.year) === String(year);
  const eventMatch = !eventName || row.event_name === eventName;
  const ageMatch = !ageGroup || rowAgeGroup === ageGroup;
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
      fragment.querySelector('[data-key="age_group"]').textContent = getRowAgeGroup(row) ?? '';
      fragment.querySelector('[data-key="place_raw"]').textContent = row.place_raw ?? '';
      fragment.querySelector('[data-key="name_raw"]').textContent = String(row.name_raw || '').trim();
      fragment.querySelector('[data-key="club_raw"]').textContent = getRowClub(row) ?? '';
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

  const clubs = uniqSorted(
    state.allResults
      .map(getRowClub)
      .filter(Boolean)
  );

  const years = uniqSorted(
    state.allResults
      .map(r => r.year)
      .filter(Boolean)
  );

  const events = uniqSorted(
    state.allResults
      .map(r => r.event_name)
      .filter(Boolean)
  );

  const ageGroups = uniqSorted(
    state.allResults
      .map(getRowAgeGroup)
      .filter(Boolean)
  );

  const statuses = uniqSorted(
    state.allResults
      .map(r => r.status)
      .filter(Boolean)
  );

  fillSelect(els.clubFilter, clubs, 'All clubs');
  fillSelect(els.yearFilter, years, 'All years');
  fillSelect(els.eventFilter, events, 'All events');
  fillSelect(els.ageFilter, ageGroups, 'All age groups');
  fillSelect(els.statusFilter, statuses, 'All statuses');

  state.filteredResults = [...state.allResults];
  wireUpEvents();
  renderTable();
}

init().catch(err => {
  console.error(err);
  els.resultsBody.innerHTML = `<tr><td colspan="8">Failed to load results.json. Check the file is in the repo root and GitHub Pages is serving it properly.</td></tr>`;
});
