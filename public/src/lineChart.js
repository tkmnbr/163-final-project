import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Draws a line chart of offender/victim counts.
 * @param {string} selector - CSS selector for the SVG element
 * @param {number} yearFilter - specific year to highlight (optional)
 * @param {string} stateFilter - specific state code to filter data (optional)
 * @param {string} type - either "offender" or "victim" (default: "offender")
 */
export async function drawLineChart(selector, yearFilter = null, stateFilter = null, type = "offender") {
  // Load CSV corresponding to type
  const fileName = type === "victim"
    ? "processed/victim_sex_trends.csv"
    : "processed/offender_sex_trends.csv";

  const raw = await d3.csv(fileName, d => ({
    year: +d.year,
    count: +d.total_offender_count  
  }));

  // If a specific yearFilter is provided, filter the data
  let data = raw;
  if (yearFilter !== null) {
    data = raw.filter(d => d.year === yearFilter);
  }

  // Convert year to Date object for D3 scale
  data = data.map(d => ({ year: d3.timeParse("%Y")(String(d.year)), count: d.count }));

  // Setup SVG and margins
  const svg = d3.select(selector);
  const margin = { top: 70, right: -5, bottom: 10, left: 100 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  // Add subtitle
  svg.append("text")
     .attr("x", margin.left + width / 2.3)
     .attr("y", margin.top / 2)
     .attr("text-anchor", "middle")
     .attr("font-size", "10px")
     .text(type === "victim" ? "Victim Count Trends" : "Offender Count Trends");

  // Create group for drawing area
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales
  const x = d3.scaleTime().domain(d3.extent(data, d => d.year)).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

  // Draw axes
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")))
   .selectAll("text")
     .attr("text-anchor", "end")
     .attr("transform", "rotate(-45)");
  g.append("g").call(d3.axisLeft(y));

  // Axis labels
  g.append("text")
   .attr("x", width/2)
   .attr("y", height + margin.bottom - 5)
   .attr("text-anchor", "middle")
   .attr("font-size", "10px")
   .text("Year");
  g.append("text")
   .attr("transform", `translate(${-margin.left + 20},${height/2}) rotate(-90)`)
   .attr("text-anchor", "middle")
   .attr("font-size", "10px")
   .text(type === "victim" ? "Victim Count" : "Offender Count");

  // Draw line
  // Draw line
const line = d3.line().x(d => x(d.year)).y(d => y(d.count));

// adding the animation 
const path = g.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "red")
  .attr("stroke-width", 2.5)
  .attr("d", line);
const totalLength = path.node().getTotalLength();

function repeatAnimation() {
  path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0)
    .on("end", repeatAnimation);  // When done, restart animation
}
repeatAnimation();

  // This is for invisible circles for tooltip interaction.
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.count))
    .attr("r", 10)
    .attr("fill", "transparent")
    .attr("stroke", "none")
    .style("pointer-events", "all")
    .attr("data-tooltip", d => `Year: ${d3.timeFormat("%Y")(d.year)}, Count: ${d.count}`);
}
