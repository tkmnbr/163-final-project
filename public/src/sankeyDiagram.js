/*******************************************************************************************/
// Chart: parallelSankey.js
/*******************************************************************************************/

// Importing D3 and d3‐sankey
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { sankey, sankeyLinkHorizontal } from "https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm";

/***************************************************************************************
 * This function draws a Sankey diagram in the specified SVG element,
 * and attaches hover tooltips to each link and each node.
 * @param {string} selector - CSS selector for the <svg> (e.g. "#sankey-diagram")
 * @param {object} data - Sankey data with keys:
 *    data.nodes: [{id:"Knife"}, {id:"Male"}, …]
 *    data.links: [{ source:"Knife", target:"Male", value:30 }, …]
 ****************************************************************************************/
export function drawSankeyDiagram(selector, data) {
/***************************************************************************************
  It Select the SVG and clear out old contents
*******************************************************************************************/
  const svg = d3.select(selector);
  const svgWidth = 1100;
  const svgHeight = 400;
  svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const margin = { top: 40, right: 30, bottom: 40, left: 30 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // Color scale for nodes
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  data.nodes.forEach(node => {
    node.color = color(node.id);
  });

/***************************************************************************************/ 
//This section build the Sankey layout
/*******************************************************************************************/
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
/*******************************************************************************************/  
//This code segment draws base Sankey links first (shadow layer)
/*******************************************************************************************/
svg.append("g")
  .attr("fill", "none")
  .selectAll("path")
  .data(sankeyData.links)
  .join("path")
    .attr("class", "link-shadow")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => d.source.color)
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.2);

/*******************************************************************************************/  
// Create defs for animated gradient
/*******************************************************************************************/
const defs = svg.append("defs");

sankeyData.links.forEach((link, i) => {
  const grad = defs.append("linearGradient")
    .attr("id", `grad${i}`)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", link.source.x1)
    .attr("x2", link.target.x0)
    .attr("y1", 0)
    .attr("y2", 0);

  grad.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", link.source.color)
    .attr("stop-opacity", 0.1);
  grad.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "white")
    .attr("stop-opacity", 0.9);
  grad.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", link.source.color)
    .attr("stop-opacity", 0.1);
});
/*******************************************************************************************/  
// Draw animated flow links using gradient
/*******************************************************************************************/
svg.append("g")
  .attr("fill", "none")
  .selectAll("path")
  .data(sankeyData.links)
  .join("path")
    .attr("class", "link-glow")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", (d, i) => `url(#grad${i})`)
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 1)
    .attr("stroke-dasharray", "20 40")
    .attr("stroke-dashoffset", 0)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attrTween("stroke-dashoffset", () => d3.interpolateNumber(0, 60))
    .on("end", function repeat() {
      d3.select(this)
        .attr("stroke-dashoffset", 0)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attrTween("stroke-dashoffset", () => d3.interpolateNumber(0, 60))
        .on("end", repeat);
    });
    /*******************************************************************************************/  
// This code segment adds red animated bubbles flowing along each link
/*******************************************************************************************/
sankeyData.links.forEach((link, i) => {
  const pathId = `linkPath${i}`;

  // Create a hidden path for motion reference
  svg.append("path")
    .attr("id", pathId)
    .attr("d", sankeyLinkHorizontal()(link))
    .attr("fill", "none")
    .attr("stroke", "none");

  // Create a red bubble (circle)
  const bubble = svg.append("circle")
    .attr("r", 3)               // size of bubble
    .attr("fill", "red")
    .attr("opacity", 0.8);

  // Function to animate the bubble along the path
  function animateBubble() {
    const path = d3.select(`#${pathId}`).node();
    const totalLength = path.getTotalLength();

    bubble
      .attr("transform", null)
      .transition()
      .duration(2000 + Math.random() * 1000)  // randomize speed a little
      .ease(d3.easeLinear)
      .attrTween("transform", function() {
        return function(t) {
          const point = path.getPointAtLength(t * totalLength);
          return `translate(${point.x},${point.y})`;
        };
      })
      .on("end", animateBubble); // loop it
  }

  animateBubble(); // start the animation
});
  /*******************************************************************************************/
  // This code segment draw invisible, wider paths on top of the real links for hover‐area
  /*******************************************************************************************/
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
  /*******************************************************************************************/
  // This code is for draw the solid node rectangles
  /*******************************************************************************************/
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
  /*******************************************************************************************/
  // This code segment draw invisible, overlaying rects on nodes for hover‐area
  /*******************************************************************************************/
  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .attr("data-tooltip", d => `Node: ${d.id}`);

  /*******************************************************************************************/
  // This code segment draw node labels,text
  /*******************************************************************************************/
  node.append("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => (d.x0 < width / 2 ? "start" : "end"))
    .style("fill", "#ffffff")
    .style("font-size", "12px")
    .text(d => d.id);
/*******************************************************************************************/
  // It create single .tooltip <div> for all hover interactions
  /*******************************************************************************************/
  d3.select("body").selectAll(".tooltip").remove();

  //appending a fresh .tooltip <div>
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("left", "0px")
    .style("top", "0px")
    .style("pointer-events", "none")
    .style("opacity", 0);
/*******************************************************************************************/
  // This attach hover for both for links and for nodes.
  // It select every element that has a `data-tooltip` attribute inside our SVG:
/*******************************************************************************************/
  svg.selectAll("[data-tooltip]")
    .on("mouseover", (event, d) => {
      //It shows the DIV (overriding any `display:none` in CSS
      tooltip.style("display", "block");

      // It Fill in its HTML from the data-tooltip attribute (with newlines → <br/>)
      const text = d3.select(event.currentTarget).attr("data-tooltip");
      tooltip.html(text.replace(/\n/g, "<br/>"));

      // This section is for position for right‐bottom of the mouse cursor
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top",  (event.pageY +  5) + "px");

      // This section code lines is for fade in the tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
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
