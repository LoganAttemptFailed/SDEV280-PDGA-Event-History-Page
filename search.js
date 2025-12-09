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
            
            // Initialize table sorting and suggestions after search
            setTimeout(() => {
                initializeTableSort();
                initializeSuggestions();
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
//                                               SEARCH SUGGESTIONS
//
// --------------------------------------------------------------------------------------------------------------------------

let suggestionIndex = -1;
let currentSuggestions = [];

/**
 * Calculate similarity score between query and text
 * Returns a score from 0-100
 */
function calculateSimilarity(text, query) {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    let score = 0;
    
    // Exact match
    if (textLower === queryLower) return 100;
    
    // Starts with query
    if (textLower.startsWith(queryLower)) score += 50;
    
    // Contains query
    if (textLower.includes(queryLower)) score += 30;
    
    // Word boundary match
    const words = textLower.split(/\s+/);
    if (words.some(word => word.startsWith(queryLower))) score += 20;
    
    // Acronym match
    const acronym = words.map(w => w.charAt(0)).join('');
    if (acronym.includes(queryLower.replace(/\s+/g, ''))) score += 15;
    
    // Fuzzy match (character overlap)
    let matches = 0;
    for (let char of queryLower) {
        if (textLower.includes(char)) matches++;
    }
    score += (matches / queryLower.length) * 10;
    
    return Math.min(score, 100);
}

/**
 * Generate search suggestions based on input
 */
function generateSuggestions(query, limit = 8) {
    if (!query || query.trim().length < 2) {
        return [];
    }
    
    const queryTrimmed = query.trim();
    
    // Score all events
    const scoredEvents = originalData.map(event => {
        const nameScore = calculateSimilarity(event.name, queryTrimmed);
        const eventNameScore = calculateSimilarity(event.event_name, queryTrimmed);
        const cityScore = calculateSimilarity(event.city, queryTrimmed) * 0.5;
        const stateScore = calculateSimilarity(event.state, queryTrimmed) * 0.5;
        const tierScore = calculateSimilarity(event.tier, queryTrimmed) * 0.3;
        
        const maxScore = Math.max(nameScore, eventNameScore, cityScore, stateScore, tierScore);
        
        return {
            event,
            score: maxScore,
            matchField: nameScore >= eventNameScore ? 'name' : 'event_name'
        };
    });
    
    // Filter and sort by score
    const suggestions = scoredEvents
        .filter(item => item.score > 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    
    return suggestions;
}

/**
 * Highlight matching parts of text
 */
function highlightMatch(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="suggestion-match">$1</span>');
}

/**
 * Display search suggestions
 */
function displaySuggestions(query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!suggestionsContainer) {
        console.error('Suggestions container not found');
        return;
    }
    
    if (!query || query.trim().length < 2) {
        suggestionsContainer.classList.remove('active');
        suggestionsContainer.innerHTML = '';
        currentSuggestions = [];
        return;
    }
    
    const suggestions = generateSuggestions(query);
    currentSuggestions = suggestions;
    suggestionIndex = -1;
    
    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-suggestions">No suggestions found</div>';
        suggestionsContainer.classList.add('active');
        return;
    }
    
    const suggestionsHTML = suggestions.map((item, index) => {
        const event = item.event;
        const displayName = event[item.matchField] || event.name;
        const highlightedName = highlightMatch(displayName, query);
        
        return `
            <div class="suggestion-item" data-index="${index}">
                <div class="suggestion-name">${highlightedName}</div>
                <div class="suggestion-meta">
                    ${event.start_date} • ${event.tier} • ${event.city}, ${event.state || event.country}
                </div>
            </div>
        `;
    }).join('');
    
    suggestionsContainer.innerHTML = suggestionsHTML;
    suggestionsContainer.classList.add('active');
    
    // Add click handlers
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            selectSuggestion(index);
        });
    });
}

/**
 * Select a suggestion
 */
function selectSuggestion(index) {
    if (index < 0 || index >= currentSuggestions.length) return;
    
    const suggestion = currentSuggestions[index];
    const event = suggestion.event;
    const displayName = event[suggestion.matchField] || event.name;
    
    // Helper: show navigation spinner overlay
    function showNavSpinner() {
        const spinner = document.getElementById('navSpinner');
        if (!spinner) return;
        spinner.classList.remove('hidden');
        // allow browser to paint the overlay before navigation
    }

    // If the event has an `id` (continual/main id), navigate back to main page
    if (event && (event.id || event.id === 0)) {
        try {
            sessionStorage.setItem('selectedId', event.id);
        } catch (e) {
            console.warn('Unable to set sessionStorage selectedId', e);
        }

        // Show a small loading overlay so user sees feedback, then navigate
        showNavSpinner();
        // short delay to ensure overlay is painted
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 80);
        return;
    }

    // Fallback: populate the input and perform a regular search if no id present
    searchInput.value = displayName;
    const suggestionsContainer = document.getElementById('searchSuggestions');
    suggestionsContainer.classList.remove('active');
    searchForm.dispatchEvent(new Event('submit'));
}

