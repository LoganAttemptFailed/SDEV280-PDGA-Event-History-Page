import {
  getAllEventsID,
  getAllEventsDetails,
  getParticipantsAndPrizesPerYearByPdgaEventIds,
  clearTable,
  activateBackToAllEventsBtn,
  processTierData,
  sortingEventsByDate,
  renderEventDetails,
  renderParticipantsTrend,
  renderPrizeMoneyAnalysis,
  renderAverageRatings,
  renderDiffRating,
  activateVizSelectionBtn,
  renderSelectedVizButton,
  getEventsResultByPdgaEventIds,
  getPlayersByPdgaNumbers,
  renderDivisionsWinner,
  renderHighestRoundRating,
  renderTop5DivisionsRating,
  sortDivisions,
  renderFieldSizeBoxplot,
  getUniqueEventDivisions,
  customTierOrder,
  deepCopyMapOfObjects,
  activateDivisionWinnerCardSelection,
  processWinterTimeOpenEvents,
  processNorthwestDgcEvents
} from "./functions/index.js";

let allEventsMap = new Map();
const mainEventsObj = {};
let selectedEvent;
let selectedEventsResult = [];
let pastEventsList = [];
let finalEventsResult = []
let continualId;
const eventIdsContinualIdsMap = new Map();
const eventDivisionsMap = new Map();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               Initialization Code
//
// --------------------------------------------------------------------------------------------------------------------------

(async () => {
  const [allEventsId, allEventsDetails] = await Promise.all([
    getAllEventsID(),
    getAllEventsDetails(),
  ]);

  const allEventsIdMap = new Map()
  allEventsId.forEach(event => {
    if (!allEventsIdMap.get(event.pdga_event_id)) {
      allEventsIdMap.set(event.pdga_event_id, [])
    }
    allEventsIdMap.get(event.pdga_event_id).push(event)
  })

  const continualEventsListMap = new Map();
  allEventsIdMap.forEach(pdga_event_id => {
    if (pdga_event_id.length === 1) {
      if (!continualEventsListMap.get(pdga_event_id[0].id)) {
        continualEventsListMap.set(pdga_event_id[0].id, [])
      }
      continualEventsListMap.get(pdga_event_id[0].id).push(pdga_event_id[0])
    } else if (pdga_event_id.length > 1) {
      for (let i = 0; i < pdga_event_id.length; i++) {
        if (!continualEventsListMap.get(pdga_event_id[i].id)) {
          continualEventsListMap.set(pdga_event_id[i].id, [])
        }
        continualEventsListMap.get(pdga_event_id[i].id).push(pdga_event_id[i])
      }
    }
  })

  const allEventsDetailsMap = new Map();
  allEventsDetails.forEach(event => {
    if (!allEventsDetailsMap.get(event.pdga_event_id)) {
      allEventsDetailsMap.set(event.pdga_event_id, [])
    }
    allEventsDetailsMap.get(event.pdga_event_id).push(event)
  })

  continualEventsListMap.forEach(eventsList => {
    eventsList.forEach(event => {
      const pdgaEventId = event.pdga_event_id;
      const eventDetail = allEventsDetailsMap.get(pdgaEventId)
      if (eventDetail) {
        const continualId = event.id;
        const mergedEventDetail = { ...event, ...eventDetail[0], id: continualId }
        if (!allEventsMap.get(continualId)) {
          allEventsMap.set(continualId, []);
        }
        allEventsMap.get(continualId).push(mergedEventDetail);
      }
    })
  })

  // Process northwest dgc events
  const processedNwdgcAllEventsMap = processNorthwestDgcEvents(allEventsMap);

  // Process wintertime open events
  const processedWintertimeAllEventsMap = await processWinterTimeOpenEvents(processedNwdgcAllEventsMap);
  allEventsMap = processedWintertimeAllEventsMap;

  // Separate main events by tier
  const mainEvents = [];
  const copyAllEventsMap = deepCopyMapOfObjects(allEventsMap);
  copyAllEventsMap.forEach(events => {
    const latestYear = Math.max(...(events.map(e => (+e.year))))
    const isMultipleCity = Array.from(new Set(events.map(e => (e.city)))).length > 1 ? true : false;
    const isMultipleState = Array.from(new Set(events.map(e => (e.state)))).length > 1 ? true : false;
    const isMultipleCountry = Array.from(new Set(events.map(e => (e.country)))).length > 1 ? true : false;
    const isMultipleDirector = Array.from(new Set(events.map(e => (e.tournament_director)))).length > 1 ? true : false;

    const lastestEventList = events.filter(event => event.year === latestYear)
    lastestEventList.forEach(event => {
      if (isMultipleCity) event.city = 'Multiple Cities';
      if (isMultipleState) event.state = 'Multiple States';
      if (isMultipleCountry) event.country = 'Multiple Countries';
      if (isMultipleDirector) event.tournament_director = 'Multiple Directors';
    })
    if (lastestEventList.length === 1) {
      mainEvents.push(lastestEventList[0]);
    } else if (lastestEventList.length > 1) {
      for (let i = 0; i < lastestEventList.length; i++) {
        mainEvents.push(lastestEventList[i]);
      }
    }
  })
  mainEventsObj.major = mainEvents.filter(e => e.tier === 'M');
  mainEventsObj.elite = mainEvents.filter(e => e.tier === 'NT');
  mainEventsObj.others = mainEvents.filter(e => e.tier !== 'M' && e.tier !== 'NT');

  // Sort events by name separate by tier
  for (const [tier, mainEvents] of Object.entries(mainEventsObj)) {
    mainEvents.forEach(event => { processTierData(event) });
    if (tier === 'others') {
      mainEvents.sort((a, b) => {
        const indexA = customTierOrder.indexOf(a.tier);
        const indexB = customTierOrder.indexOf(b.tier);
        const effectiveIndexA = indexA === -1 ? Infinity : indexA;
        const effectiveIndexB = indexB === -1 ? Infinity : indexB;
        const tierDifference = effectiveIndexA - effectiveIndexB;
        if (tierDifference !== 0) {
          return tierDifference;
        }
        const nameA = a.name;
        const nameB = b.name;
        return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
      })
    } else {
      mainEvents.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }
  };

  // Render all events table
  renderTable(mainEventsObj);

  // Check if coming from search page with selected event
  let selectedId = sessionStorage.getItem('selectedId');

  // If wintertime open event is selected, show wintertime open professional (2801), 
  // TODO: future fix for search.js to use same process for wintertime open events into professional and amateur 2801 and 2802
  if (+selectedId === 28) selectedId = 2801;

  if (selectedId) {
    sessionStorage.removeItem('selectedId');

    let event;
    for (const [tier, mainEvents] of Object.entries(mainEventsObj)) {
      event = mainEvents.find(e => e.id === parseInt(selectedId));
      if (event) break;
    }
    handleEventClick(event)
  }

  window.addEventListener('popstate',  () => window.location.reload());

  // // Initialize filter functionality
  populateYearsFilter();
  populateDivisionsFilter();
  populateCountriesFilter();
  initializeFilters();

  activateVizSelectionBtn();
  activateBackToAllEventsBtn();
})();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               FILTER FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

