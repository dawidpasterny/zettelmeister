import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width=innerWidth
const height=innerHeight

function renderChart(data){

    // Create the color scale.
    const color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(200,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);
    
    // Create the pack layout (size and position are assigned in zoomTo)
    function pack(data){
        const hierarchy = d3
            .hierarchy(data) // create a hierarchy from the data.
            .sum(node => node.value) // to establish the size of the enclosing circles
            .sort((a, b) => b.value - a.value); // sort the nodes based on their values in descending order.
        return d3 
            .pack() // construct enclosure diagrams by tightly nesting circles
            .size([width, height]) // bounding box size
            .padding(3) // padding between circles in px
            (hierarchy); 
    };
    const rootNode = pack(data);
    let focusNode = rootNode;

    // Create the SVG container.
    const svg = d3.select("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${color(0)}; cursor: pointer;`);

    // Append the nodes (positioning is being done in zoomTo)
    const nodes = svg.append("g")
        .selectAll("circle")
        .data(rootNode.descendants().slice(1)) // slice the rootNode - it gets different treatment
        .join("circle")
        .attr("fill", node => node.children ? color(node.depth) : "white")
        .attr("pointer-events", node => !node.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", (event, node) => focusNode !== node && (zoom(node), event.stopPropagation()));

    // Create the zoom behavior for the rootNode
    svg.on("click", () => zoom(rootNode));
    
    // Append the text labels.
    const labels = svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .selectAll("text")
        .data(rootNode.descendants())
        .join("text")
        .style("font", node => {
            const labelWidth = node.r * 2; // Calculate the label width based on the circle radius
            const fontSize = Math.max(15, 2 * labelWidth / node.data.name.length); // Compute the font size
            return `${fontSize}px sans-serif`; // Set the font size
        })
        .style("fill-opacity", node => node.parent === rootNode ? 1 : 0)
        .style("display", node => node.parent === rootNode ? "inline" : "none")
        .attr("dy", "0.35em") // Adjust the vertical alignment
        .text(node => node.data.name)
        .style("filter", "url(#blur-effect)"); // Apply the blur effect

    
    // Zoom innitially in to the rootNode (sets up the node positioning and size)
    let view;
    zoomTo([focusNode.x, focusNode.y, focusNode.r * 2]);
    
    /*
    * This function updates the view to focus on a specific area of the visualization.
    * It takes an array `v` of three numbers: [x, y, radius], which represent the center and size of the area to focus on.
    * It then updates the positions and sizes of the nodes and labels based on these parameters.
    */
    function zoomTo(v) {
        const k = width / v[2]; // scalling factor
        view = v;
        /*
        * The transform attribute of SVG elements defines a list of transforms (as a string)
        * that are applied to an element and the element's children.
        */
        labels.attr("transform", node => `translate(${(node.x - v[0]) * k},${(node.y - v[1]) * k})`);
        nodes.attr("transform", node => `translate(${(node.x - v[0]) * k},${(node.y - v[1]) * k})`);
        nodes.attr("r", node => node.r * k);
    }
    
    /*
    * Zoom smoothly to a selected node
    */
    function zoom(node) {    
        focusNode = node;
    
        const transition = svg.transition()
            .duration(750)
            /*
            * "tween" is a function that interpolates between two keyframes over the course of a transition.
            * The term comes from "in-betweening". It takes two arguments: the name of the tween and a 
            * factory function which is evaluated for each selected node element. The function it returns
            * is then invoked for each frame of the transition
            */
            .tween("zoom", node => {
                /*
                * interpolateZoom returns an interpolator between the two views a and b which itself returns
                * an interpolated view (an array of cx, cy and width i.e. location and size of the view) at 
                * each time t in the range [0, 1] being passed by tween subdivided appropriatelly given transition duration
                */
                const interpolator = d3.interpolateZoom(view, [focusNode.x, focusNode.y, focusNode.r * 2]);
                return t => zoomTo(interpolator(t));
            });
    
        labels
        .filter(function(node) { return node.parent === focusNode || this.style.display === "inline"; })
        .transition(transition)
            .style("fill-opacity", node => node.parent === focusNode ? 1 : 0)
            .on("start", function(node) { if (node.parent === focusNode) this.style.display = "inline"; })
            .on("end", function(node) { if (node.parent !== focusNode) this.style.display = "none"; });
    }

    return svg.nodes()
}


// Fetch data from the server
fetch("http://localhost:3000/data", {method:"GET"}) // get request
    .then(res => res.json())
    .then(data => {
        renderChart(data);
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
