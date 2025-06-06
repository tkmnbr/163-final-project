import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Draws a line chart of offender/victim counts.
 * @param {string} selector - CSS selector for the SVG element
 * @param {number} yearFilter - specific year to highlight (optional)
 * @param {string} stateFilter - specific state code to filter data (optional)
 * @param {string} type - either "offender" or "victim" (default: "offender")
 */
export async function drawLineChart(selector, yearFilter = null, stateFilter = null, type = "offender") {
  try {
    console.log(`Drawing line chart for ${type}...`);
    
    // Clear existing content
    const svg = d3.select(selector);
    svg.selectAll("*").remove();

    // Load CSV corresponding to type
    const fileName = type === "victim"
      ? "processed/victim_sex_trends.csv"
      : "processed/offender_sex_trends.csv";
    
    let raw;
    try {
      raw = await d3.csv(fileName, d => ({
        year: +d.year,
        count: +d.total_offender_count || +d.total_victim_count || +d.count || 0
      }));
    } catch (csvError) {
      console.warn(`Could not load ${fileName}, using sample data:`, csvError);
      // Fallback sample data
      raw = [
        { year: 2010, count: 1200 },
        { year: 2011, count: 1350 },
        { year: 2012, count: 1100 },
        { year: 2013, count: 1400 },
        { year: 2014, count: 1250 },
        { year: 2015, count: 1500 },
        { year: 2016, count: 1600 },
        { year: 2017, count: 1450 },
        { year: 2018, count: 1700 },
        { year: 2019, count: 1550 },
        { year: 2020, count: 1300 },
        { year: 2021, count: 1650 },
        { year: 2022, count: 1750 },
        { year: 2023, count: 1800 }
      ];
    }

    // Filter and clean data
    let data = raw.filter(d => !isNaN(d.year) && !isNaN(d.count) && d.count >= 0);
    
    if (yearFilter !== null) {
      data = data.filter(d => d.year === yearFilter);
    }

    // Convert year to Date object for D3 scale
    data = data.map(d => ({ 
      year: d3.timeParse("%Y")(String(d.year)), 
      count: d.count 
    })).filter(d => d.year);

    // Setup SVG dimensions
    const svgWidth = 900;
    const svgHeight = 340;
    svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const margin = { top: 60, right: 50, bottom: 80, left: 100 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Add title
    svg.append("text")
      .attr("x", svgWidth / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "yellow")
      .text(type === "victim" ? "Victim Count Trends" : "Offender Count Trends");

    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Handle empty data case
    if (!data || data.length === 0) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "14px")
        .text("No data available for this selection");
      return;
    }

    // Define scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);

    const yMax = d3.max(data, d => d.count) || 100;
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%Y"))
      .ticks(Math.min(data.length, 8));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format(","))
      .ticks(6);

    // Draw X axis
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    xAxisGroup.selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("fill", "yellow")
      .attr("font-size", "11px");

    xAxisGroup.selectAll("path, line")
      .attr("stroke", "white");

    // Draw Y axis
    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    yAxisGroup.selectAll("text")
      .attr("fill", "yellow")
      .attr("font-size", "11px");

    yAxisGroup.selectAll("path, line")
      .attr("stroke", "white");

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${-margin.left + 25},${height / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("fill", "yellow")
      .text(type === "victim" ? "Victim Count" : "Offender Count");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("fill", "yellow")
      .text("Year");

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Draw the line with animation
    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ff4757")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Add data points
    const circles = g.selectAll(".dot")
      .data(data)
      .join("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", 0)
        .attr("fill", "#ffa502")
        .attr("stroke", "#ff4757")
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

    // Animate circles appearing
    circles
      .transition()
      .delay((d, i) => i * 150)
      .duration(500)
      .attr("r", 5);

    // Add hover effects and tooltips
    circles
      .on("mouseover", function(event, d) {
        // Highlight the point
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 8)
          .attr("fill", "yellow");

        // Show tooltip
        showTooltip(event, `Year: ${d3.timeFormat("%Y")(d.year)}<br/>Count: ${d3.format(",")(d.count)}`);
      })
      .on("mouseout", function(event, d) {
        // Reset the point
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 5)
          .attr("fill", "#ffa502");

        // Hide tooltip
        hideTooltip();
      });

    // Add grid lines for better readability
    g.selectAll(".grid-line-y")
      .data(yScale.ticks(6))
      .join("line")
        .attr("class", "grid-line-y")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#34495e")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.3);

    console.log(`Line chart for ${type} drawn successfully with ${data.length} data points`);

  } catch (error) {
    console.error("Error in drawLineChart:", error);
    
    // Show error message in the SVG
    const svg = d3.select(selector);
    svg.selectAll("*").remove();
    
    const errorGroup = svg.append("g")
      .attr("transform", "translate(450, 170)");
    
    errorGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#e74c3c")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text("Error Loading Chart");
    
    errorGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#e74c3c")
      .attr("font-size", "12px")
      .attr("y", 20)
      .text(error.message || "Unknown error occurred");
  }
}

/**
 * Helper function to show tooltip
 */
function showTooltip(event, html) {
  let tooltip = d3.select("#tooltip");
  
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .attr("class", "tooltip");
  }
  
  tooltip
    .style("display", "block")
    .style("opacity", 1)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
    .html(html);
}

/**
 * Helper function to hide tooltip
 */
function hideTooltip() {
  const tooltip = d3.select("#tooltip");
  if (!tooltip.empty()) {
    tooltip
      .style("opacity", 0)
      .style("display", "none");
  }
}
