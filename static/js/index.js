$(document).ready(function() {
  const options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  }
  // Initialize all div with carousel class
  const carousels = bulmaCarousel.attach('.carousel', options);
})

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
  setupEventListeners();
  window.addEventListener('resize', adjustNameColumnWidth);
});

function loadTableData() {
  console.log('Starting to load table data...');
  fetch('./leaderboard_data.json')
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.leaderboardData) {
        throw new Error('Invalid data format');
      }
      console.log('Data loaded successfully:', data);
      const tbody = document.querySelector('#mmmu-table tbody');
      
      // Prepare data for styling
      const humanScores = prepareScoresForStyling(data.leaderboardData, 'Human Evaluation');
      const gptScores = prepareScoresForStyling(data.leaderboardData, 'GPT Evaluation');
      const intJudgeScores = prepareScoresForStyling(data.leaderboardData, 'IntJudge Evaluation');

      data.leaderboardData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add(row.info.type);
        
        const nameCell = row.info.link && row.info.link.trim() !== '' ?
          `<a href="${row.info.link}" target="_blank"><b>${row.info.name}</b></a>` :
          `<b>${row.info.name}</b>`;

        const safeGet = (obj, path, defaultValue = '-') => {
          try {
            const value = path.split('.').reduce((acc, part) => {
              if (acc === null || acc === undefined) return defaultValue;
              return acc[part];
            }, obj);
            return value !== null && value !== undefined ? value : defaultValue;
          } catch (e) {
            return defaultValue;
          }
        };

        tr.innerHTML = `
          <td>${nameCell}</td>
          <td data-value="${safeGet(row, 'validation.Human Evaluation.FDT').replace('%', '')}">${applyStyle(safeGet(row, 'validation.Human Evaluation.FDT'), humanScores['FDT'][index])}</td>
          <td data-value="${safeGet(row, 'validation.Human Evaluation.w/o Tie').replace('%', '')}">${applyStyle(safeGet(row, 'validation.Human Evaluation.w/o Tie'), humanScores['w/o Tie'][index])}</td>
          <td data-value="${safeGet(row, 'validation.Human Evaluation.w/ Tie (0)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.Human Evaluation.w/ Tie (0)'), humanScores['w/ Tie (0)'][index])}</td>
          <td data-value="${safeGet(row, 'validation.Human Evaluation.w/ Tie (5)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.Human Evaluation.w/ Tie (5)'), humanScores['w/ Tie (5)'][index])}</td>
          <td data-value="${safeGet(row, 'validation.GPT Evaluation.FDT').replace('%', '')}">${applyStyle(safeGet(row, 'validation.GPT Evaluation.FDT'), gptScores['FDT'][index])}</td>
          <td data-value="${safeGet(row, 'validation.GPT Evaluation.w/o Tie').replace('%', '')}">${applyStyle(safeGet(row, 'validation.GPT Evaluation.w/o Tie'), gptScores['w/o Tie'][index])}</td>
          <td data-value="${safeGet(row, 'validation.GPT Evaluation.w/ Tie (0)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.GPT Evaluation.w/ Tie (0)'), gptScores['w/ Tie (0)'][index])}</td>
          <td data-value="${safeGet(row, 'validation.GPT Evaluation.w/ Tie (5)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.GPT Evaluation.w/ Tie (5)'), gptScores['w/ Tie (5)'][index])}</td>
          <td data-value="${safeGet(row, 'validation.IntJudge Evaluation.FDT').replace('%', '')}">${applyStyle(safeGet(row, 'validation.IntJudge Evaluation.FDT'), intJudgeScores['FDT'][index])}</td>
          <td data-value="${safeGet(row, 'validation.IntJudge Evaluation.w/o Tie').replace('%', '')}">${applyStyle(safeGet(row, 'validation.IntJudge Evaluation.w/o Tie'), intJudgeScores['w/o Tie'][index])}</td>
          <td data-value="${safeGet(row, 'validation.IntJudge Evaluation.w/ Tie (0)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.IntJudge Evaluation.w/ Tie (0)'), intJudgeScores['w/ Tie (0)'][index])}</td>
          <td data-value="${safeGet(row, 'validation.IntJudge Evaluation.w/ Tie (5)').replace('%', '')}">${applyStyle(safeGet(row, 'validation.IntJudge Evaluation.w/ Tie (5)'), intJudgeScores['w/ Tie (5)'][index])}</td>
        `;

        tbody.appendChild(tr);
      });
      
      setTimeout(adjustNameColumnWidth, 0);
      initializeSorting();
    })
    .catch(error => {
      console.error('Error loading table data:', error);
      const tbody = document.querySelector('#mmmu-table tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="13">
              Error loading data: ${error.message}<br>
              Please ensure you're accessing this page through a web server (http://localhost:8000) and not directly from the file system.
            </td>
          </tr>
        `;
      }
    });
}

function setupEventListeners() {
  document.querySelector('.reset-cell').addEventListener('click', function() {
    resetTable();
  });

  var headers = document.querySelectorAll('#mmmu-table thead tr:last-child th.sortable');
  headers.forEach(function(header) {
    header.addEventListener('click', function() {
      sortTable(this);
    });
  });
}

function resetTable() {
  var valOverallHeader = document.querySelector('#mmmu-table thead tr:last-child th.sortable');
  sortTable(valOverallHeader, true);
  setTimeout(adjustNameColumnWidth, 0);
}

function sortTable(header, forceDescending = false, maintainOrder = false) {
  if (!header) {
    console.error('No header element provided to sortTable');
    return;
  }

  var table = document.getElementById('mmmu-table');
  if (!table) {
    console.error('Table not found');
    return;
  }

  var tbody = table.querySelector('tbody');
  if (!tbody) {
    console.error('Table body not found');
    return;
  }

  var headerParent = header.parentNode;
  if (!headerParent) {
    console.error('Header parent node not found');
    return;
  }

  var headers = Array.from(headerParent.children);
  var columnIndex = headers.indexOf(header);
  var sortType = header.dataset.sort;

  var rows = Array.from(tbody.querySelectorAll('tr'));
  var isDescending = forceDescending || (!header.classList.contains('asc') && !header.classList.contains('desc')) || header.classList.contains('asc');

  if (!maintainOrder) {
    rows.sort(function(a, b) {
      var aCell = a.children[columnIndex];
      var bCell = b.children[columnIndex];
      var aValue = aCell.dataset.value || aCell.textContent.trim();
      var bValue = bCell.dataset.value || bCell.textContent.trim();

      if (aValue === '-' && bValue !== '-') return isDescending ? 1 : -1;
      if (bValue === '-' && aValue !== '-') return isDescending ? -1 : 1;

      if (sortType === 'number') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
        if (isNaN(aValue)) aValue = 0;
        if (isNaN(bValue)) bValue = 0;
        return isDescending ? bValue - aValue : aValue - bValue;
      } else {
        return isDescending ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }
    });
  }

  headers.forEach(function(th) {
    th.classList.remove('asc', 'desc');
  });

  header.classList.add(isDescending ? 'desc' : 'asc');

  rows.forEach(function(row) {
    tbody.appendChild(row);
  });

  setTimeout(adjustNameColumnWidth, 0);
}

function getCellValue(row, index) {
  var cell = row.children[index];
  return cell ? cell.dataset.value || cell.textContent.trim() : '';
}

function initializeSorting() {
  var firstHeader = document.querySelector('#mmmu-table thead tr:last-child th.sortable');
  sortTable(firstHeader, true);
}

function adjustNameColumnWidth() {
  const nameColumn = document.querySelectorAll('#mmmu-table td:first-child, #mmmu-table th:first-child');
  let maxWidth = 0;

  const span = document.createElement('span');
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'nowrap';
  document.body.appendChild(span);

  nameColumn.forEach(cell => {
    span.textContent = cell.textContent;
    const width = span.offsetWidth;
    if (width > maxWidth) {
      maxWidth = width;
    }
  });

  document.body.removeChild(span);

  maxWidth += 20;

  nameColumn.forEach(cell => {
    cell.style.width = `${maxWidth}px`;
    cell.style.minWidth = `${maxWidth}px`;
    cell.style.maxWidth = `${maxWidth}px`;
  });
}

function prepareScoresForStyling(data, section) {
  const scores = {};
  const metrics = ['FDT', 'w/o Tie', 'w/ Tie (0)', 'w/ Tie (5)'];

  metrics.forEach(metric => {
    const values = data.map(row => {
      const value = row.validation && 
                   row.validation[section] && 
                   row.validation[section][metric];
      return value ? parseFloat(value.replace('%', '')) : null;
    }).filter(value => value !== null);

    if (values.length > 0) {
      const sortedValues = [...new Set(values)].sort((a, b) => b - a);
      scores[metric] = data.map(row => {
        const value = row.validation && 
                     row.validation[section] && 
                     row.validation[section][metric];
        if (!value) return -1;
        return sortedValues.indexOf(parseFloat(value.replace('%', '')));
      });
    } else {
      scores[metric] = data.map(() => -1);
    }
  });

  return scores;
}

function applyStyle(value, rank) {
  if (!value || value === '-') return '-';
  if (rank === 0) return `<b>${value}</b>`;
  if (rank === 1) return `<span style="text-decoration: underline;">${value}</span>`;
  return value;
}
