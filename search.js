import {
  getAllEventsID,
  getAllEventsDetails,
} from "./functions/queries.js";
import {
  fillEmptyRows, 
} from "./functions/domHandler.js";
import {
  initPagination,
  getPaginationInfo,
  getCurrentPageData,
  updatePaginationInfo,
  updatePaginationControls
} from "./functions/pagination.js";
import { processTierData } from "./functions/functions.js";

let allData = [];
let originalData = []; // Store original unfiltered data

// Sorting state
let currentSortColumn = null;
let currentSortDirection = 'asc';

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SORTING FUNCTIONS
//
// --------------------------------------------------------------------------------------------------------------------------

/**
 * Initializes sort functionality for table headers
 */
function initializeTableSort() {
  const tableHeaders = document.querySelectorAll('th[data-sort]');
  
  tableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const sortKey = header.getAttribute('data-sort');
      handleSort(sortKey);
      updateSortIndicators(header);
    });
  });
}

/**
 * Handles the sorting logic
 */
function handleSort(sortKey) {
  // Toggle sort direction if clicking the same column
  if (currentSortColumn === sortKey) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = sortKey;
    currentSortDirection = 'asc';
  }
  
  // Sort the entire allData array
  allData = sortData(allData);
  
  // Re-initialize pagination with sorted data
  initPagination(allData, renderTable);
}

/**
 * Updates visual indicators on table headers
 */
function updateSortIndicators(activeHeader) {
  // Remove sort classes from all headers
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });
  
  // Add appropriate class to active header
  if (currentSortDirection === 'asc') {
    activeHeader.classList.add('sort-asc');
  } else {
    activeHeader.classList.add('sort-desc');
  }
}

/**
 * Sorts an array of events based on current sort settings
 */
function sortData(data) {
  if (!currentSortColumn || !data || data.length === 0) {
    return data;
  }
  
  return [...data].sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];
    
    // Handle special cases
    switch (currentSortColumn) {
      case 'start_date':
        // Convert to Date objects for proper date comparison
        aVal = new Date(aVal || '1900-01-01');
        bVal = new Date(bVal || '1900-01-01');
        break;
        
      case 'tier':
        // Define tier hierarchy for disc golf (highest to lowest)
        const tierOrder = {
          'Major': 1,
          'Elite': 2,
          'Tier-A': 3,
          'Tier-B': 4,
          'Tier-C': 5,
          'Tier-XA': 6,
          'Tier-XB': 7,
          'Tier-XC': 8,
          'Tier-XM': 9
        };
        
        // Get tier values, default to 999 for unknown tiers
        aVal = tierOrder[a.tier] || 999;
        bVal = tierOrder[b.tier] || 999;
        break;
        
      default:
        // Handle null/undefined values
        aVal = aVal || '';
        bVal = bVal || '';
        
        // Convert to lowercase for case-insensitive string comparison
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    }
    
    // Compare values
    let comparison = 0;
    if (aVal > bVal) {
      comparison = 1;
    } else if (aVal < bVal) {
      comparison = -1;
    }
    
    // Apply sort direction
    return currentSortDirection === 'asc' ? comparison : -comparison;
  });
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               LOAD DATA
//
// --------------------------------------------------------------------------------------------------------------------------

(async function processAllEventsData() {
    console.log('Starting to load data...');
    
    try {
        const allEventsId = await getAllEventsID();
        const allEventsDetails = await getAllEventsDetails();
        
        console.log('Events ID loaded:', allEventsId.length);
        console.log('Events Details loaded:', allEventsDetails.length);
        
        const allEventsData = [];
        
        allEventsDetails.forEach(event => {
            const newId = allEventsId.find(e => e.pdga_event_id === event.pdga_event_id)?.id || null;
            const newName = allEventsId.find(e => e.pdga_event_id === event.pdga_event_id)?.name || null;
            
            // Process tier data for all events upfront
            const { tier, tierCode } = processTierData(event);
            
            allEventsData.push({
                ...event,
                id: newId,
                name: newName,
                tier: tier,
                tierCode: tierCode
            });
        });

        // Sort all events by date (newest first)
        const sortedAllEvents = allEventsData.sort((a, b) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            return dateB - dateA;
        });

        originalData = sortedAllEvents; // Store original data
        allData = sortedAllEvents;
        
        console.log('Data loaded successfully:', allData.length, 'total events');
        
        // Get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        
        console.log('Search query from URL:', searchQuery);
        
        if (searchQuery && searchQuery.trim() !== '') {
            // Display search query in header
            const searchQueryDisplay = document.getElementById('searchQueryDisplay');
            if (searchQueryDisplay) {
                searchQueryDisplay.textContent = searchQuery;
                console.log('Updated search query display');
            } else {
                console.error('searchQueryDisplay element not found');
            }
            
            // Fill the search input with the current query
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchQuery;
                console.log('Updated search input value');
            } else {
                console.error('searchInput element not found');
            }
            
            // Perform search
            performSearch(searchQuery);
            
            // Initialize table sorting after search
            setTimeout(() => {
                initializeTableSort();
            }, 100);
        } else {
            console.log('No search query, redirecting to index.html');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
})();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SEARCH FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

