const url = "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48";
const tBody = document.querySelector(".content__table_body");
const distanceHeader = document.getElementById("distance");
const coordinateDME = [55.410307, 37.902451];
const speedCoeff = 1.852;
const heightCoeff = 0.305;
let highlightedTrs = JSON.parse(localStorage.getItem("highlightedTrs") || "{}");
let sorting = JSON.parse(localStorage.getItem("sorting") || "true");

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
                    if (sorting) {
                        return aGetDistance - bGetDistance
                    } else {
                        return bGetDistance - aGetDistance;
                    }
                });
                this.render();
            })
            .catch(err => alert("Данные недоступны, перезагрузите страницу"));
    }

    static sortDistance() {
        let sortedRows = [...tBody.rows];
        if (!sorting) {
            sorting = true;
            localStorage.setItem("sorting", JSON.stringify(sorting));
            sortedRows.slice(1);
            sortedRows.sort((rowA, rowB) => rowA.cells[6].innerHTML - rowB.cells[6].innerHTML);
            tBody.append(...sortedRows);
        } else {
            sorting = false;
            localStorage.setItem("sorting", JSON.stringify(sorting));
            sortedRows.slice(1);
            sortedRows.sort((rowA, rowB) => rowB.cells[6].innerHTML - rowA.cells[6].innerHTML);
            tBody.append(...sortedRows);
        }
    }

    static highlight(tr) {
        let selectedTr = tr;
        let flight = tr.children[0].innerText;
        let selectedRowCells = [...selectedTr.cells];
        if (selectedTr) {
            selectedRowCells.forEach((elem) => {
                elem.classList.toggle("highlight");
                elem.classList.contains("highlight") ? highlightedTrs[flight] = true : highlightedTrs[flight] = false;
            });
            localStorage.setItem("highlightedTrs", JSON.stringify(highlightedTrs));
        }
    }

    render() {
        this.dataArray.forEach((elem, index) => {
            const newTr = document.createElement("tr");
            newTr.className = "tbody__th";
            if (tBody.children.length - 1 > index) {
                for (let i = index + 1; i < tBody.children.length; i++) {
                    tBody.removeChild(tBody.children[i]);
                }
            }
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
        for (let numFlight in highlightedTrs) {
            if (highlightedTrs[numFlight] === true) {
                indexHighlightedTrs.push(numFlight);
            }
        }
        indexHighlightedTrs.forEach((index) => {
            [...tBody.rows].forEach((elem) => {
                if (elem.children[0].innerText === index) {
                    let cellsOfHighlighted = [...elem.cells];
                    cellsOfHighlighted.forEach((td) => {
                    td.classList.add("highlight");
                    })
                }
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
setTimeout(function requestInfo() {
    getTable();
    setTimeout(requestInfo, 3000);
}, 0);