function populateOptions(selectElement, optionsArray, defaultOptionText) {
  // Clear existing options
  selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;

  optionsArray.forEach((item) => {
    if (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      selectElement.appendChild(option);
    }
  });
}

// Populate year dropdown with unique years from allEventsData
function populateYearsFilter() {
  const yearSelect = document.getElementById("year");
  let uniqueYears = [];
  allEventsMap.forEach(events => {
    uniqueYears = [...uniqueYears, ...events.map(e => e.year)];
  });
  const sortedUniqueYears = [...new Set(uniqueYears)].sort((a, b) => b - a);

  // Add unique years to dropdown
  populateOptions(yearSelect, sortedUniqueYears, "All Years");
}

// Populate country dropdown with unique countries from allEventsData
function populateCountriesFilter() {
  const countrySelect = document.getElementById("country");

  let uniqueCountries = [];
  allEventsMap.forEach(events => {
    uniqueCountries = [...uniqueCountries, ...events.map(e => e.country)];
  });
  const sortedCountries = [...new Set(uniqueCountries)].sort();

  // Add unique countries to dropdown
  populateOptions(countrySelect, sortedCountries, "All Countries");
}

// Populate division dropdown with unique divisions from all events
async function populateDivisionsFilter() {
  const divisionsByPdgaEventIdList = await getUniqueEventDivisions();

  allEventsMap.forEach((id) => {
    id.forEach(event => {
      if (!eventIdsContinualIdsMap.get(event.pdga_event_id)) {
        eventIdsContinualIdsMap.set(event.pdga_event_id, []);
      }
      eventIdsContinualIdsMap.get(event.pdga_event_id).push(event.id);
    });
  });

  divisionsByPdgaEventIdList.forEach((eventId) => {
    const continualIdList = eventIdsContinualIdsMap.get(eventId.pdga_event_id);
    continualIdList?.forEach(continualId => {
      const divisionsArray = eventDivisionsMap.get(continualId);
      if (!divisionsArray) {
        eventDivisionsMap.set(continualId, []);
      }
      if (divisionsArray && !divisionsArray.includes(eventId.division)) {
        eventDivisionsMap.get(continualId).push(eventId.division);
      }
    });
  });

  // Get unique and sorted divisions
  const sortedDivisions = sortDivisions([
    ...new Set(divisionsByPdgaEventIdList.map((item) => item.division)),
  ]);

  const divisionSelect = document.getElementById("division");
  // Add unique countries to dropdown
  populateOptions(divisionSelect, sortedDivisions, "All Divisions");
}

