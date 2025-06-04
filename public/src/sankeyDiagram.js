// ──────────────────────────────────────────────────────────────────────────
// parallelSankey.js (or whatever file you keep your Sankey code in)
// ──────────────────────────────────────────────────────────────────────────

// Import D3 + d3‐sankey as before
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";

/**
 * Draws a Sankey diagram in the specified SVG element,
 * and attaches hover tooltips to each link and each node.
 *
 * @param {string} selector - CSS selector for the <svg> (e.g. "#sankey-diagram")
 * @param {object} data - Sankey data with keys:
 *    data.nodes: [{id:"Knife"}, {id:"Male"}, …]
 *    data.links: [{ source:"Knife", target:"Male", value:30 }, …]
 */
export function drawSankeyDiagram(selector, data) {
  // ────────────────────────────────────────────────────────────────────────
  // 1) Select the SVG and clear out old contents
  // ────────────────────────────────────────────────────────────────────────
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Color scale for nodes
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  data.nodes.forEach(node => {
    node.color = color(node.id);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2) Build Sankey layout
  // ────────────────────────────────────────────────────────────────────────
  const sankeyGen = sankey()
    .nodeWidth(24)
    .nodePadding(20)
    .extent([[1, 1], [width - 1, height - 6]])
    .nodeId(d => d.id);

  // Clone nodes/links so D3 can attach x0,x1,y0,y1,width, etc.
  const sankeyData = sankeyGen({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d }))
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3) Draw the semi‐transparent flow links
  // ────────────────────────────────────────────────────────────────────────
  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => d.source.color)
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("stroke-opacity", 0.4);

  // ────────────────────────────────────────────────────────────────────────
  // 4) Draw invisible, wider paths on top of the real links for hover‐area
  // ────────────────────────────────────────────────────────────────────────
  svg.append("g")
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", "transparent")
      .attr("stroke-width", d => Math.max(12, d.width + 8)) // wide hover area
      .attr("fill", "none")
      .style("pointer-events", "all")
      .attr("data-tooltip", d =>
        `Source: ${d.source.id}\nTarget: ${d.target.id}\nValue: ${d.value}`
      );

  // ────────────────────────────────────────────────────────────────────────
  // 5) Draw the solid node rectangles
  // ────────────────────────────────────────────────────────────────────────
  const node = svg.append("g")
    .selectAll("g")
    .data(sankeyData.nodes)
    .join("g");

  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => d.color)
    .attr("stroke", "#333");

  // ────────────────────────────────────────────────────────────────────────
  // 6) Draw invisible, overlaying rects on nodes for hover‐area
  // ────────────────────────────────────────────────────────────────────────
  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .attr("data-tooltip", d => `Node: ${d.id}`);

  // ────────────────────────────────────────────────────────────────────────
  // 7) Draw node labels (text)
  // ────────────────────────────────────────────────────────────────────────
  node.append("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => (d.x0 < width / 2 ? "start" : "end"))
    .style("fill", "#ffffff")
    .style("font-size", "12px")
    .text(d => d.id);

  // ────────────────────────────────────────────────────────────────────────
  // 8) CREATE OR REUSE A SINGLE .tooltip <div> FOR ALL HOVER‐INTERACTIONS
  // ────────────────────────────────────────────────────────────────────────
  // If there’s already a tooltip, remove it so we don’t stack multiples:
  d3.select("body").selectAll(".tooltip").remove();

  // Now append a fresh .tooltip <div> (initially hidden via CSS opacity:0)
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("left", "0px")
    .style("top", "0px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // ────────────────────────────────────────────────────────────────────────
  // 9) ATTACH HOVER LISTENERS TO ALL INVISIBLE “HIT ZONES”
  //    (both for links and for nodes)
  // ────────────────────────────────────────────────────────────────────────
  // Select every element that has a `data-tooltip` attribute inside our SVG:
  svg.selectAll("[data-tooltip]")
    .on("mouseover", (event, d) => {
      // 9a) Immediately show the DIV (overriding any `display:none` in CSS)
      tooltip.style("display", "block");

      // 9b) Fill in its HTML from the data-tooltip attribute (with newlines → <br/>)
      const text = d3.select(event.currentTarget).attr("data-tooltip");
      tooltip.html(text.replace(/\n/g, "<br/>"));

      // 9c) Position it just to the right‐bottom of the mouse cursor
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top",  (event.pageY +  5) + "px");

      // 9d) Fade in the tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);

      // 9e) Optionally dim/un‐dim lines/nodes if you want, for emphasis.
      //     (Not strictly required for a tooltip to simply appear.)
    })
    .on("mouseout", (event, d) => {
      // 9f) Fade out, then hide
      tooltip.transition()
        .duration(200)
        .style("opacity", 0)
        .on("end", () => {
          tooltip.style("display", "none");
        });
    });
}
