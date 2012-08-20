jQuery(function(){
    checkInternetExplorerVersion()

    function setInfoMaxHeight(){
        $("#info").css("max-height", $("body").height() - $(".title").height() - $(".title").position().top);
    }

    setInfoMaxHeight()

    $(window).resize(function() {
        setInfoMaxHeight()
    });

    $("#legend").bind("click", function(e){
        e.stopPropagation();
    })

    //array to store the region currently clicked on
    REGNUMS = [];

    //total population, investment, %population, %investment 
    TOTAL_POP = 0;
    TOTAL_INV = 0; 
    TOTAL_PCG_POP = 0;
    TOTAL_PCG_INV = 0;
    
    //current year is actually the year that should be displayed after loading the page
    currentYear = 2011;
    
    //data1, data2 and data3 contain the total (without health care), health care and debt budgets respectively
    data1 = [35.2, 37, 39.4, 41.4, 42.3, 43.3]
    data2  = [14.1, 15, 16, 17, 17.7, 18];
    data3 = [7, 7, 6.5, 6.1, 7, 7.4]
    
    //years for which data is available
    years = [2006, 2007, 2008, 2009, 2010, 2011];
    
    //color to be used in the graph showing the provincial and federal budget. color1 = provincial, color2 = federal.
    color1 = "#6495ED";
    color2 = "#3CB371";
    color3 = "#FF7256";
    
    //append svg to draw the graph and translate it to leave room for the title and x and y axis labels
    graph = d3.select("body").append("svg")
        .attr("class", "graph")
        .attr("width", 340)
        .attr("height", 250)
        .on("mouseover", function(){
            if(!$("#graph_popup").is(":visible")){
                $("#graph_popup").show();
                $(".inv_popup").css("opacity", 1)
                /*d3.select("#graph_popup")
                    .style("width", 0)
                    .style("left", "155px")
                    .transition()
                    .duration(500)
                    .style("width", "270px")
                    .style("left", "20px")
                    .each("end", function(dd){
                        $(".inv_popup").css("opacity", 1)
                    })*/
             }
        })
        .on("mouseout", function(){
            //if(d3.select(d3.event.relatedTarget).attr("class") == null){
                $(".inv_popup").css("opacity", 0)
                $("#graph_popup").hide();
            //}
        })
        .append("g")
        .attr("transform", "translate(40,80)")

    $(".class g").unbind("mouseover");
    
    //objects used to scale the graph
    x = d3.scale.linear()
        .domain([2006, 2011])
        .range([0, 230])
    
    y = d3.scale.linear()
        .domain([0, d3.max(data1.concat(data2).concat(data3))])
        .range([150, 0]); 
    
    //two-lines title
    graph.append("text")
        .attr("class", "graph_title")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dx", -22)
        .attr("dy", -60)
        .text("Budget annuel du Qu\351bec pour la sant\351, le service")
   
    graph.append("text")
        .attr("class", "graph_title")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dx", 0)
        .attr("dy", -40)
        .text("de la dette et les autres postes budg\351taires")
        
    //y ticks lines and labels
    var yticks = graph.selectAll(".ytick")
        .data(y.ticks(7))
        .enter().append("svg:g")
        .attr("transform", function(d, i){
            return "translate(0," + y(d) + ")";
        })
             
    yticks.append("svg:text")
        .text(function(d){
            return d;
        })
        .attr("text-anchor", "start")
        .attr("dy", 5)
        .attr("dx", -25)

    yticks.data([0]).append("svg:line")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("x1", 0)
        .attr("x2", 230)

    //x ticks lines and labels
    var xticks = graph.selectAll(".xtick")
        .data(x.ticks(6))
        .enter().append("svg:g")
        .attr("transform", function(d){
            return "translate(" +  x(d) + ", 0)";
        })
    
    xticks.append("svg:text")
        .text(function(d){
            return d;
        })
        .attr("text-anchor", "start")
        .attr("dy", 170)
        .attr("dx", -17)

    xticks.data([0]).append("svg:line")
        .attr("y1", 0)
        .attr("y2", 150)
        .attr("x1", 0)
        .attr("x2", 0)
    
    //graph paths
    graph.selectAll("path.line")
        .data([data1, data2, data3])
        .enter().append("path")
        .attr("class", function(d, i){
            var cls = "graph_path" + (i + 1);
            return cls;
        })
        .attr("d", d3.svg.line()
              .x(function(d, i){
                  return x(i + years[0]);
              })
              .y(150)
        )
        .transition()
        .duration(1000)
        .attr("d", d3.svg.line()
              .x(function(d, i){
                  return x(i + years[0]);
              })
              .y(y)
        )
        .each("end", function(){
            //when path transition is complete, add points
            addGraphPoint(currentYear);
            displayTitle(currentYear);
        })

    //a propos
    $("a[href^='#apropos']").bind("click", function(e, ui){
        $("#apropos").dialog({
            dialogClass: "apropos",
            width: "70%"
        });
    })

    //year slider
    var slider = $("#slider").slider({
        min: 2006,
        max: 2011,
        step: 1,
        value: currentYear
    });
        
    slider.bind("slide", function(e, ui){
        $("#comment").empty();
        bindClick(feature, "annee", ui.value)
        TOTAL_POP = 0;
        TOTAL_INV = 0; 
        TOTAL_PCG_POP = 0;
        TOTAL_PCG_INV = 0;

        currentYear = ui.value;
        
        addGraphPoint(currentYear);
        displayTitle(currentYear);
        
        for(j in REGNUMS){
            var featureClicked = feature.filter(function(d, i){ return d.properties.annee == currentYear && d.properties.no_region == REGNUMS[j]});
            featureClicked.each(function(d, i){
                sumTotal(d);
                featureClick(d);
            })
        }
    })

    $(".ui-slider-handle").append("<img id=\"slider-arrows\" src=\"css/images/arrows.svg\" />");
    
    //map
    var tilejson = {
	tilejson: '1.0.0',
	scheme: 'tms'
    };
	
    map = new L.Map("map", {
	maxZoom: 6,
	minZoom: 6,
        zoomControl: false
    })
        .addLayer(new L.TileLayer('http://simonmercier.net/mapcache/tms/1.0.0/quebec_base/{z}/{x}/{y}.png', tilejson))
	.setView(new L.LatLng(49.4, -73), 6);

    map._initPathRoot();

    svg = d3.select("#map").select("svg");

    //reading of the json file containing the nodes and links
    d3.json("links.json", function(data) {
        links = data;
    })

    //reading of the json file containing the data
    d3.json("depenses_sante_all.json", function(collection) {
	collection.features.forEach(function(d) {
	    d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
	})
       
	feature = svg.selectAll("circle")
	    .data(collection.features)
	    .enter().append("g").append("circle")
            .attr("r", 6)
        
        bindClick(feature, "annee", 2011)
        
        feature
            .attr("class", "circle")

        function transition() {
	    feature.attr("cx",function(d) {
                var plusOrMinus = Math.random() < 0.5 ? -1 : 1; 
                return map.latLngToLayerPoint(d.LatLng).x + (plusOrMinus * Math.random() * 1000); 
            });
            feature.attr("cy",function(d) {
                var plusOrMinus = Math.random() < 0.5 ? -1 : 1; 
                return map.latLngToLayerPoint(d.LatLng).y + (plusOrMinus * Math.random() * 1000); 
            });
            feature.transition()
                .duration(1000)
                .attr("cx",function(d){
                    return map.latLngToLayerPoint(d.LatLng).x
                }).transition()
                .duration(1000)
                .attr("cy",function(d){
                    return map.latLngToLayerPoint(d.LatLng).y
                })                                      
	}
        
        transition();
    })
});