// Filter events based on selected criteria
function filterEvents() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const countrySelect = document.getElementById("country");

  const selectedYear = yearSelect.value;
  const selectedDivision = divisionSelect.value;
  const selectedCountry = countrySelect.value;

  let filteredEvents = [];
  for (const [tier, mainEvents] of Object.entries(mainEventsObj)) {
    filteredEvents = [...filteredEvents, ...mainEvents]
  };

  // Filter by year - check if the event was played in the selected year
  if (selectedYear && selectedYear !== "All Years") {
    let eventsList = [];
    allEventsMap.forEach(id => {
      eventsList = [...eventsList, ...id.filter(e => e.year.toString() === selectedYear.toString())];
    });
    const continualIds = eventsList.map(e => e.id)
    let updatedFilteredEvents = []
    continualIds.forEach(id => {
      updatedFilteredEvents = [...updatedFilteredEvents, ...filteredEvents.filter(e => e.id === id)]
    });
    filteredEvents = [...new Set(updatedFilteredEvents)];
  }

  // Filter by country
  if (selectedCountry && selectedCountry !== "All Countries") {
    let eventsList = [];
    allEventsMap.forEach(id => {
      eventsList = [...eventsList, ...id.filter(e => e.country === selectedCountry)];
    });
    const continualIds = eventsList.map(e => e.id)
    let updatedFilteredEvents = []
    continualIds.forEach(id => {
      updatedFilteredEvents = [...updatedFilteredEvents, ...filteredEvents.filter(e => e.id === id)]
    });
    filteredEvents = [...new Set(updatedFilteredEvents)];
  }

  // Filter by division - check if any event in the continual series had that division
  if (selectedDivision && selectedDivision !== "All Divisions") {
    filteredEvents = filteredEvents.filter((event) => {
      const divisions = eventDivisionsMap.get(event.id);
      return divisions && divisions.includes(selectedDivision);
    });
  }

  const filteredEventsObj = {};
  filteredEventsObj.major = [...filteredEvents.filter(e => e.tier === 'Major')];
  filteredEventsObj.elite = [...filteredEvents.filter(e => e.tier === 'Elite')];
  filteredEventsObj.others = [...filteredEvents.filter(e => e.tier !== 'Major' && e.tier !== 'Elite')];

  // Update pagination with filtered data
  renderTable(filteredEventsObj);
}

// Add event listeners for filter changes
function initializeFilters() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const countrySelect = document.getElementById("country");
  const clearFiltersBtn = document.getElementById("clearFilters");

  if (yearSelect) {
    yearSelect.addEventListener("change", filterEvents);
  }

  if (divisionSelect) {
    divisionSelect.addEventListener("change", filterEvents);
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", filterEvents);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
  }
}

// Clear all filters and reset to show all events
function clearFilters() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const countrySelect = document.getElementById("country");

  if (yearSelect) yearSelect.value = "";
  if (divisionSelect) divisionSelect.value = "";
  if (countrySelect) countrySelect.value = "";

  // Reset to show all events
  renderTable(mainEventsObj);
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SEARCH FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

// Handle search form submission (works on both pages)
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      // Replace old state before redirect
      history.replaceState(null, '', window.location.origin);
      // Redirect to search page with search query
      window.location.href = `${origin}/search.html?q=${encodeURIComponent(query)}`;
    }
  });
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               EVENT SELECTED HANDLER
//
// --------------------------------------------------------------------------------------------------------------------------

