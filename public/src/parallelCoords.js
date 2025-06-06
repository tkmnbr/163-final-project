/**
 * Parallel Coordinates Visualization Module
 * State-Level Crime Analysis Dashboard
 */

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

class ParallelCoordinates {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.config = {
            margin: { top: 80, right: 120, bottom: 50, left: 80 },
            width: 900,
            height: 340,
        };
        
        // Global variables
        this.allData = [];
        this.filteredData = [];
        this.scales = {};
        this.brushes = {};
        this.currentFilters = {
            population: 'all',
            states: [],
            crimeRate: 'all'
        };

        // Color scale for population tiers
        this.colorScale = d3.scaleOrdinal()
            .domain(['Large', 'Medium', 'Small', 'Very Small'])
            .range(['#e74c3c', '#3498db', '#27ae60', '#9b59b6']);

        // Dimensions for parallel coordinates
        this.dimensions = [
            { 
                key: 'total_assaults', 
                label: 'Total Assaults', 
                format: d3.format(',')
            },
            { 
                key: 'firearm_percentage', 
                label: 'Firearm Usage %', 
                format: d3.format('.1f')
            },
            { 
                key: 'arrest_rate', 
                label: 'Arrest Rate %', 
                format: d3.format('.1f')
            },
            { 
                key: 'avg_victim_age', 
                label: 'Avg Victim Age', 
                format: d3.format('.1f')
            }
        ];