/*-------------------------------------------------------
Function to clear everything related to a specific region
-------------------------------------------------------*/
function clear(region){
    svg.selectAll(".link").remove();
    svg.selectAll(".r" + region).remove();
    $("#" + region).remove();
    $("#s" + region).remove();
    REGNUMS[region] = "";
}

/*-------------------------------------------------------
Function to clear all regions
-------------------------------------------------------*/
function clearAll(){
    svg.selectAll(".link").remove();
    svg.selectAll(".region").remove();

    $("#info").empty();
    REGNUMS = [];

    TOTAL_POP = 0;
    TOTAL_INV = 0;
    TOTAL_PCG_POP = 0;
    TOTAL_PCG_INV = 0;
}

/*--------------------------------------------------------------------
Function to calculate total population and investment on region select
---------------------------------------------------------------------*/
function sumTotal(feat){
    TOTAL_POP += feat.properties.population_totale;
    TOTAL_INV += feat.properties.total;
    TOTAL_PCG_POP += (feat.properties.population_totale/population_qc) * 100;
    TOTAL_PCG_INV += feat.properties.pcg_total;
}

/*-------------------------------------------------------------------
Function to calculate total population and investment on region close
--------------------------------------------------------------------*/
function subtractTotal(feat){
    TOTAL_POP -= feat.properties.population_totale;
    TOTAL_INV -= feat.properties.total;
    TOTAL_PCG_POP -= (feat.properties.population_totale/population_qc) * 100;
    TOTAL_PCG_INV -= feat.properties.pcg_total;
}

