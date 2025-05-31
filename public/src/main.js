import { drawLineChart } from "./lineChart.js";
drawLineChart("#line-chart");

import { drawSankeyDiagram } from "./sankeyDiagram.js";

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