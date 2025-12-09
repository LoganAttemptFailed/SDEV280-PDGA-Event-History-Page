// Get all recent events to display in recent events table
export async function getAllRecentEventsContinualList() {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getAllRecentEventsContinualList`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               VISUALIZATION SECTION QUERIES
//
// --------------------------------------------------------------------------------------------------------------------------


export async function getContinualEventsTop5DivisionsRating(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsTop5DivisionsRating&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching top 5 divisions rating data:", error);
    return [];
  }
}






export async function getContinualEventsHighestRoundRating(continualId) {
  const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsHighestRoundRating&continualId=${continualId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching highest round rating data:", error);
    return [];
  }
}



export async function getContinualEventsParticipants(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsParticipants&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getContinualEventsWithPrizes(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsWithPrizes&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getContinualEventsAverageRatingByDivision(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsAverageRatingByDivision&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

//difference in rating visulization
export async function getContinualEventsDiffRating(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/diffRatingQuery.php?queryType=getContinualEventsDiffRating&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching rating difference data:", error);
    return [];
  }
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SPECIFIC EVENTS STATS QUERIES
//
// --------------------------------------------------------------------------------------------------------------------------

export async function getRecurringEventCountOnContinualEvent(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getRecurringEventCountOnContinualEvent&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getPlayerCountOnContinualEvent(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getPlayerCountOnContinualEvent&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getAvgPlayerCountOnContinualEvent(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getAvgPlayerCountOnContinualEvent&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getTotalPrizeOnContinualEvent(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getTotalPrizeOnContinualEvent&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getEventDateRange(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getEventDateRange&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getPastEvents(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getPastEvents&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getPlayersByPdgaNumbers(pdgaNumbers) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getPlayersByPdgaNumbers&pdgaNumbers=${pdgaNumbers}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getAllEventsID() {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getAllEventsID`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getAllEventsDetails() {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getAllEventsDetails`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getParticipantsAndPrizesPerYearByPdgaEventIds(pdgaEventIds) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getParticipantsAndPrizesPerYearByPdgaEventIds&pdgaEventIds=${pdgaEventIds}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getEventsResultByPdgaEventIds(pdgaEventIds) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getEventsResultByPdgaEventIds&pdgaEventIds=${pdgaEventIds}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getUniqueEventDivisions() {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getUniqueEventDivisions`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function getDivisionsByPdgaEventId(pdgaEventId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query_sprint3.php?queryType=getDivisionsByPdgaEventId&pdgaEventId=${pdgaEventId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  };
};