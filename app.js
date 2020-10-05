// extend javascript array class by a remove function
// copied from https://stackoverflow.com/a/3955096/12267732
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


var data = {
    "nodes": {
        "A": { id: "A", name: "A", terminal: false, course_id: 1, c_name: "course1" },
        "B": { id: "B", name: "B", terminal: true, course_id: 1, c_name: "course1" },
        "C": { id: "C", name: "C", terminal: false, course_id: 1, c_name: "course1" },
        "D": { id: "D", name: "D", terminal: true, course_id: 2, c_name: "course2" },
        "E": { id: "E", name: "E", terminal: true, course_id: 2, c_name: "course2" },
        "F": { id: "F", name: "F", terminal: true, course_id: 2, c_name: "course2" },
        "G": { id: "G", name: "G", terminal: false, course_id: 2, c_name: "course2" },
        "H": { id: "H", name: "H", terminal: true, course_id: 3, c_name: "course3" },
        "I": { id: "I", name: "I", terminal: true, course_id: 3, c_name: "course3" },
        "J": { id: "J", name: "J", terminal: false, course_id: 3, c_name: "course3" },
        "K": { id: "K", name: "K", terminal: true, course_id: 1, c_name: "course1" },
        "M": { id: "M", name: "M", terminal: false, course_id: 1, c_name: "course1" },
        "N": { id: "N", name: "N", terminal: false, course_id: 1, c_name: "course1" },
    },
    "links": [["N", "M"], ["F", "M"], ["K", "A"], ["A", "C"], ["B", "C"], ["F", "C"], ["D", "G"], ["E", "G"], ["G", "H"], ["G", "I"], ["H", "J"]]
};

var screen_width = document.body.offsetWidth,
    screen_height = document.documentElement.clientHeight;
var nodeRadius = 20;
var show_roots = true;

var all_nodes = undefined;
var roots = undefined;
var dag = undefined;

function handleSelect(value) {
    // make dag from edge list
    dag = d3.dagConnect()(data.links);
    var dag_tree = tree(dag),
        nodes = dag.descendants(),
        links = dag.links();

    console.log("DAG: ", dag);
    // prepare node data
    all_nodes = dag.descendants()
    console.log(all_nodes);

    nodes.forEach(n => {
        n.data = data.nodes[n.id];
        n._children = n.children; // all nodes collapsed by default
        n.children = [];
        n.inserted_nodes = [];
        n.inserted_roots = [];
        n.neighbors = [];
        n.visible = false;
        n.layer = 1;
        n.inserted_connections = [];
        n.uncollapsed = false;
        n.isroot = false;
    });

    console.log("VALUE: ", value);


    roots = all_nodes.filter(n => n.data.terminal === true).filter(n => n.data.c_name === value);
    roots.forEach(n => {
        n.visible = true;
        n.layer = 0;
        n.x0 = screen_height / 2;
        n.y0 = screen_width / 2;
        n.neighbors = getNeighbors(n);
        n.uncollapsed = false;
        n.isroot = true;
    });
    console.log("ROOTS", roots);
    dag.children = roots; //change dag's children only to these roots

    
    roots.forEach(n => {
        show_roots = true;
        //uncollapse(n);
        update(n);
    });
}

/* When the user clicks on the button, 
        toggle between hiding and showing the dropdown content */
function myFunction() {
    document.getElementById("courses").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
    var e = document.getElementById("courses");
    var courses = e.options[e.selectedIndex].text;
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}



// initialize tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('e')
    .offset([0, 5])
    .html(
        function (d) {
            var content = `
        <span style='margin-left: 2.5px;'><b>` + d.data.name + `</b></span><br>
        <table style="margin-top: 2.5px;">
          <tr><td>name:</td><td>` + (d.data.id || "?") + `</td></tr>
        </table>
        `
            return content
        }
    );

// append the svg object to the body of the page
// assigns width and height
// activates zoom/pan and tooltips
var svg = d3.select("#chart").append("svg")
    .attr("width", 5000)
    .attr("height", 5000)
    .call(tip);

d3.select("#chart").attr("align", "center");

// append group element
const g = svg.append("g").attr("align", "center");

const defs = svg.append('defs'); // For gradients
defs.append("marker")
    .attr("id", "marker")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

