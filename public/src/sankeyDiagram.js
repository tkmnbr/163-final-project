// Importing the D3 and the d3-sankey plugin from a CDN
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";

/**************************************************************************************************
 * This function draws a Sankey diagram in the specified SVG element.
 * @param {string} selector - CSS selector for the SVG element in sanky diagram.
 * @param {object} data - Sankey data with 'nodes' and 'links'.
 * nodes: [{id: "Knife"}, {id: "Male"}, ...]
 * links: [{source: "Knife", target: "Male", value: 30}, ...]
 ***************************************************************************************************/
export function drawSankeyDiagram(selector, data) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Assigning the color to each node, stored as node.color. This will allow to color links by their source node
  data.nodes.forEach(node => {
    node.color = color(node.id);
  });
/**************************************************************************************************
  // This Set up the Sankey layout generator
  // nodeWidth: width of each node rectangle
  // nodePadding: vertical space between nodes
  // extent: chart area ([top-left], [bottom-right])
  // nodeId: function to get each node's unique id
**************************************************************************************************/
  const sankeyGen = sankey()
    .nodeWidth(24)
    .nodePadding(20)
    .extent([[1, 1], [width - 1, height - 6]])
    .nodeId(d => d.id);
  const sankeyData = sankeyGen({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d }))
  });

  // This Draw the links (flows) as SVG paths. Each link is colored by its source node's color.The width of each path is proportional to its value
  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
      .attr("d", sankeyLinkHorizontal()) // Generates the curved path
      .attr("stroke", d => d.source.color) // Color by source node
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke-opacity", 0.5); // Slight transparency for overlap
  const node = svg.append("g")
    .selectAll("g")
    .data(sankeyData.nodes)
    .join("g");
  node.append("rect")
    .attr("x", d => d.x0) // Left edge
    .attr("y", d => d.y0) // Top edge
    .attr("height", d => d.y1 - d.y0) // Height of node
    .attr("width", d => d.x1 - d.x0) // Width of node
    .attr("fill", d => d.color) // Node color
    .attr("stroke", "   #363"); // Node border
  // This Add node labels (text). Position labels to the left or right of the node depending on its side
  node.append("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6) // Right or left of node
    .attr("y", d => (d.y1 + d.y0) / 2) // Vertically centered
    .attr("dy", "0.35em") // Vertical text alignment
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end") // Anchor text
    .text(d => d.id); // Node label
}