// Handle search form submission
if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        console.log('Search form submitted with query:', query);
        if (query) {
            // Reload page with new search query
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });
    console.log('Search form listener attached');
} else {
    console.error('Search form or input not found');
}

function performSearch(query) {
    console.log('=== performSearch called ===');
    console.log('Query:', query);
    console.log('Original data length:', originalData.length);
    
    if (!originalData || originalData.length === 0) {
        console.error('No data available to search');
        return;
    }
    
    // Filter the data based on the query
    const filteredData = originalData.filter(event => {
        const searchQuery = query.toLowerCase();
        return (
            (event.name && event.name.toLowerCase().includes(searchQuery)) ||
            (event.event_name && event.event_name.toLowerCase().includes(searchQuery)) ||
            (event.city && event.city.toLowerCase().includes(searchQuery)) ||
            (event.state && event.state.toLowerCase().includes(searchQuery)) ||
            (event.country && event.country.toLowerCase().includes(searchQuery)) ||
            (event.tier && event.tier.toLowerCase().includes(searchQuery))
        );
    });
    
    console.log(`Search results for "${query}":`, filteredData.length, 'events');
    
    // Update total results display
    const totalResults = document.getElementById('totalResults');
    if (totalResults) {
        totalResults.textContent = filteredData.length;
        console.log('Updated total results display');
    } else {
        console.error('totalResults element not found');
    }
    
    // Update allData with filtered results
    allData = filteredData;
    console.log('Updated allData with filtered results');
    
    // Initialize pagination with filtered data (pageSize is 10 by default in pagination.js)
    console.log('Calling initPagination...');
    initPagination(allData, renderTable);
    
    // renderTable is called automatically by initPagination, no need to call it again
}

// Back to events button
const backToEvents = document.getElementById('backToEvents');
if (backToEvents) {
    backToEvents.addEventListener('click', () => {
        console.log('Back to events clicked');
        window.location.href = 'index.html';
    });
    console.log('Back to events listener attached');
} else {
    console.error('backToEvents button not found');
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               RENDER TABLE
//
// --------------------------------------------------------------------------------------------------------------------------

function renderTable() {
    console.log('=== renderTable called ===');
    
    const tableBody = document.getElementById('resultsTableBody');
    
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    console.log('Table body found');
    console.log('allData length:', allData.length);
    
    const { currentPage, pageSize, totalItems } = getPaginationInfo();
    console.log('Current page:', currentPage);
    console.log('Page size:', pageSize);
    console.log('Total items in pagination:', totalItems);
    
    // getCurrentPageData returns an object with {data, startIndex, endIndex}
    const pageDataObj = getCurrentPageData();
    const currentPageData = pageDataObj.data;
    console.log('Current page data length:', currentPageData.length);

    // Data is already sorted in allData, no need to sort again here
    console.log('Using pre-sorted data from allData');

    // Clear existing rows - make sure table is completely empty
    tableBody.innerHTML = '';
    console.log('Table cleared');

    // Check if we have data to display
    if (allData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; font-size: 16px;">
                No results found for your search. Try different keywords.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No results message added');
        return;
    }

    if (currentPageData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; font-size: 16px;">
                No data for current page.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No data for page message added');
        return;
    }

    // Add rows for current page
    currentPageData.forEach((item, index) => {
        console.log(`Processing item ${index}:`, item.name);
        
        // Tier data already processed, just use the item directly
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td>${item.name || 'N/A'}</td>
            <td>${item.start_date || 'N/A'}</td>
            <td><span class="tier-badge ${item.tierCode || ''}">${item.tier || 'N/A'}</span></td>
            <td>${item.city || 'N/A'}</td>
            <td>${item.state || 'N/A'}</td>
            <td>${item.country || 'N/A'}</td>
        `;
        
        row.addEventListener('click', async () => {
            // Store the event in sessionStorage and redirect to index.html
            sessionStorage.setItem('selectedId', item.id);
            window.location.href = 'index.html';
        });
        
        tableBody.appendChild(row);
    });

    console.log(`Added ${currentPageData.length} rows to table`);

    // Fill empty rows if needed
    fillEmptyRows(tableBody, currentPageData.length, pageSize);
    console.log('Empty rows filled');

    // Update pagination
    updatePaginationInfo();
    console.log('Pagination info updated');
    
    updatePaginationControls(allData, renderTable);
    console.log('Pagination controls updated');
    
    console.log('=== renderTable complete ===');
}