import { getFinalEventsResult, getSelectedEventResult, handleVizButtonClick, setFinalEventsResult } from "../script.js";
import { getPastDivisionWinners, getReigningWinnersList, mergeEventResultAndDetail, sortDivisions } from "./functions.js";
import {
  getCurrentPageData,
  getPaginationInfo,
  initPagination,
  updatePaginationControls,
  updatePaginationInfo,
} from "./pagination.js";

export function clearTable(tableBodyId) {
  const tableBody = document.getElementById(tableBodyId);
  if (tableBody) {
    tableBody.innerHTML = "";
  }
}

export function fillEmptyRows(
  tableBody,
  currentRowCount,
  pageSize,
  columnCount
) {
  const rowsToFill = pageSize - currentRowCount;

  const emptyCellHtml = `<td>&nbsp;</td>`;
  const emptyCells = Array(columnCount).fill(emptyCellHtml).join("");

  for (let i = 0; i < rowsToFill; i++) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "empty-row";

    emptyRow.innerHTML = emptyCells;
    tableBody.appendChild(emptyRow);
  }
}

export async function updateStatCards(pastEventsList) {
  const eventsCount = pastEventsList.length;
  const startYear = pastEventsList[pastEventsList.length - 1].year;
  let playersCount = 0;
  let totalPrize = 0;

  pastEventsList.forEach((event) => {
    playersCount += event.players_count === "N/A" ? 0 : event.players_count;
    totalPrize += event.total_prize === "N/A" ? 0 : event.total_prize;
  });
  const avgPlayersCount = Math.round(playersCount / eventsCount, 0);

  document.getElementById("stat-total-events").textContent =
    eventsCount.toLocaleString();
  document.getElementById(
    "stat-detail-total-event"
  ).textContent = `Running Since ${startYear}`;
  document.getElementById("stat-total-players").textContent =
    playersCount.toLocaleString();
  document.getElementById("stat-avg-players").textContent =
    avgPlayersCount.toLocaleString();

  if (totalPrize > 1000000) {
    document.getElementById("stat-total-prize").textContent =
      "$" + (totalPrize / 1000000).toFixed(1) + "M";
  } else {
    document.getElementById("stat-total-prize").textContent =
      "$" + totalPrize.toLocaleString();
  }
}

export function relocatePaginationControls(
  paginationContainer,
  newParent,
  buttonContainer
) {
  if (paginationContainer && buttonContainer && newParent) {
    newParent.insertBefore(paginationContainer, buttonContainer);
  } else {
    newParent.appendChild(paginationContainer);
  }
}

export function activateBackToAllEventsBtn() {
  const btn = document.getElementById("all-events-btn");
  const headerBtn = document.getElementById("header-back-btn");

  const backToAllEvents = () => {
    document.getElementById("btn-container").style.display = "none";
    history.replaceState(null, '', window.location.origin);
    window.location.reload();
  };

  btn.addEventListener("click", backToAllEvents);

  if (headerBtn) {
    headerBtn.addEventListener("click", backToAllEvents);
  }
}

export function getTierBadge(tier) {
  let tierClass = "";
  let tierLabel = tier;

  switch (tier) {
    case "Major":
      tierClass = "tier-m";
      tierLabel = "PDGA Major";
      break;
    case "Elite":
      tierClass = "tier-es";
      tierLabel = "Elite Series";
      break;
    case "Tier-A":
      tierClass = "tier-a";
      tierLabel = "A-Tier";
      break;
    case "Tier-B":
      tierClass = "tier-b";
      tierLabel = "B-Tier";
      break;
    case "Tier-C":
      tierClass = "tier-c";
      tierLabel = "C-Tier";
      break;
    case "Tier-XA":
      tierClass = "tier-xa";
      tierLabel = "XA-Tier";
      break;
    case "Tier-XB":
      tierClass = "tier-xb";
      tierLabel = "XB-Tier";
      break;
    case "Tier-XC":
      tierClass = "tier-xc";
      tierLabel = "XC-Tier";
      break;
    case "Tier-XM":
      tierClass = "tier-xm";
      tierLabel = "XM-Tier";
      break;
    default:
      tierLabel = tier || "Unknown";
  }

  return `<span class="tier-badge ${tierClass}">${tierLabel}</span>`;
}

