export function processTierData(item) {
  // Process tier data
  switch (item.tier) {
    case "M":
      item.tierCode = "tier-m";
      item.tier = "Major";
      break;
    case "NT":
      item.tierCode = "tier-es";
      item.tier = "Elite";
      break;
    case "A":
      item.tierCode = "tier-a";
      item.tier = "Tier-A";
      break;
    case "B":
      item.tierCode = "tier-b";
      item.tier = "Tier-B";
      break;
    case "C":
      item.tierCode = "tier-c";
      item.tier = "Tier-C";
      break;
    case "XA":
      item.tierCode = "tier-xa";
      item.tier = "Tier-XA";
      break;
    case "XB":
      item.tierCode = "tier-xb";
      item.tier = "Tier-XB";
      break;
    case "XC":
      item.tierCode = "tier-xc";
      item.tier = "Tier-XC";
      break;
    case "XM":
      item.tierCode = "tier-xm";
      item.tier = "Tier-XM";
      break;
    default:
      break;
  }

  return item;
}

export const customDivisionOrder = [
  "MPO",
  "FPO",
  "MPG",
  "FPG",
  "MA1",
  "FA1",
  "MM1",
  "FM1",
  "MG1",
  "MA2",
  "MM2",
  "MA3",
  "FA3",
  "MJ2",
  "MJ3",
  "MA40",
  "MP40",
  "FA40",
  "FP40",
  "MA50",
  "MP50",
  "FA50",
  "FP50",
  "MA55",
  "MP55",
  "FA55",
  "FP55",
  "MA60",
  "MP60",
  "FA60",
  "FP60",
  "MA65",
  "MP65",
  "FA65",
  "FP65",
  "MA70",
  "MP70",
  "FA70",
  "FP70",
  "MA75",
  "MP75",
  "FA75",
  "FP75",
  "MA80",
  "MP80",
  "FA80",
  "FP80",
  "MJ18",
  "FJ18",
  "MJ15",
  "FJ15",
  "MJ12",
  "FJ12",
  "MJ10",
  "FJ10",
  "MJ08",
  "FJ08",
  "MJ06",
  "FJ06",
];

export function sortDivisions(divisions) {
  // Sort based on custom Division Order
  return divisions.sort((a, b) => {
    const indexA = customDivisionOrder.indexOf(a);
    const indexB = customDivisionOrder.indexOf(b);

    // If division not in custom Division order, put it at the end
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

export function sortingEventsByDate(events) {
  return events.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateB - dateA;
  });
}

export const customTierOrder = [
  "Major",
  "Elite",
  "Tier-A",
  "Tier-B",
  "Tier-C",
  "Tier-XA",
  "Tier-XB",
  "Tier-XC",
  "Tier-XD",
];

export function sortTiers(tiers) {
  // Sort based on custom tier Order
  return tiers.sort((a, b) => {
    const indexA = customTierOrder.indexOf(a);
    const indexB = customTierOrder.indexOf(b);

    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

export function deepCopyMapOfObjects(originalMap) {
  // 1. Convert the Map entries into an array of [key, value] pairs.
  // 2. Map over this array.
  // 3. For each pair [key, value], create a new pair:
  //    - The key remains the same (assuming keys are primitives or safe to copy by reference).
  //    - The value (the object) is deep-copied using JSON methods (or structuredClone for modern environments).

  return new Map(
    Array.from(originalMap, ([key, value]) => {
      // Create a new, independent copy of the object
      const clonedValue = JSON.parse(JSON.stringify(value));

      // Return the new [key, clonedValue] pair
      return [key, clonedValue];
    })
  );
};

export function mergeEventResultAndDetail(eventsResult, pastEventsList) {
  return eventsResult.map((result) => {
    const eventDetail = pastEventsList.find(
      (event) => event.pdga_event_id === result.pdga_event_id
    );
    return {
      ...result,
      ...eventDetail,
    };
  });
  /* [{}, {}, ...]
      { cash,
        city,
        country,
        division,
        end_date,
        event_name,
        evt_rating,
        id,
        name,
        num_rounds,
        pdga_event_id,
        pdga_number,
        place,
        player_name,
        players_count,
        pre_rating,
        start_date,
        state,
        tier,
        total_prize,
        total_score,
        tournament_director,
        website_url,
        year }
  */
};

export function getReigningWinnersList(eventsResult, division, i, tableHeight) {
  const divisionWinnerList = eventsResult.filter(
    (e) => e.division === division
  );

  const reigningWinnersMap = new Map();

  // Mapping reiging winners into map 
  divisionWinnerList.forEach((event) => {
    const winner = event.player_name?.trim() || "N/A";
    const pdga = +event.pdga_number || 0;
    const prize = +event.cash || 0;
    const key = `${winner}___${pdga}`; // Use PDGA # as tiebreaker to avoid name collisions

    if (reigningWinnersMap.has(key)) {
      const existing = reigningWinnersMap.get(key);
      existing.winCount += 1;
      existing.prizeEarned += prize;
    } else {
      reigningWinnersMap.set(key, {
        division: event.division,
        winner,
        winCount: 1,
        pdgaNumber: pdga,
        prizeEarned: prize,
      });
    }
  });

  // Convert to array (and sort by wins)
  const reigningWinners = Array.from(reigningWinnersMap.values());
  reigningWinners.sort((a, b) => b.winCount - a.winCount);
  // [{division: 'MPO', winner: 'Paul McBeth', winCount: 5, pdgaNumber: 27523, prizeEarned: 22081, …}, ...]

  let divisionTableHeight = 0;

  // Set table height for champions table
  if (i === 0 && tableHeight === 0) {
    divisionTableHeight = (reigningWinners.length * 33) + 48; // 33 is one data row height + 48 which is table head height
  } else if (i === 1) {
    const newHeight = (reigningWinners.length * 33) + 48;
    divisionTableHeight = tableHeight > newHeight ?
      newHeight : tableHeight;
  }

  // Assign ranks with handling ties
  const firstRankWinCount = reigningWinners[0]?.winCount || "N/A";
  let currentWinCount = firstRankWinCount;
  let currentRank = 1;
  let rankCounter = 0;
  reigningWinners.forEach((winner) => {
    if (winner.winCount === currentWinCount) {
      winner.rank = currentRank;
      rankCounter += 1;
    } else if (winner.winCount < currentWinCount) {
      rankCounter += 1;
      currentRank = rankCounter;
      winner.rank = currentRank;
      currentWinCount = winner.winCount;
    }
  });

  // Format ranks
  reigningWinners.forEach((dw) => {
    if (dw.rank === 1) {
      dw.rank = "1st";
    } else if (dw.rank === 2) {
      dw.rank = "2nd";
    } else if (dw.rank === 3) {
      dw.rank = "3rd";
    } else {
      dw.rank = dw.rank + "th";
    }
  });

  return { reigningWinners, divisionTableHeight };
};

// Get past events division winners and sort by year
export function getPastDivisionWinners(division, finalEventsResult) {
  const pastDivisionWinners = finalEventsResult.filter(
    (fe) => fe.division === division
  );
  return pastDivisionWinners.sort((a, b) => b.year - a.year);
};