        this.tooltip = null;
    }

    // Initialize the visualization
    async initialize() {
        console.log('Initializing parallel coordinates...');
        
        try {
            // Try to load processed data first
            try {
                this.allData = await d3.csv("processed/state_analysis_simple.csv", d => ({
                    state: d.state,
                    state_abbr: d.state_abbr,
                    population: +d.population,
                    population_tier: d.population_tier,
                    total_assaults: +d.total_assaults,
                    assault_rate_per_100k: +d.assault_rate_per_100k,
                    firearm_percentage: +d.firearm_percentage,
                    arrest_rate: +d.arrest_rate,
                    avg_victim_age: +d.avg_victim_age,
                    male_victim_pct: +d.male_victim_pct,
                    years_analyzed: +d.years_analyzed
                }));
                console.log(`Loaded ${this.allData.length} states from processed data`);
            } catch (error) {
                console.log('CSV not found, using sample data...');
                this.allData = this.getSampleData();
            }
            
            // Filter out invalid data
            this.allData = this.allData.filter(d => 
                d.state && 
                !isNaN(d.total_assaults) && 
                !isNaN(d.firearm_percentage) && 
                !isNaN(d.arrest_rate) && 
                !isNaN(d.avg_victim_age)
            );
            
            this.filteredData = [...this.allData];
            await this.draw();
            
            console.log('Parallel coordinates initialized successfully');
        } catch (error) {
            console.error('Error initializing parallel coordinates:', error);
            this.showError(error.message);
        }
    }

    // Sample data if processed file not available
    getSampleData() {
        return [
            { state: 'Louisiana', state_abbr: 'LA', population: 4657757, population_tier: 'Medium', total_assaults: 12500, assault_rate_per_100k: 468.2, firearm_percentage: 48.7, arrest_rate: 36.4, avg_victim_age: 30.5, male_victim_pct: 79.8, years_analyzed: 14 },
            { state: 'Alaska', state_abbr: 'AK', population: 733391, population_tier: 'Very Small', total_assaults: 3200, assault_rate_per_100k: 436.5, firearm_percentage: 41.2, arrest_rate: 42.1, avg_victim_age: 29.8, male_victim_pct: 76.3, years_analyzed: 14 },
            { state: 'Tennessee', state_abbr: 'TN', population: 6910840, population_tier: 'Medium', total_assaults: 25800, assault_rate_per_100k: 373.4, firearm_percentage: 45.9, arrest_rate: 38.7, avg_victim_age: 31.2, male_victim_pct: 78.1, years_analyzed: 14 },
            { state: 'Arkansas', state_abbr: 'AR', population: 3011524, population_tier: 'Medium', total_assaults: 10200, assault_rate_per_100k: 338.8, firearm_percentage: 46.8, arrest_rate: 35.2, avg_victim_age: 30.9, male_victim_pct: 79.5, years_analyzed: 14 },
            { state: 'Nevada', state_abbr: 'NV', population: 3104614, population_tier: 'Medium', total_assaults: 9800, assault_rate_per_100k: 315.7, firearm_percentage: 37.4, arrest_rate: 41.8, avg_victim_age: 32.1, male_victim_pct: 75.2, years_analyzed: 14 },
            { state: 'California', state_abbr: 'CA', population: 39538223, population_tier: 'Large', total_assaults: 115000, assault_rate_per_100k: 290.9, firearm_percentage: 34.2, arrest_rate: 43.7, avg_victim_age: 32.8, male_victim_pct: 74.8, years_analyzed: 14 },
            { state: 'Texas', state_abbr: 'TX', population: 29145505, population_tier: 'Large', total_assaults: 82000, assault_rate_per_100k: 281.4, firearm_percentage: 44.1, arrest_rate: 39.2, avg_victim_age: 31.4, male_victim_pct: 78.9, years_analyzed: 14 },
            { state: 'Florida', state_abbr: 'FL', population: 21538187, population_tier: 'Large', total_assaults: 58500, assault_rate_per_100k: 271.7, firearm_percentage: 42.8, arrest_rate: 37.6, avg_victim_age: 32.0, male_victim_pct: 77.3, years_analyzed: 14 },
            { state: 'Illinois', state_abbr: 'IL', population: 12812508, population_tier: 'Large', total_assaults: 33200, assault_rate_per_100k: 259.2, firearm_percentage: 36.7, arrest_rate: 45.3, avg_victim_age: 32.4, male_victim_pct: 76.8, years_analyzed: 14 },
            { state: 'New York', state_abbr: 'NY', population: 19336776, population_tier: 'Large', total_assaults: 47800, assault_rate_per_100k: 247.1, firearm_percentage: 26.4, arrest_rate: 52.8, avg_victim_age: 33.7, male_victim_pct: 72.5, years_analyzed: 14 },
            { state: 'Pennsylvania', state_abbr: 'PA', population: 13002700, population_tier: 'Large', total_assaults: 28900, assault_rate_per_100k: 222.3, firearm_percentage: 28.7, arrest_rate: 49.1, avg_victim_age: 33.2, male_victim_pct: 73.9, years_analyzed: 14 },
            { state: 'Massachusetts', state_abbr: 'MA', population: 7001399, population_tier: 'Medium', total_assaults: 13200, assault_rate_per_100k: 188.6, firearm_percentage: 21.8, arrest_rate: 54.2, avg_victim_age: 34.5, male_victim_pct: 71.4, years_analyzed: 14 },
            { state: 'Connecticut', state_abbr: 'CT', population: 3605944, population_tier: 'Medium', total_assaults: 5800, assault_rate_per_100k: 160.9, firearm_percentage: 23.1, arrest_rate: 51.7, avg_victim_age: 34.1, male_victim_pct: 72.8, years_analyzed: 14 },
            { state: 'Maine', state_abbr: 'ME', population: 1395722, population_tier: 'Small', total_assaults: 1450, assault_rate_per_100k: 103.9, firearm_percentage: 26.3, arrest_rate: 48.9, avg_victim_age: 35.2, male_victim_pct: 74.2, years_analyzed: 14 }
        ];
    }

    // Main drawing function
    async draw() {
        const svg = d3.select(`#${this.containerId}`);
        const svgWidth = this.config.width;
        const svgHeight = this.config.height;

        svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const margin = this.config.margin;
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // Clear previous content
        svg.selectAll("*").remove();

        // Check if we have data
        if (!this.filteredData || this.filteredData.length === 0) {
            svg.append("text")
                .attr("x", svgWidth / 2)
                .attr("y", svgHeight / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .attr("font-size", "16px")
                .text("No data available");
            return;
        }

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Title
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .text("State-Level Crime Analysis: Multi-Dimensional Comparison");

        // Create scales for each dimension
        this.scales = {};
        this.dimensions.forEach(dim => {
            const values = this.filteredData.map(d => d[dim.key]).filter(v => !isNaN(v));
            if (values.length > 0) {
                this.scales[dim.key] = d3.scaleLinear()
                    .domain(d3.extent(values))
                    .range([height, 0])
                    .nice();
            }
        });

        // X scale for positioning dimensions
        const xScale = d3.scalePoint()
            .domain(this.dimensions.map(d => d.key))
            .range([0, width])
            .padding(0.1);

        // Line generator
        const line = d3.line()
            .defined(d => !isNaN(d[1]) && this.scales[d[0]])
            .x(d => xScale(d[0]))
            .y(d => this.scales[d[0]](d[1]));

        // Draw background lines (all states, faded)
        g.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(this.filteredData)
            .enter()
            .append("path")
            .attr("d", d => line(this.dimensions.map(dim => [dim.key, d[dim.key]])))
            .style("fill", "none")
            .style("stroke", "#bdc3c7")
            .style("stroke-width", 1)
            .style("opacity", 0.3);

        // Draw foreground lines (highlighted states)
        const foreground = g.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(this.filteredData)
            .enter()
            .append("path")
            .attr("d", d => line(this.dimensions.map(dim => [dim.key, d[dim.key]])))
            .style("fill", "none")
            .style("stroke", d => this.colorScale(d.population_tier))
            .style("stroke-width", 2)
            .style("opacity", d => 
                this.currentFilters.states.length === 0 || 
                this.currentFilters.states.includes(d.state) ? 0.8 : 0.3
            );

        // Create dimension axes
        const dimensionGroups = g.selectAll(".dimension")
            .data(this.dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${xScale(d.key)},0)`);

        // Add axes
        dimensionGroups.append("g")
            .attr("class", "axis")
            .each((d, i, nodes) => {
                if (this.scales[d.key]) {
                    d3.select(nodes[i]).call(d3.axisLeft(this.scales[d.key]).ticks(6));
                }
            })
            .selectAll("text")
            .style("fill", "#ffffff")
            .style("font-size", "10px");

        // Add axis lines
        dimensionGroups.selectAll(".axis path, .axis line")
            .style("stroke", "#ffffff");

        // Add dimension labels
        dimensionGroups.append("text")
            .attr("y", -15)
            .attr("x", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .text(d => d.label);

        // Add legend
        this.addLegend(svg, svgWidth, margin);

        // Add tooltips
        this.addTooltips(foreground);

        console.log(`Parallel coordinates drawn with ${this.filteredData.length} states`);
    }

    // Add legend
    addLegend(svg, svgWidth, margin) {
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${svgWidth - margin.right + 20}, ${margin.top + 30})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(this.colorScale.domain())
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 0)
            .attr("y2", 0)
            .style("stroke", d => this.colorScale(d))
            .style("stroke-width", 3);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "11px")
            .style("fill", "#ffffff")
            .text(d => d);

        // Legend title
        legend.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff")
            .text("Population Size");
    }

    // Add tooltips
    addTooltips(selection) {
        // Remove any existing tooltips
        d3.select("body").selectAll(".pc-tooltip").remove();

        // Create tooltip
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "pc-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "#ffffff")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)")
            .style("z-index", "10000");

        // Add interactions
        selection
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                // Highlight the hovered line
                d3.select(event.currentTarget)
                    .style("stroke-width", 4)
                    .style("opacity", 1);

                // Fade out other lines
                selection.filter(p => p !== d)
                    .style("opacity", 0.1);

                // Show tooltip
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                const tooltipContent = `
                    <strong>${d.state} (${d.state_abbr})</strong><br/>
                    <strong>Population Tier:</strong> ${d.population_tier}<br/>
                    <strong>Population:</strong> ${d3.format(",")(d.population)}<br/>
                    <strong>Total Assaults:</strong> ${d3.format(",")(d.total_assaults)}<br/>
                    <strong>Assault Rate:</strong> ${d3.format(".1f")(d.assault_rate_per_100k)}/100k<br/>
                    <strong>Firearm Usage:</strong> ${d3.format(".1f")(d.firearm_percentage)}%<br/>
                    <strong>Arrest Rate:</strong> ${d3.format(".1f")(d.arrest_rate)}%<br/>
                    <strong>Avg Victim Age:</strong> ${d3.format(".1f")(d.avg_victim_age)}
                `;

                this.tooltip.html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", (event, d) => {
                // Restore all lines
                selection
                    .style("stroke-width", 2)
                    .style("opacity", d => 
                        this.currentFilters.states.length === 0 || 
                        this.currentFilters.states.includes(d.state) ? 0.8 : 0.3
                    );

                // Hide tooltip
                this.tooltip.transition()
                    .duration(300)
                    .style("opacity", 0);
            });
    }

    // Filter functions
    highlightStates(stateList) {
        this.currentFilters.states = stateList;
        this.draw();
    }

    resetFilters() {
        this.currentFilters = {
            population: 'all',
            states: [],
            crimeRate: 'all'
        };
        this.filteredData = [...this.allData];
        this.draw();
    }

    // Show error message
    showError(message) {
        const svg = d3.select(`#${this.containerId}`);
        svg.selectAll("*").remove();
        
        svg.append("text")
            .attr("x", this.config.width / 2)
            .attr("y", this.config.height / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#e74c3c")
            .attr("font-size", "16px")
            .text("Error: " + message);
    }
}

// Export the class
export default ParallelCoordinates;
