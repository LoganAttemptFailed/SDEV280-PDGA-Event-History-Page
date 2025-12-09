import { createChart } from "./domHandler.js";
import { customDivisionOrder } from "./functions.js";
import { getContinualEventsAverageRatingByDivision, getContinualEventsDiffRating, getContinualEventsHighestRoundRating, getContinualEventsTop5DivisionsRating } from "./queries.js";

export function renderParticipantsTrend(data) {
  const sortedData = [...data].sort((a, b) => {
    return a.year - b.year;
  });

  const title = {
    text:
      "Participants Trend " +
      sortedData[0].year +
      " - " +
      sortedData[sortedData.length - 1].year,
  };
  const legend = {
    data: ["Participants"],
  };
  const yearList = sortedData.map((event) => {
    return event.year;
  });
  const xAxis = {
    data: yearList,
    name: "Year",
  };
  const yAxis = {
    name: "Total Participants", // Set your Y-axis label here
    nameLocation: "middle", // Position the label in the middle of the axis
    nameGap: 50, // Adjust the distance between the label and the axis line
    axisLabel: {
      formatter: "{value}", // Optional: Format the individual axis tick labels
    },
  };
  const playerCounts = sortedData.map((event) => {
    return event.players_count;
  });
  const series = [
    {
      name: "Participants",
      data: playerCounts,
      type: "line",
    },
  ];
  const tooltip = {
    // Formats the value for all series
    valueFormatter: (value) => {
      if (value === null || value === undefined) {
        return "-";
      }
      return value.toLocaleString() + " players";
    },
  };
  createChart(title, legend, xAxis, yAxis, series, tooltip);
}

export function renderPrizeMoneyAnalysis(data) {
  const sortedData = [...data].sort((a, b) => {
    return a.year - b.year;
  });

  const title = {
    text: "Total Prize " + sortedData[0].year + " - " + sortedData[sortedData.length - 1].year,
  };
  const legend = {
    data: ["Total Prize"],
  };
  const yearList = sortedData.map((event) => {
    return event.year;
  });
  const xAxis = {
    data: yearList,
    name: "Year",
  };
  const yAxis = {
    type: "value",
    name: "Total Prize Money", // Set your Y-axis label here
    nameLocation: "middle", // Position the label in the middle of the axis
    nameGap: 50, // Adjust the distance between the label and the axis line
    axisLabel: {
      formatter: "$ {value}", // Optional: Format the individual axis tick labels
    },
  };
  const totalPrize = sortedData.map((event) => {
    return event.total_prize;
  });
  const series = [
    {
      name: "Total Prize",
      data: totalPrize,
      type: "line",
    },
  ];
  const tooltip = {
    // Formats the value for all series
    valueFormatter: (value) => {
      if (value === null || value === undefined) {
        return "-";
      }
      return "$" + value.toLocaleString();
    },
  };
  createChart(title, legend, xAxis, yAxis, series, tooltip);
}

