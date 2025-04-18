const L = window.L

var map = L.map('map').setView([12.8797, 121.7740], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    //attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
    }).addTo(map);

var geojson = L.geoJSON().addTo(map);

async function load_regions(){
    const response = await fetch("regions.geojson");
    const shape = await response.json();
    return shape;
}

async function regions_to_map(){
    const json = await load_regions();
    geojson.addData(json);
    geojson.setStyle({color:'rgb(13,   8, 135)'})
}

regions_to_map()

var stats = {};
var names = {};
var to_comp = []
async function getThatFile (url){
    const response = await fetch(url);
    const data = await response.json();
    return data;
}
async function getStatsFile(){
    const data = await getThatFile("stats.json");
    Object.assign(stats,data);
    const data2 = await getThatFile("names.json");
    Object.assign(names,data2);
}

function changeCategory(cat){
    to_comp = [];
    cat_keys = Object.keys(stats[cat]);
    const buttonspace = document.getElementById("buttons_options");
    while (buttonspace.lastElementChild) {
        buttonspace.removeChild(buttonspace.lastElementChild);
    }
    for (i=0;i<cat_keys.length;i++){
        const newButton = document.createElement('button');
        newButton.setAttribute("class","choices")
        newButton.setAttribute("role","switch")
        newButton.setAttribute("value",cat_keys[i])
        newButton.setAttribute("aria-checked","false")
        newButton.textContent = cat_keys[i]
        newButton.addEventListener("click", function(){
            currentState = this.getAttribute("aria-checked") === "true";
            val = this.getAttribute("value")
            if (currentState){to_comp.splice(to_comp.indexOf(val),1);}
            else{to_comp.push(val);}
            this.setAttribute("aria-checked",String(!currentState));
        });

        newButton.addEventListener("click",set_regions_style)

        buttonspace.appendChild(newButton);
    }
}

function computePercent(feature){
    code = feature.properties["ADM1_PCODE"]
    select = document.getElementById("cat")
    cat = select.value
    total = stats["total"][code]
    wanted = 0
    for (i=0;i<to_comp.length;i++){
        wanted += stats[cat][to_comp[i]][code]
    }
    return 100*wanted/total
}
function to_color(perc){ //0,2.5,10,20,35,55,80
    if(perc>80){col='rgb(240, 249,  33)'}
    else if(perc>55){col='rgb(253, 180,  47)'}
    else if(perc>35){col='rgb(237, 121,  83)'}
    else if(perc>20){col='rgb(204,  71, 120)'}
    else if(perc>10){col='rgb(156,  23, 158)'}
    else if(perc>2.5){col='rgb(92,   1, 166)'}
    else if(perc>=0){col='rgb(13,   8, 135)'}
    return {color: col}
}

function set_regions_style(){
    geojson.setStyle(function(feature){
        perc = computePercent(feature);
        color = to_color(perc);
        return color;
    })
}


select = document.getElementById("cat");
select.addEventListener("change",set_regions_style)
getStatsFile().then(()=>changeCategory(select.value))
