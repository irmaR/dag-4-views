const fs = require('fs');
const csv = require('csv-parser')
const data_csv = fs.readFileSync('prealgebra.csv', 'utf8' );

var data = {}
var nodes = {}
var links = []

var skip_row = 1
var start_id;

all_remediations = []

rows = data_csv.split('\n')
for(var i = 0; i < rows.length; i++){
    row = rows[i];
    if(i < skip_row || row === ""){
        continue;
    }

    var n = row.search('\"(.)*,(.)*\"'); //find entries that have commas in their skill title
    if (n == 0)
       row = row.replace(",", ";"); //temporary replace a comma with a ;
    
    columns = row.split(",");
    id = columns[1];

    //start the start id
    if(i === 1){
        start_id = id;
    }

    if (n == 0)
       name = columns[0].replace(";", ","); //put back the comma in the name of the skills
    else
        name = columns[0];

    var regex_group = /\.\d(\w)/
    var found = name.match(regex_group);
    var group;
    if (found){
        group = found[1];
    }

    else{
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

    nodes[id] = {"id": id, "name":name, "section": section, "subsection": subsection, "group": group};

    

    //remediations
    remediations = []
    for (var j = 2; j < columns.length; j++){
        if(columns[j] === "" || columns[j] === "\r") {
            continue;
        }
        rem = columns[j].replace("\r", "")
        remediations.push(rem);
    }
    //add remediations to links
    for(let r of remediations){
        if (!all_remediations.includes(r)){
            all_remediations.push(r);
        }
        //check if self-cycle
        if (id === r)
           continue;
        else{
        links.push([id, r]);
        }
    }
    
}

links = links.reverse();  
terminal_topics = []

var nr = 0;
for (const property in nodes) {
    if(!all_remediations.includes(property)){
        terminal_topics.push(property);
    }
  };
console.log(terminal_topics);

for (const node in nodes){
    if(terminal_topics.includes(node)){
        nodes[node].terminal = true;
    }
    else{
        nodes[node].terminal = false;
    }
};

data = {
   "start" : start_id,
   "nodes": nodes,
   "links": links
}


var jsonData = JSON.stringify(data);

fs.writeFile("test_data.js", jsonData, function(err) {
    if (err) {
        console.log(err);
    }
});