/*---------------------------------------------------------------------
Function to display total population and investment for selected regions
----------------------------------------------------------------------*/
function displayTotal(){
    var total = "<div class=\"rounded_corner\"><button id=\"closeAll\" class=\"closeRegion\">X</button><span class=\"info_num\">" + "<b>Total des r\351gions s\351lectionn\351es</b>" + "</span>" + "</br>" + "Population " + "<span class=\"info_num\">" + TOTAL_POP + " (" 
        +  Math.round(TOTAL_PCG_POP) + " %)" + "</span>" + "</br>" + "Investissements " + "<span class=\"info_num\">" + "$" + TOTAL_INV + " M" + " (" +  Math.round(TOTAL_PCG_INV) + " %)"
        + "</span>" + "</br></div>";

    var stotal = $("#stotal");

    if(stotal.length == 0){
        $("#info").prepend("<span id=\"stotal\"></span>");
    }
    
    $("#stotal").html(total);

    $("#closeAll").bind("click", function(e){
        clearAll();
    })
}

/*--------------------------------------------------------
Function to bind click to region features for a given year
---------------------------------------------------------*/
function bindClick(selection, filter_attr, filter_value){
    selection.filter(function(d, i){ return d.properties[filter_attr] != filter_value})
        .style("display", "none")
    
    population_qc = 0;
    
    selection.filter(function(d, i){ return d.properties[filter_attr] == filter_value})
        .style("display", "block")
        .each(function(d){
            population_qc += d.properties.population_totale;   
        })
        .on("click", function(feat,i) {
            featureClick(feat)   
        });      
}

/*------------------------------------------------------------------------------------------------
Function triggered on feature click that pops out nodes and display infos about the region clicked
------------------------------------------------------------------------------------------------*/
function featureClick(feat){ 
    var region = feat.properties.no_region;
    if(!REGNUMS[region]){
        sumTotal(feat)
    }
    
    clear(region);
    
    REGNUMS[region] = region;
    
    var json = jQuery.extend(true, {}, links);
    json.nodes[0].name = feat.properties.nom_region;
    json.nodes[0].x = map.latLngToLayerPoint(feat.LatLng).x
    json.nodes[0].y = map.latLngToLayerPoint(feat.LatLng).y
    
    var force = d3.layout.force()
        .gravity(0)
        .charge(-20)
        .friction(0.1)
        .nodes(json.nodes)
        .links(json.links)
        .distance(function(d){
            var total = feat.properties.total;
            return Math.sqrt(total) + 100;
        })
        .start();

    var node = svg.selectAll(".r" + region)
        .data(json.nodes)
        .enter().append("g")
        .attr("class", "region")
        .on("click", function(d, i){
            if(i == 0){
                subtractTotal(feat);
                displayTotal();
                clear(region);
            }
        })
        .call(force.drag);

    var content = "<div class=\"rounded_corner\"><button name=\"" + region + "\" class=\"closeRegion\">X</button><span class=\"info_num\">" + "<b>" + feat.properties.nom_region + "</b>" + "</span>" + "</br>" + "Population " + "<span class=\"info_num\">" + feat.properties.population_totale + " ("
        + Math.round((feat.properties.population_totale/population_qc) * 100, 2) + " %)" +  "</span>" + "</br>" + "Investissements " + "<span class=\"info_num\">" + "$" + feat.properties.total + " M" 
        + " (" + feat.properties.pcg_total + " %)" + "</span>" + "</br></div>";

/* + "% des investissements en sant\351 : " + "<span class=\"info_num\">" 
        + feat.properties.pcg_total + " %" + "</span>" + "</br>" + "% de la population totale du Qu\351bec : " + "<span class=\"info_num\">" +  Math.round((feat.properties.population_totale/population_qc) * 100, 2) 
        + " %" + "</span>" + "</br>";   */
    
    var sr = $("#s" + region);
    if(sr.length == 0){
        $("#info").append($("<span></span>").attr("id", "s" + region).html(content));
        $(".closeRegion[name=" + region + "]").bind("click", function(e){
            clear($(this).attr("name"))
 
            var feat = feature.filter(function(d, i){ return d.properties["no_region"] == region && d.properties["annee"] == currentYear});
            subtractTotal(feat.data()[0]);
            displayTotal();
        })
    } else{
        sr.html(content);
    }

    displayTotal();

    var offsetX = -150;
    
    node.append("circle")
        .attr("class", "node " + "r" + region)
        .attr("fill", function(d){
            return d.color
        })
        .attr("cx", offsetX)
        .attr("r", function(d){
            if(d.property == "total"){
                var r = 6;
            } else {
                var r = 20 + Math.sqrt(feat.properties[d.property]);
            }
            return r;
        });
    
    node.append("text")
        .attr("class", "inner_text " + "r" + region)
        .attr("dx", function(d){
            var span_length = $("<span>" + "$" + feat.properties[d.property] + " M" +  "</span>");
            span_length.attr("class", "inner_text")
            span_length.hide();
            span_length.prependTo('body');
            var width = span_length.width();
            span_length.remove();
            return -1 * width/2 + offsetX;
        })
        .attr("dy", ".35em")
        .text(function(d, i) {
            if(i == 0){
                var txt = ""
            } else{
                var txt = "$" + feat.properties[d.property] + " M";
            }
            return txt;
        });
    
    node.append("text")
        .attr("class", "outer_text " + "r" + region)
        .attr("dx", function(d){
            var span_length = $("<span>" + feat.properties.nom_region +  "</span>");
            span_length.attr("class", "outer_text")
            span_length.hide();
            span_length.prependTo('body');
            var width = span_length.width();
            span_length.remove();
            return -1 * width/2 + offsetX;
        })
        .attr("dy", 20)
        .text(function(d, i){
            if(i == 0){
                var txt = feat.properties.nom_region;
            } else{
                var txt = "";
            }
            return txt;
        })
    
    force.on("tick", function() {
        node.attr("transform", function(d) {
            var x = d.x - offsetX;
            var y = d.y;
            return "translate(" + x + "," + y + ")"; 
        })
    });                                      
}

