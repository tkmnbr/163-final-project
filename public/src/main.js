import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { drawLineChart } from "./lineChart.js";
import { drawBarChart }   from "./barChart.js";
import { drawParallelCoords } from "./parallelCoords.js";
import { drawSankeyDiagram }  from "./sankeyDiagram.js";


drawLineChart("#line-chart");


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
drawSankeyDiagram("#sankey-diagram", sankeyData);
/*************************************************************/



// Initialize Explore Mode: populate dropdowns and attach event listeners.
export async function initExploreMode() {
  // Populate year dropdown (allow "All" plus 2010–2023)
  const yearSelect = d3.select("#explore-year");
  const years = [""].concat(d3.range(2010, 2024)); // "" => All
  yearSelect
    .selectAll("option")
    .data(years)
    .join("option")
      .attr("value", d => d)
      .text(d => (d === "" ? "All" : d));

  // Populate state dropdown from a static CSV that contains state codes
  const stateList = await d3.csv("processed/state_list.csv", d => d.state);
  const stateSelect = d3.select("#explore-state");
  stateSelect
    .selectAll("option")
    .data([""].concat(stateList)) // "" => All
    .join("option")
      .attr("value", d => d)
      .text(d => (d === "" ? "All" : d));

  // Attach change listeners
  yearSelect.on("change", updateExploreVis);
  stateSelect.on("change", updateExploreVis);
  d3.select("#explore-metric").on("change", updateExploreVis);

  // Initial render
  updateExploreVis();
}


// Reads current filter values and renders the appropriate chart.
async function updateExploreVis() {
  // Get selected values
  const selectedYear   = d3.select("#explore-year").node().value;    
  const selectedState  = d3.select("#explore-state").node().value;   
  const selectedMetric = d3.select("#explore-metric").node().value;  

  // Clear existing contents of the Explore-mode SVG
  d3.select("#explore-chart").selectAll("*").remove();

  // Offender / Victim Sex Logic
  if (selectedMetric === "offender_sex" || selectedMetric === "victim_sex") {
    // If a specific year is selected (not "All"), draw bar chart
    if (selectedYear !== "") {
      const type = (selectedMetric === "victim_sex") ? "victim" : "offender";
      drawBarChart("#explore-chart", +selectedYear, type);
    }
    // If "All" is selected, draw full trend line
    else {
      drawLineChart("#explore-chart", null);
    }
    return;
  }

  // State Metrics (Parallel Coordinates)
  if (selectedMetric === "state_metrics") {
    const data = await d3.csv("processed/state_metrics.csv", d => ({
      state: d.state,
      year: +d.year,
      offender_count: +d.offender_count,
      victim_count: +d.victim_count,
      arrest_rate: +d.arrest_rate
    }));

    let filtered = data;
    if (selectedState !== "") {
      filtered = filtered.filter(d => d.state === selectedState);
    }
    if (selectedYear !== "") {
      filtered = filtered.filter(d => d.year === +selectedYear);
    }

    drawParallelCoords("#explore-chart", filtered);
    return;
  }

  // Weapon → Gender → Arrest (Sankey Diagram)
  if (selectedMetric === "weapon_gender_arrest") {
    const allData = await d3.json("processed/weapon_gender_arrest.json");
    const yearKey = (selectedYear === "") ? "2023" : selectedYear;
    const yearData = allData[String(yearKey)];
    drawSankeyDiagram("#explore-chart", yearData);
    return;
  }
}

/**
 * Entry point for the application.
 * Draws Scenes 1–3, then initializes Explore Mode.
 */
export function main() {
  

  initExploreMode();
}

main();