function renderEvent() {
  renderEventDetails(selectedEvent, pastEventsList);
  renderSelectedVizButton();
  renderDivisionsWinner(selectedEventsResult, pastEventsList);
  activateDivisionWinnerCardSelection();
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               RENDER TABLE
//
// --------------------------------------------------------------------------------------------------------------------------

function renderTable(eventsObject) {
  for (const [tier, mainEvents] of Object.entries(eventsObject)) {
    const tableBody = document.getElementById(`${tier}-tableBody`);

    // Clear table
    clearTable(`${tier}-tableBody`);

    mainEvents.forEach(event => {
      // Add data rows
      const rowContent = `
        <td>${event.name}</td>
        <td><span class="tier-badge ${event.tierCode}">${event.tier}</span></td>
        <td>${event.city}</td>
        <td>${event.state}</td>
        <td>${event.country}</td>
      `;

      // Add event listener to the row
      const row = document.createElement("tr");
      row.innerHTML = rowContent;
      row.addEventListener("click", () => {
        handleEventClick(event)
      });

      tableBody.appendChild(row);
    });
  }
}

export async function handleEventClick(event) {
  // Assign selectedEvent continualId
  continualId = event.id;

  // Assign selectedEvent
  selectedEvent = event;

  // Get selectedEvents 
  const unsortedSelectedEvents = allEventsMap.get(continualId);

  // Gather all pdga_event_id for query additional data (players count and total prize)
  const pdgaEventIds = unsortedSelectedEvents.map(e => e.pdga_event_id);

  const [additionalData, eventsResult] = await Promise.all([
    getParticipantsAndPrizesPerYearByPdgaEventIds(pdgaEventIds),
    getEventsResultByPdgaEventIds(pdgaEventIds),
  ]);

  // Map to new array
  const newUnsortedSelectedEvents = [];
  unsortedSelectedEvents.forEach((event) => {
    const playersCount =
      additionalData.find((e) => e.pdga_event_id === event.pdga_event_id)
        ?.players_count || "N/A";
    const totalPrize =
      additionalData.find((e) => e.pdga_event_id === event.pdga_event_id)
        ?.total_prize || "N/A";
    newUnsortedSelectedEvents.push({
      ...event,
      players_count: playersCount,
      total_prize: totalPrize,
    });
  });
  pastEventsList = sortingEventsByDate(newUnsortedSelectedEvents);

  const pdgaNumbers = Array.from(
    new Set(eventsResult.map((e) => +e.pdga_number))
  );

  const winnersData = await getPlayersByPdgaNumbers(pdgaNumbers);

  eventsResult.forEach((event) => {
    const player = winnersData.find(
      (p) => String(p.pdga_number) === String(event.pdga_number)
    );
    event.player_name = player
      ? `${player.first_name} ${player.last_name}`
      : "N/A";
  });

  selectedEventsResult = eventsResult;

  renderEvent();

  // Adjust CSS accordingly
  document.getElementById("past-events-table").style.display = "block";
  document.getElementById("btn-container").style.display = "flex";
  document.getElementById("events-table").style.display = "none";

  const newPath = `/id/${continualId}`;
  history.pushState({ state: 'details', id: continualId }, null, newPath);
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               CODES FOR VISUALIZATION BUTTON CLICKED
//
// --------------------------------------------------------------------------------------------------------------------------

export function handleVizButtonClick(buttonText) {
  // The 'buttonText' determines which specific visualization function to call.
  switch (buttonText) {
    case "Participants Trend":
      renderParticipantsTrend(pastEventsList);
      break;

    case "Prize Money Analysis":
      renderPrizeMoneyAnalysis(pastEventsList);
      break;

    case "Average Ratings":
      renderAverageRatings(continualId);
      break;

    case "Difference in Rating":
      renderDiffRating(continualId);
      break;

    case "Field Size Distribution":
      renderFieldSizeBoxplot(pastEventsList);
      break;

    case "Highest Round Rating":
      renderHighestRoundRating(continualId);
      break;

    case "Top 5 Divisions Rating":
      renderTop5DivisionsRating(continualId);
      break;

    default:
      console.error("Unknown visualization button:", buttonText);
  }
}

export function setFinalEventsResult(result) {
  finalEventsResult = result;
};

export function getFinalEventsResult() {
  return finalEventsResult;
}

export function getSelectedEventResult() {
  return selectedEventsResult;
};