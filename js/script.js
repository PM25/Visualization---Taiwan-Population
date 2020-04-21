window.onload = main;

function main() {
    var width = window.innerWidth,
        height = window.innerHeight;

    var svg = d3.select("svg");

    var projection = d3
        .geoMercator()
        .center([121, 24]) // 中心點(經緯度)
        .scale(width * 6) // 放大倍率
        .translate([width / 3, height / 2.5]) // 置中
        .precision(0.1);
    var path = d3.geoPath().projection(projection);

    const zoom = d3.zoom().scaleExtent([0.6, 10]).on("zoom", zoomed);
    svg.call(zoom);

    function zoomed() {
        svg.selectAll("path") // To prevent stroke width from scaling
            .attr("transform", d3.event.transform);
    }

    var color_range = [];
    var interval = -1000;
    for (let i = 0; i < 9; ++i) {
        color_range.push(interval);
        interval += 200;
    }
    console.log(color_range);
    // Data and color scale
    var colorScale = d3
        .scaleThreshold()
        .domain([-1000, -500, -300, -200, -100, 0, 500, 1000, 3000, 5000, 8000])
        .range(d3.schemeRdYlBu[11]);

    var colorscale = d3.schemeRdYlBu["11"];
    var color = d3
        .scaleQuantize()
        .domain([-1000, -500, -300, -200, -100, 0, 500, 1000, 3000, 5000, 8000])
        .range(colorscale);

    var files = ["data/TOWN_MOI_1090324.json", "data/population103-108.json"];

    Promise.all(files.map((url) => d3.json(url))).then(function (values) {
        document
            .querySelector("#year-slider")
            .addEventListener("change", (e) => {
                let year = e.target.value;

                svg.selectAll("path.taiwan")
                    .data(taiwan.features)
                    .transition()
                    .duration(800)
                    .attr("fill", function (data) {
                        let id =
                            data.properties.COUNTYNAME +
                            data.properties.TOWNNAME;
                        id = id.substring(0, id.length - 1);

                        return colorScale(
                            population_data[id]["people_total_diff"][
                                year - 2015
                            ]
                        );
                    });

                document.querySelector("#controller-year").innerHTML =
                    year + "年";
            });

        // Load Data
        population_data = values[1];

        // Draw Map
        taiwan = values[0];

        taiwan = topojson.feature(taiwan, taiwan.objects.TOWN_MOI_1090324);

        svg.selectAll("path")
            .data(taiwan.features)
            .enter()
            .append("path")
            .attr("class", "taiwan")
            .attr("d", path)
            .attr("fill", function (data) {
                let id = data.properties.COUNTYNAME + data.properties.TOWNNAME;
                id = id.substring(0, id.length - 1);
                let year = document.querySelector("#year-slider").value;
                return colorScale(
                    population_data[id]["people_total_diff"][year - 2015]
                );
            })
            .attr("id", (data) => {
                return "city" + data.properties.TOWNID;
            })
            .on("mouseover", (data) => {
                let id = data.properties.COUNTYNAME + data.properties.TOWNNAME;
                id = id.substring(0, id.length - 1);
                let year = document.querySelector("#year-slider").value;
                let info_data = population_data[id];

                function Info() {
                    this.str = "";
                    this.add = (title, content) => {
                        this.str += title + ": " + content + "<br>";
                    };
                }

                var info = new Info();
                info.add("年份", info_data["statistic_yyy"][year - 2014]);
                info.add("縣市", data.properties.COUNTYNAME);
                info.add("城市", data.properties.TOWNNAME);
                info.add("人口數", info_data["people_total"][year - 2014]);
                info.add(
                    "人口增長(跟前一年比)",
                    info_data["people_total_diff"][year - 2015]
                );
                info.add("面積", info_data["area"][year - 2014]);
                info.add(
                    "人口密度",
                    info_data["population_density"][year - 2014]
                );
                info.add(
                    "人口密度增長(跟前一年比)",
                    info_data["population_density_diff"][year - 2015]
                );

                document.querySelector(".info .content").innerHTML = info.str;
            });

        // Draw Boundary
        svg.append("path")
            .datum(taiwan)
            .attr("d", path)
            .attr("class", "boundary");

        drawColorScale();

        function drawColorScale() {
            let format = d3.format(".0f");
            var pallete = svg
                .append("g")
                .attr("id", "pallete")
                .attr("transform", "scale(1.3)");

            var swatch = pallete.selectAll("rect").data(colorscale);
            swatch
                .enter()
                .append("rect")
                .attr("fill", function (d) {
                    return d;
                })
                .attr("x", function (d, i) {
                    return i * 25 + 20;
                })
                .attr("y", 30)
                .attr("width", 25)
                .attr("height", 10);

            var texts = pallete
                .selectAll("foo")
                .data(color.range())
                .enter()
                .append("text")
                .attr("font-size", ".5em")
                .attr("text-anchor", "middle")
                .attr("y", 55)
                .attr("x", function (d, i) {
                    return i * 25 + 30;
                })
                .text(function (d) {
                    return format(color.invertExtent(d)[0]);
                })
                .append("tspan")
                .attr("dy", "1.3em")
                .attr("x", function (d, i) {
                    return i * 25 + 30;
                })
                .text("to")
                .append("tspan")
                .attr("dy", "1.3em")
                .attr("x", function (d, i) {
                    return i * 25 + 30;
                })
                .text(function (d) {
                    return format(color.invertExtent(d)[1]);
                });
        }
    });
}
