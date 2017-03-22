/*
TODO: funktion schreiben, die eine spalte hinzufügen kann zur tabelle!
und diese dann am besten über ein callback oder Promise?
so befüllt

  id - id des divs im menü, bei on Click wird die Spalte hinzugefügt und
    für jede zeile das callback mit der dnr aufgerufen
  name - array von dict mit Maschinenname (wird für css klassen etc. verwendet)
          und Menschennamen (wird angezeigt in der ui) der spalten:
            [{calcname : "sandienststunden", uiname: "Dienststunden d. l. 6 Monate"}, ]


  callback - callback, das (dnr, name, td)
        dnr - Dienstnummer
        name - Das DictObject mit classname und Name der Spalte, aus dem names array
        td - die Tabellenzelle als jquery Object
    der Spalte die berechnet werden soll übergeben bekommt,
    der return des callback wird in die tabellenzelle geschrieben

*/
var clicked = {};
function addCalculationHandler(id, names, callback) {

  $(id).click(function() {
    if (id in clicked) { //verhindern, das eine Spalte mehrmals hinzugefügt wird
      return;
    }
    clicked[id] = true;

    var exportTable = $(".export");
    names.forEach( function(name) {
        console.log("addCalculationHandler --> names " + name.calcname + " mit ui "+ name.uiname);

        columns.push({
          data: name.calcname,
          title: name.uiname,
          defaultContent: ""
        });

        initDataTable();


        //TODO: solange das läuft kleines fenster anzeigen bzw. user informieren!
        var ready = Promise.resolve();
        for (index in dataSet) {
          var row = dataSet[index];
          //dataSet[index][name.calcname] = "eins";
          console.log("addCalculationHandler --> lade für dnr: " + row.DNR);


          var p = new Promise(function(resolve, raise) {
               var i = index;
               var r = row;
               var c = columns.length - 1;
               resolve(callback(r.DNR, name)
                .then(function(value) {
                  r[name.calcname] = value;
                  //console.log("get cell: " + i + "#" + c);
                  datatable.cell(i, c).invalidate().draw();
                  console.log("addCalculationHandler --> füge value " + value + " für spalte " + name.calcname + " in dataSet zeile " + i + " dnr: "+ r.DNR + "hinzu");
                })
                .catch(function(error) {
                  console.log("addCalculationHandler -> promise then mit error: " + error);
                }));
          });
          ready = ready.then(function() {
           return p;
          });

        }
        ready.then(function() { //warte auf die promises...
          console.log("addCalculationHandler --> promises should be resolved....refresh DataTable data");

          // columns.push({
          //   data: "testdata",
          //   title: "Leere Daten",
          //   defaultContent: "leer"
          // });

          //initDataTable();  //erzeuge DataTable erneut!
        });



        //exportTable.find("tr:gt(0)").append("<td class='" + names[n].calcname + "'>Berechnen...</td>");
        //exportTable.find("tr:first").append("<th>" + names[n].uiname + "</th>");

        // exportTable.find("tr:gt(0)").each(function(index, element) {
        //   var dnr = $(element).find("td:first").text();
        //   var td = $(element).find("td." + names[n].calcname);
        //   callback(dnr, n).then(
        //     function (value) {
        //       console.log("addCalculationHandler --> promise then value:" + value);
        //         td.text(value);
        //     },
        //     function (error) {
        //         console.log("addCalculationHandler -> promise then mit error: " + error);
        //         td.text(error);
        //     });
        //     //hier darauf warten, dass callback fertig! um niu von zu vielen Requests zu entlasten
        //     //und diese hier seriell abzuarbeiten!
        //
        // });
    });


  });

}


//TODO: die gesamte Tabelle irgendwie sortierbar machen
/*
  eventuell mit plugin wie
  dynatable https://www.dynatable.com/#event-hooks
  tablesorter http://tablesorter.com/docs/

*/

var dataSet = new Array;
var columns = new Array;
// var dataTableColumns = new Array;
var datatable = undefined;
function initDataTable() {
  console.log("initDataTable --> dataSet lenght: " + dataSet.length );
  console.log("initDataTable --> columns: " + columns.length);

  if (!(datatable === undefined)) {
      datatable.destroy();
      console.log("initDataTable --> after destroy: dataSet lenght: " + dataSet.length + " columns: " + columns.length);
      datatable = undefined;
  }
  // var exportTable = $(".export");
  // columns = new Array;
  // //var headers = [];
  // //parse first column also die headers...
  // exportTable.find("tr:first th").each( function(index) {
  //   console.log("index " + index + " mit th " + $(this).text());
  //     //headers.push($(this).text());
  //     columns.push( {
  //       data: $(this).text(),
  //       title: $(this).text()
  //     });
  // });
  // for (index in columns) {
  //     dataTableColumns.push($.extend({}, columns[index]));
  // }


  console.log("initDataTable --> dataSet:" + JSON.stringify(dataSet));
  console.log("initDataTable --> dataTableColumns:" + JSON.stringify(columns));

  $('#datatablediv').empty();

  datatable = $('<table id="datatable"></table>')
  $('#datatablediv').append(datatable);

  datatable = datatable.DataTable({
    destroy: true,
    data: dataSet,
    columns: columns
  });

  //verändere css, damit die sorting images angezeigt werden!
  $("#datatable").find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  $("#datatable").find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  $("#datatable").find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');

}