export function renderAverageRatings(continualId) {
  getContinualEventsAverageRatingByDivision(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No rating data available");
      return;
    }

    // Sort divisions using your existing sortDivisions function
    const sortedData = data.sort((a, b) => {
      const indexA = customDivisionOrder.indexOf(a.division);
      const indexB = customDivisionOrder.indexOf(b.division);
      if (indexA === -1 && indexB === -1)
        return a.division.localeCompare(b.division);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const title = {
      text: "Average Event Rating by Division",
    };

    const legend = {
      data: ["Average Rating"],
    };

    const divisionList = sortedData.map((item) => item.division);

    const xAxis = {
      type: "category",
      data: divisionList,
      name: "Division",
      axisLabel: {
        rotate: 45, // Rotate labels if there are many divisions
      },
    };

    const yAxis = {
      type: "value",
      name: "Average Rating",
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        formatter: "{value}",
      },
    };

    const avgRatings = sortedData.map((item) => item.avg_rating);

    const series = [
      {
        name: "Average Rating",
        data: avgRatings,
        type: "bar",
        itemStyle: {
          color: "#5470c6",
        },
      },
    ];

    const tooltip = {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const dataIndex = params[0].dataIndex;
        const item = sortedData[dataIndex];
        return (
          `<strong>${item.division}</strong><br/>` +
          `Average Rating: ${item.avg_rating}<br/>` +
          `Total Players: ${item.player_count.toLocaleString()}`
        );
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}

export function renderDiffRating(continualId) {
  getContinualEventsDiffRating(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No rating difference data available");
      return;
    }

    const title = {
      text:
        "Difference in Rating " +
        data[0].year +
        " - " +
        data[data.length - 1].year,
    };

    const legend = {
      data: ["Average Rating Difference"],
    };

    const yearList = data.map((event) => {
      return event.year;
    });

    const xAxis = {
      data: yearList,
      name: "Year",
    };

    const yAxis = {
      type: "value",
      name: "Average Rating Difference",
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        formatter: "{value}",
      },
    };

    const ratingDifferences = data.map((event) => {
      return event.avg_diff_rating;
    });

    const series = [
      {
        name: "Average Rating Difference",
        data: ratingDifferences,
        type: "line",
      },
    ];

    const tooltip = {
      trigger: "axis",
      axisPointer: {},
      formatter: null,
      valueFormatter: (value) => {
        if (value === null || value === undefined) {
          return "-";
        }
        return value.toFixed(2) + " points";
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}


export function renderFieldSizeBoxplot(pastEventsList) {

  const vizDiv = document.getElementById("viz");
  // Calculate statistics
  const fieldSizes = pastEventsList
    .map(event => event.players_count)
    .filter(count => count !== "N/A" && !isNaN(count))
    .map(count => Number(count));

  if (fieldSizes.length === 0) {

    vizDiv.innerHTML = "<p style='text-align: center; padding: 20px;'>No field size data available</p>";
    return;
  }

  // Calculate statistics
  const sortedSizes = [...fieldSizes].sort((a, b) => a - b);
  const minFieldSize = sortedSizes[0];
  const maxFieldSize = sortedSizes[sortedSizes.length - 1];
  const avgFieldSize = (fieldSizes.reduce((a, b) => a + b, 0) / fieldSizes.length).toFixed(1);

  // Calculate quartiles
  const q1Index = Math.floor(sortedSizes.length * 0.25);
  const q2Index = Math.floor(sortedSizes.length * 0.5);
  const q3Index = Math.floor(sortedSizes.length * 0.75);

  const q1 = sortedSizes[q1Index];
  const median = sortedSizes[q2Index];
  const q3 = sortedSizes[q3Index];

  const title = {
    text: "Field Size Distribution",
    left: "center",
  };

  const legend = {
    show: false,
  };

  const xAxis = {
    type: "value",
    min: 0,
    max: maxFieldSize + (maxFieldSize - minFieldSize) * 0.1,
    name: "Number of Players",
    nameLocation: "middle",
    nameGap: 30,
    axisLabel: {
      formatter: "{value}",
    },
  };

  const yAxis = {
    type: "category",
    data: ["Field Size Range"],
    axisLabel: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLine: {
      show: false,
    },
  };
  
  
  const series = [
    // Full range bar (min to max)
    
    // Q1 marker
    {
      name: "Q1",
      type: "scatter",
      data: [[q1]],
      symbolSize: 15,
      itemStyle: {
        color: "#5470c6",
        borderColor: "#2c4a8f",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "Q1: {c}",
        position: "top",
        fontSize: 11,
        fontWeight: "bold",
      },
      z: 3,
    },
    // Median marker
    {
      name: "Median",
      type: "scatter",
      data: [[median]],
      symbolSize: 18,
      symbol: "diamond",
      itemStyle: {
        color: "#91cc75",
        borderColor: "#5a8a4a",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "Median: {c}",
        position: "bottom",
        distance: 12,
        fontSize: 11,
        fontWeight: "bold",
      },
      z: 3,
    },
    // Q3 marker
    {
      name: "Q3",
      type: "scatter",
      data: [[q3]],
      symbolSize: 15,
      symbol: "roundRect",
      itemStyle: {
        color: "#5470c6",
        borderColor: "#2c4a8f",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "Q3: {c}",
        position: "top",
        distance: 12,
        fontSize: 11,
        fontWeight: "bold",
      },
      z: 3,
    },
    // Min marker
    {
      name: "Minimum",
      type: "scatter",
      data: [[minFieldSize]],
      symbolSize: 12,
      symbol: "rect",
      itemStyle: {
        color: "#ee6666",
        borderColor: "#b84444",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "Min: {c}",
        position: "bottom",
        distance: 12,
        fontSize: 10,
      },
      z: 3,
    },
    // Max marker
    {
      name: "Maximum",
      type: "scatter",
      data: [[maxFieldSize]],
      symbolSize: 12,
      symbol: "triangle",
      itemStyle: {
        color: "#ee6666",
        borderColor: "#b84444",
        borderWidth: 2,
      },
      label: {
        show: true,
        formatter: "Max: {c}",
        position: "bottom",
        distance: 12,
        fontSize: 10,
      },
      z: 3,
    },
  ];

  const tooltip = {
    trigger: "item",
    formatter: function (params) {
      if (params.seriesName === "Range" || params.seriesName === "Offset") {
        return `Range: ${minFieldSize} - ${maxFieldSize} players`;
      }
      return `${params.seriesName}: ${params.value[0]} players`;
    },
  };

  // Use createChart like the other visualizations
  createChart(title, legend, xAxis, yAxis, series, tooltip);


  vizDiv.appendChild(summaryDiv);
}



export function renderHighestRoundRating(continualId) {
  getContinualEventsHighestRoundRating(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No highest round rating data available");
      return;
    }

    const sortedData = [...data].sort((a, b) => a.year - b.year);

    const title = {
      text: "Highest Round Ratings",
    };

    const legend = {
      data: ["Highest Round Rating"],
    };

    const yearList = sortedData.map((event) => event.year);

    const xAxis = {
      type: "category",
      data: yearList,
      name: "Year",
      axisLabel: {
        rotate: 45,
      },
    };

    const yAxis = {
      type: "value",
      name: "Round Rating",
      nameLocation: "middle",
      nameGap: 50,
      min: 800,
      max: 1100,
      axisLabel: {
        formatter: "{value}",
      },
    };

    const highestRatings = sortedData.map(event => Number(event.highest_round_rating));


    const series = [
      {
        name: "Highest Round Rating",
        data: highestRatings,
        type: "bar",
        itemStyle: {
          color: "#ee6666",
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}",
          fontSize: 10,
        },
      },
    ];

    const tooltip = {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const dataIndex = params[0].dataIndex;
        const item = sortedData[dataIndex];
        return (
          `<strong>${item.year}</strong><br/>` +
          `Highest Round Rating: ${item.highest_round_rating}`
        );
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}



export function renderTop5DivisionsRating(continualId) {
  getContinualEventsTop5DivisionsRating(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No top 5 divisions rating data available");
      return;
    }

    // Get unique years and divisions
    const years = [...new Set(data.map(item => item.year))].sort((a, b) => a - b);
    const divisions = [...new Set(data.map(item => item.division))];

    // Sort divisions using custom order
    const sortedDivisions = divisions.sort((a, b) => {
      const indexA = customDivisionOrder.indexOf(a);
      const indexB = customDivisionOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const title = {
      text: "Average Event Rating - Top 5 Divisions",
      subtext: "Comparing rating trends across most popular divisions",
      left: "center",
      top: 20,
      textStyle: {
        fontSize: 18,
      },
    };

    const legend = {
      data: sortedDivisions,
      bottom: 10,
      left: "center",
    };

    const xAxis = {
      type: "category",
      data: years,
      name: "Year",
      nameLocation: "middle",
      nameGap: 35,
      axisLabel: {
        rotate: 0,
        margin: 10,
      },
    };

    const yAxis = {
      type: "value",
      name: "Average Event Rating",
      nameLocation: "middle",
      nameGap: 60,
      min: 500,
      nameTextStyle: {
        padding: [0, 0, 0, 0],
      },
      axisLabel: {
        formatter: "{value}",
        margin: 10,
      },
    };

    // Create series for each division
    const series = sortedDivisions.map(division => {
      const divisionData = years.map(year => {
        const dataPoint = data.find(
          item => item.year === year && item.division === division
        );
        return dataPoint ? dataPoint.avg_rating : null;
      });

      return {
        name: division,
        type: "line",
        data: divisionData,
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        connectNulls: false, // Don't connect lines across missing data
      };
    });

    const tooltip = {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: function (params) {
        let result = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach(param => {
          if (param.value !== null && param.value !== undefined) {
            const dataPoint = data.find(
              item => item.year === param.axisValue && item.division === param.seriesName
            );
            result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
            if (dataPoint) {
              result += `&nbsp;&nbsp;&nbsp;&nbsp;Players: ${dataPoint.player_count.toLocaleString()}<br/>`;
            }
          }
        });
        return result;
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}