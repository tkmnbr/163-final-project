import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { drawLineChart } from "./lineChart.js";
import { drawBarChart }   from "./barChart.js";
import ParallelCoordinates from "./parallelCoords.js";
import { drawSankeyDiagram }  from "./sankeyDiagram.js";
/***********************************************************
 * SANKY DIAGRAM
 ***********************************************************/
const sankeyData = {
  nodes: [
    { id: "Knife" },
    { id: "Gun" },
    { id: "Male" },
    { id: "Female" },
    { id: "Arrested" },
    { id: "Not Arrested" }
  ],
  links: [
    { source: "Knife", target: "Male", value: 30 },
    { source: "Knife", target: "Female", value: 20 },
    { source: "Gun", target: "Male", value: 50 },
    { source: "Gun", target: "Female", value: 10 },
    { source: "Male", target: "Arrested", value: 60 },
    { source: "Male", target: "Not Arrested", value: 20 },
    { source: "Female", target: "Arrested", value: 25 },
    { source: "Female", target: "Not Arrested", value: 5 }
  ]
};
/*************************************************************/
// main.js

// =======================================
// Scene switching utility
// =======================================
const sceneIds = ["scene1", "scene2", "scene3", "scene4"];
let currentSceneIndex = 0;

function showScene(index) {
  if (index < 0 || index >= sceneIds.length) return;
  sceneIds.forEach((id, i) => {
    const section = document.getElementById(id);
    if (i === index) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }
  });
  currentSceneIndex = index;
}

// =======================================
// Scene1, Scene2, Scene3 initializers
// =======================================
function initScene1() {
  // This uses the existing drawLineChart in lineChart.js
  drawLineChart("#line-chart");
}

export async function initScene2() {
  // Create and initialize the ParallelCoordinates chart
  const pc = new ParallelCoordinates("parallel-coords");
  await pc.initialize();
}

function initScene3() {
  drawSankeyDiagram("#sankey-diagram", sankeyData);
}

// =======================================
// Explore Mode (Scene4) in main.js
//   - Uses estimated_crimes_1979_2023.csv only
//   - Aggregates “aggravated_assault” for all states when “All” is selected
// =======================================

/**
 * initScene4():
 *   1. Populates “Start Year” and “End Year” (2010–2023).
 *   2. Reads unique state abbreviations from estimated_crimes_1979_2023.csv → populates “State” dropdown.
 *   3. Attaches “change” listeners to all three selects.
 *   4. Calls updateExploreVis() once for the default view.
 */
async function initScene4() {
  // 1) Define the set of years (2010–2023 inclusive)
  const years = d3.range(2010, 2024);

  // 2) Populate <select id="explore-start-year">
  const startYearSelect = d3.select("#explore-start-year");
  startYearSelect
    .selectAll("option")
    .data(years)
    .join("option")
      .attr("value", d => d)
      .text(d => d);
  startYearSelect.property("value", 2010); // default to 2010

  // 3) Populate <select id="explore-end-year">
  const endYearSelect = d3.select("#explore-end-year");
  endYearSelect
    .selectAll("option")
    .data(years)
    .join("option")
      .attr("value", d => d)
      .text(d => d);
  endYearSelect.property("value", 2023); // default to 2023

  // 4) Read estimated_crimes_1979_2023.csv and extract unique states
  const rawForStates = await d3.csv("processed/estimated_crimes_1979_2023.csv", d => d.state_abbr);
  // rawForStates is an array of state_abbr strings (with duplicates)
  const uniqueStates = Array.from(new Set(rawForStates.filter(d => d))).sort();
  // Prepend an “All” option (empty string means “All”)
  const stateSelect = d3.select("#explore-state");
  stateSelect
    .selectAll("option")
    .data([""].concat(uniqueStates))
    .join("option")
      .attr("value", d => d)
      .text(d => d === "" ? "All" : d);
  stateSelect.property("value", ""); // default to “All”

  // 5) Attach change listeners to all three dropdowns
  startYearSelect.on("change", updateExploreVis);
  endYearSelect.on("change",   updateExploreVis);
  stateSelect.on("change",     updateExploreVis);

  // 6) Initial render
  updateExploreVis();
}

