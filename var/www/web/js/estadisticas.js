
function dibujarCharts() {
  var es_coleccion = document.getElementById('estadisticas-coleccion');
  var urlAlDocumento = document.getElementById("urlaldocumento").innerHTML;
  var segment = "pageUrl=="+urlAlDocumento;

  if (es_coleccion != null){
    urlAlDocumento = urlAlDocumento.replace(/\/$/, "");
    var parser = document.createElement('a');
    parser.href = urlAlDocumento;
    segment = "pageUrl=@"+parser.pathname;
    segment = segment + ',' + segment + '/';
  }

  var divARellenarBar = document.getElementById('estadisticas-documento');
  if (divARellenarBar) {
    drawPiwik(divARellenarBar, segment);
  }
  var divARellenarGeo = document.getElementById('estadisticas-documento-geo');
  if (divARellenarGeo) {
    drawGeo(divARellenarGeo, segment);
  }
}

function drawGeo(div, segment) {
  // obtengo por AJAX las estadisticas del Piwik. Obtengo un JSONP. La funcion de callback es la de success ver https://learn.jquery.com/ajax/jquery-ajax-methods/
  $.ajax({
    url: "http://estadisticas.bibliotecadigital.econ.uba.ar/",
    data: {
      module: "API",
      method: "UserCountry.getCountry",
      token_auth: "acc8b28381d06e016c6f510627c237e6",
      period: "range",
      date: "2015-09-01,today",
      idSite: 3,
      segment: segment,
      format: "json",
    },
    type: "GET",
    dataType: "jsonp", // the type of data we expect back
    jsonp: "jsoncallback", // https://learn.jquery.com/ajax/working-with-jsonp/
    success: function( data ) {
      datatable = [
        ["Country", "Descargas"]
      ];
      for (var i = 0, tot = data.length; i < tot; i++) {
        row = data[i];
        datatable[i + 1] = [row['label'], row['nb_visits']];
      };

      var data = google.visualization.arrayToDataTable(datatable);
      var options = {};
      var chart = new google.visualization.GeoChart(div);
      chart.draw(data, options);
    },
  });
}

function drawPiwik(div, segment) {
  // obtengo por AJAX las estadisticas del Piwik. Obtengo un JSONP. La funcion de callback es la de success ver https://learn.jquery.com/ajax/jquery-ajax-methods/
  $.ajax({
    url: "http://estadisticas.bibliotecadigital.econ.uba.ar/",
    data: {
      module: "API",
      method: "VisitsSummary.getUniqueVisitors",
      token_auth: "acc8b28381d06e016c6f510627c237e6",
      period: "month",
      date: "2015-09-01,today",
      idSite: 3,
      filter_limit: -1,
      segment: segment,
      format: "json",
    },
    type: "GET",
    dataType: "jsonp", // the type of data we expect back
    jsonp: "jsoncallback", // https://learn.jquery.com/ajax/working-with-jsonp/
    success: function( json ) {
      // Create the data table para Google Visualization API. Ver https://developers.google.com/chart/interactive/docs/reference
      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Mes');
      data.addColumn('number', 'Descargas');

      var encontreDatos = false;  // variable para empezar a armar la tabla cuando aparece un mes que no tiene 0 visitas. Esto es porque no todas las tesis se publicaron el mismo mes. Queremos graficar solo desde que se publicaron (graficamos desde que registramos visitas, que es casi lo mismo...)
      var totalDescargas = 0; // quiero la suma total de descargas.

      $.each(json, function(index, value){
        if (value > 0){ encontreDatos = true; }
        if (encontreDatos){
          var fechaStrings = index.split('-');
          var year = fechaStrings[0];
          var month = fechaStrings[1] - 1;  // los meses en Javascript van de 0 a 11.
          data.addRow([new Date(year, month), value]);
          totalDescargas = totalDescargas + value;
        }
      });

      // relleno datos de fecha de publicacion y total de descargas
      var fechaPublicacion = data.getValue(0,0); // quiero poner la fecha desde la que cuento en el div
      try {
        document.getElementById("fechaPublicacion").innerHTML = fechaPublicacion.toLocaleDateString("es", { year: 'numeric', month: 'long'});
        document.getElementById("totalDescargas").innerHTML = totalDescargas;
      }
      catch (e){}

      // Set chart options
      var options = {
        //'title':'Descargas del documento en formato PDF por mes',
        //'width':400,
        //'height':300,
        curveType: 'function',
        legend: {
          position: 'none'
        },
        backgroundColor: '#F9F9F9',
      };

      // Instantiate and draw our chart, passing in some options.
      var chart = new google.visualization.ColumnChart(div);

      //Esto es para que muestre solo el mes y el anio
      var formatter = new google.visualization.DateFormat({
        pattern: "LLLL yyyy"
      });
      formatter.format(data, 0);

      //dibujo el grafico
      chart.draw(data, options);

    },
  });

}
