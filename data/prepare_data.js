const fs = require('fs');
const csv = require('csv-parser')
const data_csv1 = fs.readFileSync('data/prealgebra.csv', 'utf8');
const data_csv2 = fs.readFileSync('data/algebra.csv', 'utf8');
const data_csv3 = fs.readFileSync('data/algebraprecalc.csv', 'utf8');
const data_csv4 = fs.readFileSync('data/calculus.csv', 'utf8');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var data = {}
var nodes = {}
var links = []

var skip_row = 1
var start_id;

function process_csv(csv_file, course_name, course_id) {
    var all_remediations = [];
    rows = csv_file.split('\n')
    var local_nodes = {}
    for (var i = 0; i < rows.length; i++) {
        row = rows[i];
        if (i < skip_row || row === "") {
            continue;
        }

        var n = row.search('\"(.)*,(.)*\"'); //find entries that have commas in their skill title
        if (n == 0)
            row = row.replaceAll(", ", "; "); //temporary replace a comma with a ;
        columns = row.split(",");
        id = columns[1];
        //start the start id
        if (i === 1) {
            start_id = id;
        }
        
        if (n == 0)
            name = columns[0].replaceAll("; ", ", "); //put back the comma in the name of the skills
        else
            name = columns[0];
        //remove any quotes
        name = name.replaceAll('"', "");
        //console.log(columns);
        var regex_group = /\.\d(\w)/
        var found = name.match(regex_group);
        //console.log(name, found);
        var group;
        if (found) {
            group = found[1];
        }

        else {
            group = '';
        }
        var regex_section = /(\d*)\.(\d*)/
        found = name.match(regex_section);
        var section = found[1];
        var subsection = found[2];


        //clean the name
        var regex_name = /(\d*\.\d*(\w | \s))(.*)/
        found = name.match(regex_name);

        name = found[3];
        
   
        nodes[id] = { "id": id, "name": name, "section": section, "subsection": subsection, "group": group, "course_id": course_id, "c_name": course_name};
        local_nodes[id] = { "id": id, "name": name, "section": section, "subsection": subsection, "group": group, "course_id": course_id, "c_name": course_name};


        //remediations
        remediations = []
        for (var j = 2; j < columns.length; j++) {
            if (columns[j] === "" || columns[j] === "\r") {
                continue;
            }
            rem = columns[j].replace("\r", "")
            if(rem === "5eaedae55adf0d000485347a" || rem === "5edb7ea63206d335629ac4a8" ){
                console.log("Found them!");
                continue;
            }
            remediations.push(rem);
        }
        //add remediations to links
        for (let r of remediations) {
            if(!all_remediations.includes(r)){
                all_remediations.push(r);
            }
            //check if self-cycle
            if (id === r)
                continue;
            else {
                links.push([id, r]);
            }
        }

    }
    //console.log("REMS:", all_remediations);
    terminal_topics = [];

    for(const node in local_nodes){
        if(all_remediations.includes(node)){
            nodes[node].terminal = false;
        }
        else{
            nodes[node].terminal = true;
        }
    }
    
}
process_csv(data_csv1, "Prealgebra", 1);
process_csv(data_csv2, "Algebra", 2);
process_csv(data_csv3, "College Algebra/Precalculus", 3);
process_csv(data_csv4, "Calculus", 4);


data = {
    "start": start_id,
    "nodes": nodes,
    "links": links
}

//console.log(data);

var jsonData = JSON.stringify(data);

fs.writeFile("test_data.js", jsonData, function (err) {
    if (err) {
        console.log(err);
    }
});
