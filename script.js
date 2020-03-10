const url = "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48";
const tBody = document.querySelector(".content__table_body");
const distanceHeader = document.getElementById("distance");
const coordinateDME = [55.410307, 37.902451];
const speedCoeff = 1.852;
const heightCoeff = 0.305;
let sortedIncrease = true;
let highlightedTrs = JSON.parse(localStorage.getItem("highlightedTrs") || "{}");

class Handler {
    dataArray = [];
    getDistanceFromLatLonInKm(lat, lon) {
        let R = 6371;
        let dLat = this.deg2rad(lat - coordinateDME[0]);
        let dLon = this.deg2rad(lon - coordinateDME[1]);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(coordinateDME [0])) * Math.cos(this.deg2rad(lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000;
    };

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    };

    getData() {
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    let data = Object.assign({}, json);
                    for (let key in data) {
                        if (Array.isArray(data[key])) {
                            this.dataArray.push(data[key]);
                        }
                    }
                    this.dataArray.sort((a, b) => {
                        const aGetDistance = this.getDistanceFromLatLonInKm(a[1], a[2]);
                        const bGetDistance = this.getDistanceFromLatLonInKm(b[1], b[2]);
                        return aGetDistance - bGetDistance;
                    });
                    this.render();
                })
                .catch(err => console.log(err));
    }
    static sortDistance() {
        let sortedRows = Array.from(tBody.rows);
        if (!sortedIncrease) {
            sortedIncrease = true;
            sortedRows.slice(1);
            sortedRows.sort((rowA, rowB) => rowA.cells[6].innerHTML - rowB.cells[6].innerHTML);
            tBody.append(...sortedRows);
        } else {
            sortedIncrease = false;
            sortedRows.slice(1);
            sortedRows.sort((rowA, rowB) => rowB.cells[6].innerHTML - rowA.cells[6].innerHTML);
            tBody.append(...sortedRows);
        }
    }
    static highlight(tr) {
        let selectedTr = tr;
        let rowIndex = String([...tBody.rows].indexOf(selectedTr));
        let selectedRowCells = [...selectedTr.cells];
        if (selectedTr) {
            selectedRowCells.forEach((elem) => {
                elem.classList.toggle("highlight");
                elem.classList.contains("highlight") ? highlightedTrs[rowIndex] = true : highlightedTrs[rowIndex] = false;
            });
            localStorage.setItem("highlightedTrs", JSON.stringify(highlightedTrs));
        }
    }

    render() {
        this.dataArray.forEach((elem, index) => {
            const newTr = document.createElement("tr");
            newTr.className = "tbody__th";
            if (tBody.children[index]) {
                tBody.replaceChild(newTr, tBody.children[index]);
            } else {
                tBody.appendChild(newTr);
            }
            let dataTd = [];
            const speed = (elem[5] * speedCoeff).toFixed();
            const height = (elem[4] * heightCoeff).toFixed();
            const distanceToDME = this.getDistanceFromLatLonInKm(elem[1], elem[2]);
            dataTd.push(elem[13], `${elem[1]}, ${elem[2]}`, speed, elem[3], height, `${elem[11]}/${elem[12]}`, distanceToDME.toFixed());
            dataTd.forEach((elem) => {
                const newTd = document.createElement("td");
                newTd.className = "tbody__th_td";
                (elem && elem !== "/") ? newTd.innerHTML = elem : newTd.innerHTML = "-";
                newTr.appendChild(newTd);
            });
        });
        let indexHighlightedTrs = [];
        for (let key in highlightedTrs) {
            if (highlightedTrs[key] === true) {
                indexHighlightedTrs.push(key);
            }
        }
        indexHighlightedTrs.forEach((index) => {
            let highlightedFromLS = [...tBody.rows][index];
            let cellsOfHighlighted = [...highlightedFromLS.cells];
            cellsOfHighlighted.forEach((elem) => {
                elem.classList.add("highlight");
            })
        });
    };
}

distanceHeader.addEventListener("click", Handler.sortDistance);

tBody.onclick = function (event) {
    let tr = event.target.closest('tr');
    if (!tr && !tBody.contains(tr)) return;
    Handler.highlight(tr);
};
function getTable() {
        let handler = new Handler();
        handler.getData();
}
setInterval(() => {
    getTable();
}, 3000);