/**
 * Navigate suggestions with keyboard
 */
function navigateSuggestions(direction) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (items.length === 0) return;
    
    // Remove previous highlight
    if (suggestionIndex >= 0 && suggestionIndex < items.length) {
        items[suggestionIndex].classList.remove('highlighted');
    }
    
    // Update index
    if (direction === 'down') {
        suggestionIndex = (suggestionIndex + 1) % items.length;
    } else if (direction === 'up') {
        suggestionIndex = suggestionIndex <= 0 ? items.length - 1 : suggestionIndex - 1;
    }
    
    // Add new highlight
    if (suggestionIndex >= 0 && suggestionIndex < items.length) {
        items[suggestionIndex].classList.add('highlighted');
        items[suggestionIndex].scrollIntoView({ block: 'nearest' });
    }
}

/**
 * Initialize suggestion functionality
 */
function initializeSuggestions() {
    if (!searchInput) return;
    
    // Show suggestions on input
    searchInput.addEventListener('input', (e) => {
        displaySuggestions(e.target.value);
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        const isActive = suggestionsContainer.classList.contains('active');
        
        if (!isActive) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigateSuggestions('down');
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                navigateSuggestions('up');
                break;
                
            case 'Enter':
                if (suggestionIndex >= 0) {
                    e.preventDefault();
                    selectSuggestion(suggestionIndex);
                }
                break;
                
            case 'Escape':
                suggestionsContainer.classList.remove('active');
                break;
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!searchForm.contains(e.target)) {
            suggestionsContainer.classList.remove('active');
        }
    });
    
    // Show suggestions when focusing on input with existing value
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            displaySuggestions(searchInput.value);
        }
    });
}

// Initialize suggestions after data is loaded

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
    
    /**
     * Check if query matches acronym of text (space-separated words only)
     * Example: "pdgwc" matches "Professional Disc Golf World Championships"
     */
    function matchesAcronym(text, query) {
        if (!text || !query) return false;
        
        const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        
        if (!cleanQuery || !cleanText) return false;
        
        // Get first letter of each word
        const textWords = cleanText.split(/\s+/);
        const textAcronym = textWords.map(word => word.charAt(0)).join('');
        
        // Try exact match
        if (cleanQuery === textAcronym) return true;
        
        // Try substring match (e.g., "dg" matches "Disc Golf" in "Professional Disc Golf...")
        return textAcronym.includes(cleanQuery);
    }
    
    /**
     * Check if text contains query substring
     */
    function matchesText(text, query) {
        if (!text || !query) return false;
        return text.toLowerCase().includes(query.toLowerCase());
    }
    
    /**
     * Check if text is a number and matches query
     */
    function matchesNumber(text, query) {
        if (!text || !query) return false;
        return String(text).includes(query);
    }
    
    /**
     * Score an event based on how well it matches the query
     * Higher score = better match. Returns 0 if no match.
     */
    function scoreEvent(event, searchQuery) {
        let score = 0;
        const lowerQuery = searchQuery.toLowerCase();
        
        // Exact name match (highest priority)
        if (event.name?.toLowerCase() === lowerQuery) score += 100;
        else if (event.event_name?.toLowerCase() === lowerQuery) score += 100;
        // Name starts with query
        else if (event.name?.toLowerCase().startsWith(lowerQuery)) score += 80;
        else if (event.event_name?.toLowerCase().startsWith(lowerQuery)) score += 80;
        // Name contains query
        else if (matchesText(event.name, searchQuery)) score += 60;
        else if (matchesText(event.event_name, searchQuery)) score += 60;
        // Acronym match
        else if (matchesAcronym(event.name, searchQuery)) score += 50;
        else if (matchesAcronym(event.event_name, searchQuery)) score += 50;
        
        // Secondary field matches (lower priority)
        if (score > 0) {
            // Boost if location also matches
            if (matchesText(event.city, searchQuery)) score += 5;
            if (matchesText(event.state, searchQuery)) score += 5;
            if (matchesText(event.country, searchQuery)) score += 5;
            return score;
        }
        
        // Location matches
        if (matchesText(event.city, searchQuery)) score += 30;
        if (matchesText(event.state, searchQuery)) score += 30;
        if (matchesText(event.country, searchQuery)) score += 30;
        
        // Tier matches
        if (matchesText(event.tier, searchQuery)) score += 20;
        
        // PDGA number matches
        if (matchesNumber(event.pdga_number, searchQuery)) score += 40;
        
        return score;
    }
    
    const searchQuery = query;
    
    // Score and filter the data based on the query
    const scoredEvents = originalData
        .map(event => ({
            event,
            score: scoreEvent(event, searchQuery)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score); // Sort by score descending
    
    const filteredData = scoredEvents.map(item => item.event);
    
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
    
    // Reset sorting state when performing new search
    currentSortColumn = null;
    currentSortDirection = 'asc';
    
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