export function createChart(title, legend, xAxis, yAxis, series, tooltip) {
  // Initialize the echarts instance based on the prepared dom
  var myChart = echarts.init(document.getElementById("viz"));

  myChart.clear();

  // Specify the configuration items and data for the chart
  var option = {
    title: title,
    tooltip: tooltip,
    legend: legend,
    xAxis: xAxis,
    yAxis: yAxis,
    series: series,
  };

  // Display the chart using the configuration items and data just specified.
  myChart.setOption(option);
}

export function renderPastEventsTable() {
  const tableBody = document.getElementById("past-events-body");
  const { data: pageData } = getCurrentPageData();
  const { pageSize, currentPage } = getPaginationInfo();

  // Clear table
  clearTable("past-events-body");

  // Add data rows
  pageData.forEach((item) => {
    const rowContent = `
      <td>${item.year}</td>
      <td>${item.event_name}</td>
      <td>${item.start_date}</td>
      <td>${item.city}</td>
      <td>${item.country}</td>
      <td>${item.tournament_director === '0' ? 'N/A' : item.tournament_director}</td>
    `;

    const row = document.createElement("tr");
    row.innerHTML = rowContent;
    row.addEventListener("click", () => {
      window.open(item.website_url, "_blank");
    });

    tableBody.appendChild(row);
  });

  // Fill empty rows
  fillEmptyRows(tableBody, pageData.length, pageSize, 5);

  // Update pagination UI
  updatePaginationInfo();
  updatePaginationControls();
}

export function renderEventDetails(selectedEvent, pastEventsList) {
  const eventSection = document.getElementById("event-section");
  const eventName = document.getElementById("event-name");
  const eventTier = document.getElementById("event-tier");
  const eventRunning = document.getElementById("event-running");
  const eventCity = document.getElementById("event-city");
  const eventState = document.getElementById("event-state");
  const eventCountry = document.getElementById("event-country");
  const eventDirector = document.getElementById("event-director");

  // Check if all required elements exist
  if (
    !eventSection ||
    !eventName ||
    !eventTier ||
    !eventRunning ||
    !eventCity ||
    !eventState ||
    !eventCountry ||
    !eventDirector
  ) {
    console.error("One or more required elements not found");
    return;
  }

  // Check if selectedEvent exists
  if (!selectedEvent) {
    console.error("selectedEvent is not defined");
    return;
  }

  // Now safely assign values
  eventSection.style.display = "block";
  eventName.textContent = selectedEvent.name || "Unknown Event";

  const tierBadge = getTierBadge(selectedEvent.tier);
  eventTier.innerHTML = tierBadge || "";

  // Check pastEventsList
  if (pastEventsList && pastEventsList.length > 0) {
    const start_year = pastEventsList[pastEventsList.length - 1].year;
    const end_year = pastEventsList[0].year;
    eventRunning.textContent = `${start_year} - ${end_year}`;
  } else {
    eventRunning.textContent = "N/A";
  }

  updateStatCards(pastEventsList);

  if (selectedEvent.city === 'Multiple Cities' && selectedEvent.state === 'Multiple States' && selectedEvent.country === 'Multiple Countries') {
    eventCity.textContent = 'Multiple Locations';
    eventState.textContent = '';
    eventCountry.textContent = '';
  } else if (selectedEvent.city === 'Multiple Cities' && selectedEvent.state === 'Multiple States') {
    eventCity.textContent = 'Multiple Locations,\u00A0';
    eventState.textContent = '';
    eventCountry.textContent = selectedEvent.country || "N/A";
  } else if (selectedEvent.city === 'Multiple Cities' && selectedEvent.state === '') {
    eventCity.textContent = selectedEvent.city + ',\u00A0';
    eventState.textContent = '';
    eventCountry.textContent = selectedEvent.country || "N/A";
  } else if (selectedEvent.city === 'Multiple Cities' && selectedEvent.state !== '') {
    eventCity.textContent = '';
    eventState.textContent = selectedEvent.state + ',\u00A0';
    eventCountry.textContent = selectedEvent.country || "N/A";
  } else {
    eventCity.textContent = selectedEvent.city + ",\u00A0" || "N/A,\u00A0";
    eventState.textContent = selectedEvent.state
      ? selectedEvent.state + ",\u00A0"
      : "";
    eventCountry.textContent = selectedEvent.country || "N/A";
  }
  eventDirector.textContent = selectedEvent.tournament_director || "N/A";

  initPagination(pastEventsList, renderPastEventsTable);

  // Show the header back button when viewing an event
  showHeaderBackButton();

  const OFFSET = 100; // Define your desired offset in pixels (e.g., 100px)
  // 1. Get the target element's position relative to the viewport
  const elementPosition = eventSection.getBoundingClientRect().top;
  // 2. Get the current scroll position
  const offsetPosition = window.scrollY;
  // 3. Calculate the new scroll position (Target Position + Current Scroll - Offset)
  const targetScrollPosition = elementPosition + offsetPosition - OFFSET;
  // 4. Smoothly scroll to the calculated position
  window.scrollTo({
    top: targetScrollPosition,
    behavior: "smooth"
  });
}

