import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Draws a bar chart (histogram) for a single year's total offender count,
 * using a fixed y-axis max across all years (2010–2023).
 * @param {string} selector     - CSS selector for the SVG element
 * @param {number} yearFilter   - Year to display (e.g., 2013)
 */
export async function drawBarChart(selector, yearFilter) {
  // Load the CSV containing national offender trends
  // Assume `public/processed/offender_trends.csv` has columns: year,total_offender_count
  const raw = await d3.csv("processed/offender_sex_trends.csv", d => ({
    year: +d.year,
    count: +d.total_offender_count
  }));

  // Compute the global maximum across all years for a fixed y-axis top
  const globalMax = d3.max(raw, d => d.count);

  // Find the record for the specified year
  const record = raw.find(d => d.year === yearFilter);
  if (!record) {
    // If no data for that year, clear SVG and show a message
    const svgEmpty = d3.select(selector);
    svgEmpty.selectAll("*").remove();
    svgEmpty.append("text")
            .attr("x", +svgEmpty.attr("width") / 2)
            .attr("y", +svgEmpty.attr("height") / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .text(`No data for year ${yearFilter}`);
    return;
  }

  // Prepare a single data point with one category (the year)
  const categories = [
    { category: String(record.year), value: record.count }
  ];

  // Setup SVG dimensions and margins
  const svg = d3.select(selector);
  const margin = { top: 50, right: 30, bottom: 50, left: 80 };
  const width  = +svg.attr("width")  - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top  - margin.bottom;

  // Clear any previous content
  svg.selectAll("*").remove();

  // Add title to the chart
  svg.append("text")
     .attr("x", margin.left + width / 2)
     .attr("y", margin.top / 2)
     .attr("text-anchor", "middle")
     .attr("font-size", "20px")
     .text(`Offender Count (${yearFilter})`);

  // Create a group for the drawing area
  const g = svg.append("g")
               .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define X-scale as a band scale (categorical with one bar)
  const x = d3.scaleBand()
              .domain(categories.map(d => d.category))
              .range([0, width])
              .padding(0.4);

  // Define Y-scale from 0 up to globalMax (fixed, not per-year)
  const y = d3.scaleLinear()
              .domain([0, globalMax]).nice()
              .range([height, 0]);

  // Draw the single bar
  g.selectAll(".bar")
   .data(categories)
   .join("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.category))
     .attr("y", d => y(d.value))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.value))
     .attr("fill", "steelblue");

  // Draw X-axis with one tick
  g.append("g")
   .attr("transform", `translate(0,${height})`)
   .call(d3.axisBottom(x))
   .selectAll("text")
     .attr("text-anchor", "middle");

  // Draw Y-axis with horizontal grid lines (up to globalMax)
  g.append("g")
   .call(
     d3.axisLeft(y)
       .tickSize(-width)      
       .tickPadding(10)
   )
   .selectAll(".tick line")
     .attr("stroke-opacity", 0.2);  

  // Add Y-axis label
  g.append("text")
   .attr("transform", `translate(${-margin.left + 20},${height / 2}) rotate(-90)`)
   .attr("text-anchor", "middle")
   .attr("font-size", "12px")
   .text("Count");
}