/**
 * updateExploreVis():
 *   - Reads “Start Year” / “End Year” / “State” from dropdowns.
 *   - Loads estimated_crimes_1979_2023.csv, parses “aggravated_assault”.
 *   - Filters by year-range and (if not “All”) by state.
 *   - Aggregates “aggravated_assault” per year if “All”.
 *   - Sends final [ { year: Date, count: Number } ] → drawExploreLine().
 */
function updateExploreVis() {
  // 1) Read selected values
  let fromYear = +document.getElementById("explore-start-year").value;
  let toYear   = +document.getElementById("explore-end-year").value;
  const selectedState = document.getElementById("explore-state").value; 
    // "" → “All”, otherwise a state_abbr like "CA", "NY"

  // 2) Swap if invalid range
  if (fromYear > toYear) {
    [fromYear, toYear] = [toYear, fromYear];
  }

  // 3) Clear the drawing area
  d3.select("#explore-chart").selectAll("*").remove();

  // 4) Load the CSV and process
  d3.csv("processed/estimated_crimes_1979_2023.csv", d => ({
      year:             +d.year,
      state:            d.state_abbr,           // e.g. "CA"
      aggravated_assault: +d.aggravated_assault  // the column we care about
    }))
    .then(rawData => {
      // 5) Filter by year range first
      const inRange = rawData.filter(d => d.year >= fromYear && d.year <= toYear);

      let aggregatedByYear;
      if (selectedState === "") {
        // Case “All”: group by year, sum across all states
        const rollupMap = d3.rollup(
          inRange,
          v => d3.sum(v, d => d.aggravated_assault),
          d => d.year
        );
        aggregatedByYear = Array.from(rollupMap, ([year, sum]) => ({ year, count: sum }));
      } else {
        // Case “single state”: filter to that state, then still group by year
        const onlyThisState = inRange.filter(d => d.state === selectedState);
        const rollupMap = d3.rollup(
          onlyThisState,
          v => d3.sum(v, d => d.aggravated_assault),
          d => d.year
        );
        aggregatedByYear = Array.from(rollupMap, ([year, sum]) => ({ year, count: sum }));
      }

      // 6) Sort by year ascending
      aggregatedByYear.sort((a, b) => a.year - b.year);

      // 7) Convert to [{ year: Date, count: Number }, … ]
      const chartData = aggregatedByYear.map(d => ({
        year:  d3.timeParse("%Y")(String(d.year)),
        count: d.count
      }));

      // 8) Draw the line (or “No data” if empty)
      drawExploreLine(chartData);
    })
    .catch(error => {
      console.error("Error loading estimated_crimes_1979_2023.csv:", error);
      drawExploreLine([]); // show “No data for this selection”
    });
}

/**
 * drawExploreLine(data):
 *   - Draws a line chart in the SVG "#explore-chart"
 *   - data: array of { year: Date, count: Number }, sorted by year ascending
 *   - Adjusted margins to avoid overlapping axis labels/ticks.
 *   - Adds a title: "Aggravated Assault Count Trend"
 */