export function activateVizSelectionBtn() {
  const vizButtons = document.querySelectorAll(".viz-button");

  // 1. Add click handlers for interaction
  vizButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all
      vizButtons.forEach((btn) => btn.classList.remove("active"));

      // Set the clicked button as active
      this.classList.add("active");

      // Get the text and execute the handler
      const buttonText = this.textContent.trim();
      handleVizButtonClick(buttonText);
    });
  });
}

export function renderSelectedVizButton() {
  const initialActiveButton = document.querySelector(".viz-button.active");

  if (initialActiveButton) {
    const initialButtonText = initialActiveButton.textContent.trim();
    handleVizButtonClick(initialButtonText);
  } else if (vizButtons.length > 0) {
    // If no button has 'active' set in HTML, activate the first one by default
    const firstButton = vizButtons[0];
    firstButton.classList.add("active");
    console.log(
      `No active button found. Defaulting to: ${firstButton.textContent.trim()}`
    );
    handleVizButtonClick(firstButton.textContent.trim());
  }
}

export function renderDivisionsWinner(eventsResult, pastEventsList) {
  const section = document.getElementById("division-section");
  section.innerHTML = "";

  // Get unique divisions and sort them
  const allDivisions = eventsResult.map((item) => item.division);
  const uniqueDivisionsSet = new Set(allDivisions);
  const divisionList = sortDivisions(Array.from(uniqueDivisionsSet)); // divisionList = ['MPO', 'FPO']

  // Merge event details into eventsResult
  const finalEventsResult = mergeEventResultAndDetail(eventsResult, pastEventsList);
  setFinalEventsResult(finalEventsResult);

  // Loop through divisions and create 2 cards
  let tableHeight = 0; // to make table smaller when there are less winners to display in the table

  for (let i = 0; i < Math.min(2, divisionList.length); i++) {
    let isLeftCard;
    if (i === 0) isLeftCard = true;

    // Create card content
    const cardContent = `
    <div class="division-card">
            <div class="filter-item">
              <label for="division">Select Division</label>
              <select id="${isLeftCard ? 'left' : 'right'}-division">
                  <option value="">Division</option>
              </select>
            </div>
            <h2 id="${isLeftCard ? 'left' : 'right'}-division-h2">${divisionList[i]}</h2>
            <h4>All-Time Champions</h4>
            <div class='divisions-table-wrapper'>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Champions</th>
                    <th>Total Wins</th>
                    <th>Total Prize Earned</th>
                  </tr>
                </thead>
                <tbody id="${isLeftCard ? 'left' : 'right'}-champions">
                </tbody>
              </table>
            </div>
            <h4>Recent Winners</h4>
            <div class='divisions-table-wrapper'>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Winner</th>
                    <th>Total Score</th>
                    <th>Prize</th>
                  </tr>
                </thead>
                <tbody id="past-${isLeftCard ? 'left' : 'right'}-winners">
                </tbody>
              </table>
            </div>  
          </div>
    `;

    section.innerHTML += cardContent;

    // Populate division options in dropdown list
    let selectedDivisionElement = document.getElementById(isLeftCard ? 'left-division' : 'right-division');
    if (selectedDivisionElement) {
      selectedDivisionElement.innerHTML = '';
      for (let j = 0; j < divisionList.length; j++) {
        selectedDivisionElement.innerHTML += `<option value="${divisionList[j]}">${divisionList[j]}</option>`;
      };
      selectedDivisionElement.value = divisionList[i];
    };

    // Get sorted reigningWinners
    const { reigningWinners, divisionTableHeight } = getReigningWinnersList(eventsResult, divisionList[i], i, tableHeight);

    // Get past events division winners
    const pastDivisionWinners = getPastDivisionWinners(divisionList[i], finalEventsResult);

    // Set table height
    tableHeight = divisionTableHeight;

    populateDivisionsWinnersTable(divisionList[i], reigningWinners, pastDivisionWinners, isLeftCard);
  };

  const allTables = document.querySelectorAll('.divisions-table-wrapper');
  allTables.forEach(wrapper => {
    wrapper.style.height = `${tableHeight}px`;
  });

  const allDivisionsCard = document.querySelectorAll('.division-card');
  if (allDivisionsCard.length === 1) {
    document.getElementById('division-section').style.gridTemplateColumns = 'repeat(4, 1fr)';
    allDivisionsCard[0].style.gridColumn = '2/4';
  };
};

