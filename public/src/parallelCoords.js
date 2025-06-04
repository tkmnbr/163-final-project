/**
 * Parallel Coordinates Visualization Module
 * State-Level Crime Analysis Dashboard
 */

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

class ParallelCoordinates {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.config = {
            margin: { top: 80, right: 120, bottom: 80, left: 80 },
            width: 1100,
            height: 500,
            ...options
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
            console.log('Using sample data...');
            this.allData = this.getSampleData();
        }
        
        this.filteredData = [...this.allData];
        await this.draw();
        
        console.log('Parallel coordinates initialized successfully');
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
        const width = this.config.width - this.config.margin.left - this.config.margin.right;
        const height = this.config.height - this.config.margin.top - this.config.margin.bottom;
        
        // Clear existing content
        svg.selectAll("*").remove();
        
        // Add title
        svg.append("text")
            .attr("x", this.config.width / 2)
            .attr("y", this.config.margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text("State-Level Crime Analysis: Multi-Dimensional Comparison");

        
        
        // Create main group
        const g = svg.append("g")
            .attr("transform", `translate(${this.config.margin.left},${this.config.margin.top})`);
        
        // Create scales
        this.scales = {};
        this.dimensions.forEach(dim => {
            this.scales[dim.key] = d3.scaleLinear()
                .domain(d3.extent(this.filteredData, d => d[dim.key]))
                .range([height, 0])
                .nice();
        });
        
        // X scale for positioning dimensions
        const xScale = d3.scalePoint()
            .domain(this.dimensions.map(d => d.key))
            .range([0, width])
            .padding(0.1);
        
        // Line generator
        const line = d3.line()
            .defined(d => !isNaN(d[1]))
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
            .style("stroke-width", 2.5)
            .style("opacity", d => this.currentFilters.states.length === 0 || this.currentFilters.states.includes(d.state) ? 0.8 : 0.3);
        
        // Add state labels for highlighted states
        g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(this.filteredData.filter(d => this.currentFilters.states.includes(d.state)))
            .enter()
            .append("text")
            .attr("x", width + 10)
            .attr("y", d => this.scales[this.dimensions[this.dimensions.length - 1].key](d[this.dimensions[this.dimensions.length - 1].key]))
            .attr("dy", "0.35em")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", d => this.colorScale(d.population_tier))
            .text(d => d.state);
        
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
                d3.select(nodes[i]).call(d3.axisLeft(this.scales[d.key]).ticks(8));
            })
            .append("text")
            .attr("y", -25)
            .attr("x", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#2c3e50")
            .text(d => d.label);
        
        // Add brushing
        this.brushes = {};
        dimensionGroups.each((d, i, nodes) => {
            const dimensionGroup = d3.select(nodes[i]);
            
            this.brushes[d.key] = d3.brushY()
                .extent([[-10, 0], [10, height]])
                .on("brush end", () => this.handleBrush());
            
            dimensionGroup.append("g")
                .attr("class", "brush")
                .call(this.brushes[d.key]);
        });
        
        // Add legend
        this.addLegend(svg, width);
        
        // Add tooltips
        this.addTooltips(foreground);
        
        // Add instructions
        svg.append("text")
            .attr("x", this.config.margin.left)
            .attr("y", this.config.height - 10)
            .style("font-size", "11px")
            .style("fill", "#7f8c8d")
            .text("💡 Drag vertically on axes to filter • Use controls to compare states • Hover for details");
    }

    // Handle brush filtering
    handleBrush() {
        const actives = [];
        
        this.dimensions.forEach((dim, i) => {
            const brushElement = d3.selectAll(".dimension").nodes()[i]?.querySelector(".brush");
            if (brushElement) {
                const brush = d3.brushSelection(brushElement);
                if (brush) {
                    actives.push({
                        dimension: dim.key,
                        extent: brush.map(this.scales[dim.key].invert)
                    });
                }
            }
        });
        
        // Filter data based on brush selections
        let brushedData = this.filteredData;
        if (actives.length > 0) {
            brushedData = this.filteredData.filter(d => {
                return actives.every(active => {
                    const value = d[active.dimension];
                    return value >= active.extent[1] && value <= active.extent[0];
                });
            });
        }
        
        // Update line visibility
        d3.selectAll(".background path")
            .style("opacity", d => brushedData.includes(d) ? 0.3 : 0.05);
        
        d3.selectAll(".foreground path")
            .style("opacity", d => {
                const inBrush = brushedData.includes(d);
                const highlighted = this.currentFilters.states.length === 0 || this.currentFilters.states.includes(d.state);
                return inBrush && highlighted ? 0.8 : 0.1;
            })
            .style("stroke-width", d => brushedData.includes(d) ? 2.5 : 1);
    }

    // Add legend
        // Add legend (moved farther to the right so it no longer overlaps the 4th axis)
    addLegend(svg, width) {
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + this.config.margin.left + 20}, ${this.config.margin.top + 30})`);
        
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
            .style("fill", "#ffffff")   /* 文字色を白に */
            .text(d => d);
        
        // Legend title (also white)
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
    // Ensure we remove any prior .tooltip DIV so we don't stack multiples
    d3.select("body").selectAll(".tooltip").remove();

    // Recreate the tooltip DIV just once
    this.tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")   // must match your CSS
        .style("position", "absolute")
        .style("background", "rgba(44, 62, 80, 0.95)")
        .style("color", "white")
        .style("padding", "12px")
        .style("border-radius", "8px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)");

    // Now wire up both background & foreground lines
    selection
        .on("mouseover", (event, d) => {
        // Highlight the hovered line
        d3.select(event.currentTarget)
            .style("stroke-width", 4)
            .style("opacity", 1);

        // Fade out all the others:
        selection.filter(p => p !== d)
            .style("opacity", 0.1);

        // Show tooltip
        this.tooltip.transition()
            .duration(200)
            .style("opacity", 1);

        const tooltipContent = `
            <strong>${d.state} (${d.state_abbr})</strong><br/>
            <strong>Region:</strong> ${d.population_tier}<br/>
            <strong>Population:</strong> ${d3.format(",")(d.population)}<br/>
            <strong>Total Assaults:</strong> ${d3.format(",")(d.total_assaults)}<br/>
            <strong>Assault Rate:</strong> ${d3.format(".1f")(d.assault_rate_per_100k)}/100k<br/>
            <strong>Firearm Usage:</strong> ${d3.format(".1f")(d.firearm_percentage)}%<br/>
            <strong>Arrest Rate:</strong> ${d3.format(".1f")(d.arrest_rate)}%<br/>
            <strong>Avg Victim Age:</strong> ${d3.format(".1f")(d.avg_victim_age)}<br/>
            <strong>Years Analyzed:</strong> ${d.years_analyzed}
        `;

        this.tooltip.html(tooltipContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top",  (event.pageY - 10) + "px");
        })
        .on("mouseout", (event, d) => {
        // Restore all lines to normal stroke/opacity
        selection
            .style("stroke-width", d => this.currentFilters.states.includes(d.state) ? 2.5 : 1)
            .style("opacity", d => {
            // Dim out un‐highlighted states, keep highlighted ones at 0.8
            return (this.currentFilters.states.length === 0 || this.currentFilters.states.includes(d.state))
                ? 0.8 
                : 0.3;
            });

        // Fade out tooltip
        this.tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
    }

    // Filter functions
    filterByPopulation(popTier) {
        this.currentFilters.population = popTier;
        this.applyFilters();
    }

    filterByCrimeRate(rateCategory) {
        this.currentFilters.crimeRate = rateCategory;
        this.applyFilters();
    }

    highlightStates(stateList) {
        this.currentFilters.states = stateList;
        this.draw();
    }

    applyFilters() {
        this.filteredData = this.allData.filter(d => {
            // Population filter
            if (this.currentFilters.population !== 'all' && d.population_tier !== this.currentFilters.population) {
                return false;
            }
            
            // Crime rate filter
            if (this.currentFilters.crimeRate !== 'all') {
                const rate = d.assault_rate_per_100k;
                if (this.currentFilters.crimeRate === 'high' && rate <= 350) return false;
                if (this.currentFilters.crimeRate === 'medium' && (rate < 200 || rate > 350)) return false;
                if (this.currentFilters.crimeRate === 'low' && rate >= 200) return false;
            }
            
            return true;
        });
        
        this.draw();
    }

    resetFilters() {
        this.currentFilters = {
            population: 'all',
            states: ['Louisiana', 'Alaska', 'Tennessee', 'Massachusetts'],
            crimeRate: 'all'
        };
        this.filteredData = [...this.allData];
        this.draw();
    }

    exportData() {
        const csvContent = d3.csvFormat(this.filteredData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `state_crime_analysis_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Preset filter functions
    showHighLowContrast() {
        this.currentFilters.states = ['Louisiana', 'Alaska', 'Maine', 'Massachusetts'];
        this.currentFilters.population = 'all';
        this.filteredData = [...this.allData];
        this.draw();
    }
}

// Export the class
export default ParallelCoordinates;