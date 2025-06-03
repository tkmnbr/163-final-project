// public/src/parallelCoords.js
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

/**
 * Draws a parallel coordinates plot. Currently a stub that clears the SVG
 * and writes a placeholder message.
 * @param {string} selector - CSS selector for the SVG element
 * @param {Array} data - Filtered data array (state/year) to visualize
 */
export function drawParallelCoords(selector, data) {
  // Clear SVG and display placeholder text
  const svg = d3.select(selector);
  svg.selectAll("*").remove();

  svg.append("text")
     .attr("x", +svg.attr("width") / 2)
     .attr("y", +svg.attr("height") / 2)
     .attr("text-anchor", "middle")
     .attr("font-size", "16px")
     .text("Parallel Coordinates Plot (stub)");
}