export function populateDivisionsWinnersTable(division, reigningWinners, pastWinners, isLeftCard) {
  // Populate all-time champions table
  const championsTBody = document.getElementById(isLeftCard ? 'left-champions' : 'right-champions');

  championsTBody.innerHTML = '';

  if (championsTBody && reigningWinners?.length > 0) {
    const rows = reigningWinners
      .map((winner) => {
        const prizes = winner.prizeEarned ?? winner.prize ?? 0;
        return `
            <tr data-division="${division}" data-winner="${winner.winner}">
              <td>${winner.rank || "-"}</td>
              <td>${winner.winner}</td>
              <td>${winner.winCount || 0}</td>
              <td>$${prizes.toLocaleString()}</td>
            </tr>
          `.trim();
      })
      .join("");

    championsTBody.insertAdjacentHTML("beforeend", rows);
  }

  // Populate recent winners table
  const recentWinnersTBody = document.getElementById(isLeftCard ? 'past-left-winners' : 'past-right-winners');

  recentWinnersTBody.innerHTML = '';

  if (recentWinnersTBody && pastWinners?.length > 0) {
    const rows = pastWinners
      .map((event) => {
        return `
            <tr data-division="${division}" data-past-winner="${event.player_name || 'N/A'
          }">
              <td>${event.year || "N/A"}</td>
              <td>${event.player_name || 'N/A'}</td>
              <td>${event.total_score || 0}</td>
              <td>$${(+event.cash).toLocaleString() || $0}</td>
            </tr>
          `.trim();
      })
      .join("");

    recentWinnersTBody.insertAdjacentHTML("beforeend", rows);
  };
};

export function showHeaderBackButton() {
  const headerBtn = document.getElementById("header-back-btn");
  if (headerBtn) {
    headerBtn.classList.remove("hidden");
  }
}

export function hideHeaderBackButton() {
  const headerBtn = document.getElementById("header-back-btn");
  if (headerBtn) {
    headerBtn.classList.add("hidden");
  }
}

export function activateDivisionWinnerCardSelection() {
  const leftCardSelectedDivision = document.getElementById('left-division');
  const rightCardSelectedDivision = document.getElementById('right-division');

  const eventsResult = getSelectedEventResult();
  const finalEventsResult = getFinalEventsResult();

  function getWinnersAndPopulate(division, isLeftCard) {
    document.getElementById(isLeftCard ? 'left-division-h2' : 'right-division-h2').textContent = division;

    // Get sorted reigningWinners
    const { reigningWinners } = getReigningWinnersList(eventsResult, division, 0, 0);

    // Get past events division winners
    const pastDivisionWinners = getPastDivisionWinners(division, finalEventsResult);

    populateDivisionsWinnersTable(division, reigningWinners, pastDivisionWinners, isLeftCard);
  };

  leftCardSelectedDivision.addEventListener("change", () => {
    const division = leftCardSelectedDivision.value;
    getWinnersAndPopulate(division, true)
  });

  rightCardSelectedDivision.addEventListener("change", () => {
    const division = rightCardSelectedDivision.value;
    getWinnersAndPopulate(division, false)
  });
};