// helper variables
var i = 0,
    duration = 750,
    x_sep = 250,
    y_sep = 150;

// declare a dag layout
var tree = d3.sugiyama()
    .nodeSize([y_sep, x_sep])
    .layering(d3.layeringSimplex())
    .decross(d3.decrossOpt)
    //.coord(d3.coordVert())
    .separation(
        (a, b) => { return 20 }
    );




// collapse a node
function collapse(d) {
    console.log("Collapsing");
    // remove root nodes and circle-connections
    var remove_inserted_root_nodes = n => {
        // remove all inserted root nodes
        dag.children = dag.children.filter(c => !n.inserted_roots.includes(c));
        // remove inserted connections
        console.log('inserted connections', n, n.inserted_connections);
        n.inserted_connections.forEach(
            arr => {
                // check existence to prevent double entries
                // which will cause crashes
                if (arr[0].children.includes(arr[1])) {
                    arr[0]._children.push(arr[1]);
                    arr[0].children.remove(arr[1]);
                }
            }
        )
        // repeat for all inserted nodes
        n.inserted_nodes.forEach(remove_inserted_root_nodes);
    };
    remove_inserted_root_nodes(d);
    // collapse neighbors which are visible and have been inserted by this node
    var vis_inserted_neighbors = d.neighbors.filter(n => n.visible & d.inserted_nodes.includes(n));
    vis_inserted_neighbors.forEach(
        n => {
            // tag invisible
            n.visible = false;
            // if child, delete connection
            if (d.children.includes(n)) {
                d._children.push(n);
                d.children.remove(n);
            }
            // if parent, delete connection
            if (n.children.includes(d)) {
                n._children.push(d);
                n.children.remove(d);
            }
            // if union, collapse the union
            if (n.data.isUnion) {
                collapse(n);
            }
            // remove neighbor handle from clicked node
            d.inserted_nodes.remove(n);
        }
    );
    d.uncollapsed = false;
}

// uncollapse a node
function uncollapse(d, make_roots) {
    if (d == undefined) return;

    // neighbor nodes that are already visible (happens when 
    // circles occur): make connections, save them to
    // destroy / rebuild on collapse
    var extended_neighbors = d.neighbors.filter(n => n.visible)
    extended_neighbors.forEach(
        n => {
            // if child, make connection
            if (d._children.includes(n)) {
                d.inserted_connections.push([d, n]);
            }
            // if parent, make connection
            if (n._children.includes(d)) {
                d.inserted_connections.push([n, d]);
            }
        }
    )

    // neighbor nodes that are invisible: make visible, make connections, 
    // add root nodes, add to inserted_nodes
    var collapsed_neighbors = d.neighbors.filter(n => !n.visible);
    collapsed_neighbors.forEach(
        n => {
            // collect neighbor data
            n.neighbors = getNeighbors(n);
            // tag visible
            n.visible = true;
            // if child, make connection
            if (d._children.includes(n)) {
                d.children.push(n);
                d._children.remove(n);
            }
            // if parent, make connection
            if (n._children.includes(d)) {
                n.children.push(d);
                n._children.remove(d);
                // insert root nodes if flag is set
                if (make_roots & !d.inserted_roots.includes(n)) {
                    d.inserted_roots.push(n);
                }
            }
            // save neighbor handle in clicked node
            d.inserted_nodes.push(n);
        }
    )

    // make sure this step is done only once
    if (!make_roots) {
        var add_root_nodes = n => {
            // add previously inserted root nodes (partners, parents)
            n.inserted_roots.forEach(p => dag.children.push(p));
            // add previously inserted connections (circles)
            n.inserted_connections.forEach(
                arr => {
                    // check existence to prevent double entries
                    // which will cause crashes
                    if (arr[0]._children.includes(arr[1])) {
                        arr[0].children.push(arr[1]);
                        arr[0]._children.remove(arr[1]);
                    }
                }
            )
            // repeat with all inserted nodes
            n.inserted_nodes.forEach(add_root_nodes)
        };
        add_root_nodes(d);
        d.uncollapsed = true;
    }
}

function getParents(node) {
    var parents = [];
    node.data.partner.forEach(
        p_id => parents.push(all_nodes.find(n => n.id == p_id))
    );
    return parents.filter(p => p != undefined)
}