/*-------------------------------------------
Function to draw points on the graph
-------------------------------------------*/
function addGraphPoint(year){
    //remove existing points and point labels
    graph.selectAll(".graph_point").remove();
    graph.selectAll(".graph_point_hl").remove();
    graph.selectAll(".graph_label").remove();

    //add points
    graph.selectAll(".graph_point")
        .data(data1.concat(data2).concat(data3))
        .enter().append("svg:circle")
        .attr("class", function(d, i){
            if(i >= (data2.length + data1.length)){
                i -= (data2.length + data1.length);
            } else if (i >= data1.length){
                i -= data1.length;
            }
            if(i == years.indexOf(year)){
                var cls = "graph_point_hl";
            } else {
                var cls = "graph_point";
            }
            return cls;
        })
        .attr("stroke", function(d, i){
            if(i >= (data2.length + data1.length)){
                var stroke = color3;
            } else if(i >= data1.length){
                var stroke = color2;
            } else {
                stroke = color1;
            }
            return stroke;
        })
        .attr("cx", function(d, i){
            if(i >= (data2.length + data1.length)){
                i -= (data2.length + data1.length);
            } else if (i >= data1.length){
                i -= data1.length;
            }
            return x(i + years[0]);
        })
        .attr("cy", function(d, i){
            return y(d);
        })
        .attr("r", function(d, i){
            if(i >= (data2.length + data1.length)){
                i -= (data2.length + data1.length);
            } else if (i >= data1.length){
                i -= data1.length;
            }
            if(i == years.indexOf(year)){
                var r = 6;
            } else {
                var r = 4;
            }
            return r;
        })

    //add labels
    graph.selectAll(".graph_label")
        .data(function(){
            var p = years.indexOf(year);
            return [data1[p], data2[p], data3[p]];    
        })
        .enter().append("svg:g")
        .attr("class", "graph_label")
        .attr("transform", function(d, i){
            return "translate(" +  x(years[years.length - 1]) + "," + y(d) + ")";
        })
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", function(d, i){
            var fill = "color" + (i + 1);
            return fill;
        })
        .text(function(d){
            return "$" + d + " G";
        })
        .attr("text-anchor", "start")
        .attr("dy", 5)
        .attr("dx", 7)                
}

function displayTitle(year){
    graph.select(".graph_subtitle").remove();

    graph.selectAll(".graph_subtitle")
        .data(function(){
            var p = years.indexOf(year);
            return [Math.round((data1[p] + data2[p] + data3[p]) * 10) / 10];    
        })
        .enter().append("text")
        .attr("class", "graph_subtitle")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dx", 35)
        .attr("dy", -20)
        .text(function(d){
            return "Budget total: " + d + " milliards";
        })
    
}

function checkInternetExplorerVersion()
{
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null){
            rv = parseFloat( RegExp.$1 );
        }
        if(rv != 9){
            $("#warning").dialog({
                modal: true,
                width: "40%"
            })
        }
    }
}