function drawExploreLine(data) {
  // 1) Grab the SVG itself and read its width/height attributes
  const svg = d3.select("#explore-chart");
  const width  = +svg.attr("width");
  const height = +svg.attr("height");

  // 2) Define margins to avoid label/tick overlap
  const margin = { top: 50, right: 30, bottom: 70, left: 80 };
  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // ──────────────────────────────────────────────────────────────────────────────
  // title
  // ──────────────────────────────────────────────────────────────────────────────
  svg.selectAll("text.chart-title").remove(); // (optional) clear any existing title
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)                  // center horizontally
    .attr("y", margin.top / 2)             // halfway down the top margin
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", "yellow")
    .text("Aggravated Assault Count Trend");
  // ──────────────────────────────────────────────────────────────────────────────

  // this Creating a <g> group shifted by the new margins
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  if (!data || data.length === 0) {
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text("No data for this selection");
    return;
  }

  //this Define x and y scales based on filtered data
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.year))
    .range([0, innerWidth]);

  const yMax = d3.max(data, d => d.count);
  const yScale = d3.scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([innerHeight, 0]);

  // Draws X axis at bottom of inner drawing area
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%Y"))
    )
    .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("fill", "yellow")
      .attr("font-size", "10px");

  //Draws Y axis on the left
  g.append("g")
    .call(
      d3.axisLeft(yScale)
        .tickFormat(d3.format(","))
    )
    .selectAll("text")
      .attr("fill", "yellow")
      .attr("font-size", "10px");

  // Y axis label (“Offender Count”) above left axis, with extra offset
  g.append("text")
    .attr("transform", `translate(${-margin.left + 20},${innerHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "yellow")
    .text("Offender Count");

  // this is for  X axis label (“Year”) below the ticks, centered
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "yellow")
    .text("Year");

  // this Draw the magenta line connecting all points
  const lineGen = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.count));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "magenta")
    .attr("stroke-width", 2)
    .attr("d", lineGen);

  // this Draw circles at each data point.
  g.selectAll(".dot")
    .data(data)
    .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.count))
      .attr("r", 6)
      .attr("fill", "transparent")
      .style("pointer-events", "all")
      .attr("data-tooltip", d => `Year: ${d3.timeFormat("%Y")(d.year)}, Count: ${d.count}`);

  // Finally, attach tooltip behavior to all those circles:
  d3.selectAll("#explore-chart circle[data-tooltip]")
    .on("mouseover", (event, d) => {
      // Create or select the tooltip DIV
      const existing = d3.select("body").selectAll(".tooltip").nodes();
      const tt = existing.length
               ? d3.select("body").select(".tooltip")
               : d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("pointer-events", "none")
                    .style("opacity", 0);

      // this Override display:none if needed
      tt.style("display", "block");

      // this Set the HTML content & position
      const htmlText = d3.select(event.currentTarget).attr("data-tooltip");
      tt.html(htmlText)
        .style("left",  (event.pageX + 12) + "px")
        .style("top",   (event.pageY +  5) + "px")
        .transition()
          .duration(150)
          .style("opacity", 1);
    })
    .on("mouseout", (event, d) => {
      const tt = d3.select("body").select(".tooltip");
      if (!tt.empty()) {
        tt.transition()
          .duration(150)
          .style("opacity", 0)
          .on("end", () => tt.style("display", "none"));
      }
    });
}

// =======================================
// Button listeners for Scene navigation
// =======================================
document.getElementById("btn-next-1").addEventListener("click", () => {
  showScene(1);
  initScene2();
});
document.getElementById("btn-prev-2").addEventListener("click", () => {
  showScene(0);
});
document.getElementById("btn-next-2").addEventListener("click", () => {
  showScene(2);
  initScene3();
});
document.getElementById("btn-prev-3").addEventListener("click", () => {
  showScene(1);
});
document.getElementById("btn-next-3").addEventListener("click", () => {
  showScene(3);
  initScene4();
});
document.getElementById("btn-prev-4").addEventListener("click", () => {
  showScene(2);
  main();
});

// =======================================
// main(): entry point
// =======================================
export function main() {
  showScene(0);   // Display Scene1 initially
  initScene1();   // Draw Scene1 chart
}

main();

// Tooltip logic for SVG elements with data-tooltip
const tooltip = document.getElementById('tooltip');

document.querySelectorAll('svg').forEach(svg => {
  svg.addEventListener('mousemove', function(e) {
    // This will show tooltip if hovering a chart element with data-tooltip
    if (e.target && e.target.hasAttribute('data-tooltip')) {
      tooltip.style.display = 'block';
      tooltip.style.left = (e.pageX + 15) + 'px';
      tooltip.style.top = (e.pageY - 10) + 'px';
      tooltip.textContent = e.target.getAttribute('data-tooltip');
    } else {
      tooltip.style.display = 'none';
    }
  });
  svg.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
  });
});

/********************************************************************
 * This is addTooltip function is to add a tooltip to any SVG selection.
 * This addTooltip(element, "Your tooltip text")
 **********************************************************************/
export function addTooltip(element, text) {
  // For D3 selection
  if (typeof element.attr === "function") {
    element.attr("data-tooltip", text);
  } else {
    // For DOM node
    element.setAttribute("data-tooltip", text);
  }
}
