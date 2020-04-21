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
    var interval = 1700;
    for (let i = 0; i < 9; ++i) {
        color_range.push(interval);
        interval *= 2;
    }
    console.log(color_range);
    // Data and color scale
    var colorScale = d3
        .scaleThreshold()
        .domain(color_range)
        .range(d3.schemeGreens[9]);

    var files = [
        "data/TOWN_MOI_1090324.json",
        // "population103-107.json",
        "data/opendata103N010.json",
        "data/opendata104N010.json",
        "data/opendata105N010.json",
        "data/opendata106N010.json",
        "data/opendata107N010.json",
        "data/opendata108N010.json",
    ];

    Promise.all(files.map((url) => d3.json(url))).then(function (values) {
        document
            .querySelector("#year-slider")
            .addEventListener("change", (e) => {
                let year = e.target.value;

                if (year in population_data) {
                    svg.selectAll("path.taiwan")
                        .data(taiwan.features)
                        .attr("fill", function (data) {
                            let id =
                                data.properties.COUNTYNAME +
                                data.properties.TOWNNAME;
                            id = id.substring(0, id.length - 1);

                            return colorScale(
                                population_data[year][id]["people_total"]
                            );
                        });
                }
            });

        // Load Data
        var population_data = {};
        for (let i = 1; i < values.length; ++i) {
            let data = {},
                year = values[i][0].statistic_yyy;
            for (let idx in values[i]) {
                let id = values[i][idx]["site_id"];
                id = id.substring(0, id.length - 1);
                data[id] = values[i][idx];
            }
            population_data[year] = data;
        }

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
                return colorScale(population_data[year][id]["people_total"]);
            })
            .attr("id", (data) => {
                return "city" + data.properties.TOWNID;
            })
            .on("mouseover", (data) => {
                let id = data.properties.COUNTYNAME + data.properties.TOWNNAME;
                id = id.substring(0, id.length - 1);
                let year = document.querySelector("#year-slider").value;
                let info_data = population_data[year][id];

                function Info() {
                    this.str = "";
                    this.add = (title, content) => {
                        this.str += title + ": " + content + "<br>";
                    };
                }

                var info = new Info();
                info.add("年份", info_data["statistic_yyy"]);
                info.add("縣市", data.properties.COUNTYNAME);
                info.add("城市", data.properties.TOWNNAME);
                info.add("人口數", info_data["people_total"]);
                info.add("面積", info_data["area"]);
                info.add("密度", info_data["population_density"]);

                document.querySelector(".info .content").innerHTML = info.str;
            });

        // Draw Boundary
        svg.append("path")
            .datum(taiwan)
            .attr("d", path)
            .attr("class", "boundary");
    });
}