$(document).ready(function() {

  var exportTable = $(".export");

  var headers = [];
  //parse first column also die headers...
  exportTable.find("tr:first th").each( function(index) {
    console.log("index " + index + " mit th " + $(this).text());
      headers.push($(this).text());
      columns.push( {
        data: $(this).text(),
        title: $(this).text()
      });
  });

  //parse data
  exportTable.find("tr:gt(0)").each( function(index) {
      var row = {};
      $(this).find("td").each(function(index) {
        row[headers[index]] = $(this).text();
      });
      dataSet.push(row);
  });

  //exportTable.after("<p>Hallo Welt</p>");
  exportTable.after("<div id='datatablediv'></div>");
  exportTable.hide();
  initDataTable();


  var header = $("#ctl00_m_Header");



  /*
    lade das Menü, mit den möglichen Berechnungen
    es wäre unklug gleich alle Berechnungen zu machen -> zu viele
    Requests und nicht jeder MA braucht alle Berechnungen
    TODO:
  */
  var path = chrome.extension.getURL("src/webcontent/employee_dump_menu.html");
  console.log("path: " + path);
  $.get(path, function(data) {

    header.after(data);
    //data.menu();
    $("#menu").menu();




    //$("#rddienste").trigger("click");

    addCalculationHandler("#grundkurse", [{calcname : "grundkurse", uiname : "Grundkurse"}], function(dnr, name) {
       //verkettete Promises...

       var grundkurse = {
                           kurs1 : { "Name" : "BAS - Ausbildung - Das Rote Kreuz - Auch du bist ein Teil davon! (QM)", "altName1" : "BAS - Ausbildung - Das Rote Kreuz - auch du bist ein Teil davon!", "altName2" : "", "absolved" : "?" },
                           kurs2 : { "Name" : "SAN - Ausbildung - RS Ambulanzseminar", "altName1" : "", "altName2" : "", "absolved" : "?" },
                           kurs3 : { "Name" : "BAS - Ausbildung - KHD-SD-Praxis", "altName1" : "BAS - Ausbildung - KHD-Praxistag", "altName2" : "", "absolved" : "?" }
                         };

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return checkCourseAttendance(result.EID, grundkurse)
        }).then( function(resultDict) {
          return ("Das RK: " + resultDict.kurs1.absolved + "<br />AmbSem: " + resultDict.kurs2.absolved + "<br />KHD-SD: " + resultDict.kurs3.absolved);
        });

     });

    // $("#grundkurse").click(function() {
    //   console.log("grundkurse gecklickt!");
    //   if ("grundkurse" in clicked) {
    //     return;
    //   }
    //   clicked["grundkurse"] = true;
    //
    //
    //   var grundkurse = {
    //                     kurs1 : { "Name" : "BAS - Ausbildung - Das Rote Kreuz - Auch du bist ein Teil davon! (QM)", "altName1" : "BAS - Ausbildung - Das Rote Kreuz - auch du bist ein Teil davon!", "altName2" : "", "absolved" : "?" },
    //                     kurs2 : { "Name" : "SAN - Ausbildung - RS Ambulanzseminar", "altName1" : "", "altName2" : "", "absolved" : "?" },
    //                     kurs3 : { "Name" : "BAS - Ausbildung - KHD-SD-Praxis", "altName1" : "BAS - Ausbildung - KHD-Praxistag", "altName2" : "", "absolved" : "?" }
    //                   };
    //
    //   exportTable.find("tr:gt(0)").append("<td class='grundkurse'>Berechnen...</td>");
    //   exportTable.find("tr:first").append("<th>Grundkurse</th>");
    //
    //   exportTable.find("tr:gt(0)").each(function(index, element) {
    //       var dnr = $(element).find("td:first").text();
    //
    //         dnrToIdentifier(dnr).then(
    //         function(result) {
    //         console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
    //
    //         checkCourseAttendance(result.EID, grundkurse).then(
    //         function(resultDict) {
    //         $(element).find(".grundkurse").html("Das RK: " + resultDict.kurs1.absolved + "<br />AmbSem: " + resultDict.kurs2.absolved + "<br />KHD-SD: " + resultDict.kurs3.absolved);
    //         },
    //         function() {
    //         console.log("grundkurse --> error checkCourseAttendance");
    //         $(element).find(".grundkurse").text("error checkCourseAttendance");
    //         });
    //         },
    //         function() {
    //         console.log("grundkurse --> error dnrToIdentifier");
    //         $(element).find(".grundkurse").text("error dnrToIdentifier");
    //         });
    //
    //
    //   });
    //
    // });


    addCalculationHandler("#sandienststunden", [{calcname : "dienststunden", uiname : "Dienststunden d. l. 6 Monate"}], function(dnr, name) {
       //verkettete Promises...
       return dnrToIdentifier(dnr).then(
              function(result) {
                console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                return calculateDutyStatistic(result.ENID, "");
              }).then(
                function(statresult) {
                  return statresult["hourDutyAs"]["SAN_RD"];
                }
              );
      });


      addCalculationHandler("#rddienste", [{calcname : "rddienste", uiname : "Dienste d. l. 6 Monate"}], function(dnr, name){
        return dnrToIdentifier(dnr).then(
               function(result) {
                 console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                 return calculateDutyStatistic(result.ENID, "");
               }).then(
                 function(statresult) {
                   return statresult["countDutyAs"]["SAN_RD"];
                 }
               );
      });

  }); //close $.get(path, function(data) {

});
