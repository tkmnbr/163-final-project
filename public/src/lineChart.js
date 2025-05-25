import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Draws a line chart showing offender count trends.
 * @param {string} selector - CSS selector for the SVG element.
 */
export async function drawLineChart(selector) {
  // Load the CSV data containing offender sex trends
  const data = await d3.csv("processed/offender_sex_trends.csv", d => ({
    year : d3.timeParse("%Y")(d.year),      
    count: +d.total_offender_count          
  }));

  // Configure SVG dimensions and margins
  const svg = d3.select(selector);
  const margin = { top: 50, right: 30, bottom: 50, left: 80 };
  const width  = +svg.attr("width")  - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top  - margin.bottom;

  // Add a chart title
  svg.append("text")
     .attr("x", margin.left + width / 2)
     .attr("y", margin.top / 2)
     .attr("text-anchor", "middle")
     .attr("font-size", "20px")
     .text("Offender Count Trends (2010–2023)");

  // Create a group element for margins
  const g = svg.append("g")
               .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales for x and y axes
  const x = d3.scaleTime()
              .domain(d3.extent(data, d => d.year))
              .range([0, width]);
  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.count)]).nice()
              .range([height, 0]);

  // Add x-axis to the chart
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.timeFormat("%Y")))
   .selectAll("text")
     .attr("text-anchor", "end")
     .attr("transform", "rotate(-45)");

  // Add y-axis to the chart
  g.append("g")
   .call(d3.axisLeft(y));

  // Add x-axis label
  g.append("text")
   .attr("x", width / 2)
   .attr("y", height + margin.bottom - 5)
   .attr("text-anchor", "middle")
   .attr("font-size", "12px")
   .text("Year");

  // Add y-axis label (rotated)
  g.append("text")
   .attr("transform", `translate(${-margin.left + 20},${height/2}) rotate(-90)`)
   .attr("text-anchor", "middle")
   .attr("font-size", "12px")
   .text("Offender Count");

  // Generate and draw the line path
  const line = d3.line()
                 .x(d => x(d.year))
                 .y(d => y(d.count));

  g.append("path")
   .datum(data)
   .attr("fill", "none")
   .attr("stroke", "steelblue")
   .attr("stroke-width", 2)
   .attr("d", line);
}