function update(source) {
    // Assigns the x and y position for the nodes
    var dag_tree = tree(dag);
    var nodes = dag.descendants(),
        links = dag.links();
    console.log("LINKS", links);
    // ****************** Nodes section ***************************
    if (show_roots) { //do this only once; only show roots in the beginning
        nodes = nodes.filter(n => n.isroot);
        show_roots = false;
    }
    // Update the nodes...
    var node = g.selectAll('g.node')
        .data(nodes, function (d) { return d.id || (d.id = ++i); })

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .attr('visible', true);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style("fill", function (d) {
            if (d.isroot === true) {
                return "#990099";
            }
            else {
                return is_extendable(d) ? "lightsteelblue" : "#fff";
            }
        })
        .style("stroke", function (d) {
            if (d.uncollapsed === true && is_extendable(d)) {
                return "8E240D";
            }
        })
        .style("stroke-width", function (d) {
            if (d.uncollapsed && is_extendable(d)) {
                return 5;
            }
        });


    nodeEnter.append('text')
        .attr("y", -40)
        .attr("x", -50)
        .attr("text-anchor", "start")
        .text(d => d.data.name)
        .call(wrap, 180)
        .on('click', click);




    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .style("fill", function (d) {
            if (d.isroot === true) {
                return "#990099";
            }
            else {
                return is_extendable(d) ? "lightsteelblue" : "#fff";
            }
        })
        .attr('cursor', 'pointer')
        .style("stroke", function (d) {
            if (d.uncollapsed === true && is_extendable(d)) {
                return "8E240D";
            }
        })
        .style("stroke-width", function (d) {
            if (d.uncollapsed && is_extendable(d)) {
                return 5;
            }
        });


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .attr('visible', false)
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function (d) { return d.source.id + d.target.id });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            var o = { x: source.x0, y: source.y0 }
            return diagonal(o, o)
        });


    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d.source, d.target));
    //.attr("marker-end", "url(#marker)");

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = { x: source.x, y: source.y }
            console.log(o);
            return diagonal(o, o)
        })
        .remove();

    // expanding a big subgraph moves the entire dag out of the window
    // to prevent this, cancel any transformations in y-direction
    svg.transition()
        .duration(duration)
    //.call(
    //    zoom.transform,
    //    d3.zoomTransform(g.node()).translate(-(source.y - source.y0), -(source.x - source.x0)),
    //);

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });


    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

        path = `M ${s.y} ${s.x}
    C ${(s.y + d.y) / 2} ${s.x},
      ${(s.y + d.y) / 2} ${d.x},
      ${d.y} ${d.x}`

        return path
    }

    // Toggle unions, children, partners on click.
    function click(d) {
        console.log(d);
        // uncollapse if there are uncollapsed unions / children / partners
        if (d.uncollapsed === false) {
            uncollapse(d);
        }
        else {
            collapse(d);
        }
        /*if (is_extendable(d)) {
            uncollapse(d);
            //update(roots);
        }
        // collapse if fully uncollapsed
        if (is_collapsible(d)){
            collapse(d);
        }*/

        update(d);
    }
}

function getChildren(node) {
    var children = [];
    children = node.children.concat(node._children);
    return children
}


function getNeighbors(node) {
    return getChildren(node)
}

function is_extendable(node) {
    //return node.neighbors.filter(n => !n.visible).length > 0 //the old one
    return node.neighbors.length > 0;
}


function is_collapsible(node) {
    return node.neighbors.filter(n => n.visible).length > 0
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                .append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    });
}

function show(roots) {
    var node = g.selectAll('g.node')
        .data(roots, function (d) { return d.id || (d.id = ++i); })

    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .attr('visible', true);

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 12)
        .style("fill", function (d) {
            return "lightsteelblue";
        });

    nodeEnter.append('text')
        .attr("y", -40)
        .attr("x", -50)
        .attr("text-anchor", "start")
        .text(d => d.data.name);

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function (d) { return d.source.id + d.target.id });

    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            var o = { x: source.x0, y: source.y0 }
            console.log(o);
            return diagonal(o, o)
        }
        );


    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d.source, d.target));

    function diagonal(s, d) {

        path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

        return path
    }
}
