var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var dbFileElm = document.getElementById('dbfile');

// Start the worker in which sql.js will run
var worker = new Worker("./js/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({action: 'open'});

function error(e) {
    console.log(e);
    errorElm.style.height = '2em';
    errorElm.textContent = e.message;
}

// Run a command in the database
function execute(commands) {
    tic();
    worker.onmessage = function (event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
            error({message: event.data.error});
            return;
        }

        tic();
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
    }
    worker.postMessage({action: 'exec', sql: commands});
}

// Create an HTML table
var tableCreate = function () {
    function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        var open = '<' + tagName + '>', close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
    }

    return function (columns, values) {
        var tbl = document.createElement('table');
        tbl.setAttribute("class", "table table-striped table-sm")
        var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        var rows = values.map(function (v) {
            return valconcat(v, 'td');
        });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        tbl.innerHTML = html;
        return tbl;
    }
}();

function execConfigContents(element) {
	if (dbFileElm.files.length) {
		let sql = element.parentElement.previousElementSibling.innerText
		execute(sql + ';');
		errorElm.textContent = "";
		errorElm.removeAttribute("class")
	} else {
		errorElm.textContent = "Please select DB!";
		errorElm.setAttribute("class", "alert alert-danger")
	}
}

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) {
    window.performance = {now: Date.now}
}

function tic() {
    tictime = performance.now()
}

function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || 'toc') + ": " + dt + "ms");
}

// Load a db from a file
dbFileElm.onchange = function () {
    var f = dbFileElm.files[0];
    var r = new FileReader();
    r.onload = function () {
        worker.onmessage = function () {
            toc("Loading database from file");
        };
        tic();
        try {
            worker.postMessage({action: 'open', buffer: r.result}, [r.result]);
        } catch (exception) {
            worker.postMessage({action: 'open', buffer: r.result});
        }
    }
    r.readAsArrayBuffer(f);
}