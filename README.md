# Aggravated Assault Visualization Dashboard

## Description
This repository contains an interactive, multi‐scene dashboard built with D3.js to explore trends in aggravated assault data across the United States. It is organized into four main “scenes,” each focusing on a different aspect of the data:

1. **Scene 1: National Trends**  
   A simple line chart showing the annual count of aggravated assaults in the U.S. (2010–2023). This high‐level overview allows users to see how the national total has risen or fallen over time, identify peaks/troughs, and gain context for more granular analyses.

2. **Scene 2: State Comparison**  
   A parallel‐coordinates plot that compares each state across multiple metrics (e.g., total assaults, firearm usage percentage, arrest rate percentage, average victim age). Each polyline represents one state, enabling side‐by‐side, multi‐dimensional comparisons to highlight outliers and clusters of similar behavior.

3. **Scene 3: Weapon → Victim Gender → Arrest Outcome (Sankey Diagram)**  
   A Sankey diagram that illustrates the flow of violent incidents from weapon type (Knife vs. Gun) through victim gender (Male vs. Female) to arrest outcome (Arrested vs. Not Arrested). Link widths are proportional to counts, revealing where the largest flows occur and any notable bottlenecks.

4. **Scene 4: Explore Mode**  
   A two‐pane, interactive view:
   - **Upper Place:** A dynamic line chart of aggravated assault counts for a selectable year range (2010–2023) and state (or “All” states).  
   - **Lower Plane:** The same parallel‐coordinates plot from Scene 2, but with all other state‐lines hidden when a single state is chosen (axes remain on the full national scale).  
   This “sandbox” allows users to drill down by year and isolate one state in order to compare it against the national baseline or inspect its multi‐metric profile.

All of the JavaScript visualization code lives under `src/` (`main.js`, `lineChart.js`, `parallelCoords.js`, `sankeyDiagram.js`), while raw and processed CSV data files live in `processed/`. The `style.css` defines global styles and scene‐specific overrides. The entry point is `index.html`, which switches between scenes and loads the appropriate scripts.


## Installation

**Clone the Repository**  
```bash
git clone https://github.com/your username/163-final-project.git
```

## Set up code

git clone command should set up everything

## Execution
```
npm run start
```

It should open up the the local host (http://127.0.0.1:8080/index.html) and you will see the Scene 1.<br>
To switch scenes, please use the button under the scenes.


