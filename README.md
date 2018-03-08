# greenstone-download-stats


[Greenstone Digital Library Software](http://greenstone.org/) no tiene un módulo de estadísticas. Entonces armé uno usando [Matomo (ex Piwki)](https://matomo.org/).


## Log processing

Matomo/Piwik habitualmente se usa con tracking a través de JS, para analizar qué páginas visita un usuario. Pero como a nosotros sólo nos interesan las descargas de PDFs, tuvimos que usar [la herramienta de análisis de logs de Matomo](https://matomo.org/docs/log-analytics-tool-how-to/) para procesar los logs de Apache.

### Log rotation

Ver archivo de configuración: <code>etc/logrotate.d/apache2</code>

Lo primero que hice fue aumentar la cantidad de logs que se guardan en el servidor, para evitar que se borren logs viejos. Como no se puede configurar para que se guarden por tiempo indeterminado, lo setté en 9999 semanas (191 años debería ser más que suficiente).

También agregue un <code>postrotate</code> hook para ejecutar la herramienta de análisis de logs en cada rotación de logs.

### Ajustes a la herramienta de log analysis

Cuando estudié qué ofrecía la API de Piwik, nuestro interés estaba en obtener visitas *únicas* por documento por mes.

Ver [acá](https://matomo.org/faq/general/faq_43/) y [acá](https://matomo.org/faq/general/faq_21418/) qué hace Matomo para detectar a un mismo usuario.

Ahora bien, como el principal objetivo de Matomo es el análisis de visitas en _sitios web_, la herramienta de análisis de logs no considera la descarga de archivos como PDF una *visita*, sino que los considera como una [*descarga*](https://matomo.org/faq/new-to-piwik/faq_47/). No hay forma de determinar "descargas únicas". Entonces, lo que hicimos fue, en la tool de importación, vaciar la lista de extensiones de archivos que son considerados como descargas para que Matomo considere que las descargas de PDFs son también visitas.

Eso se hizo creando una copia del archivo <code>/srv/piwik/misc/log-analytics/import_logs.py</code> (se ubicó en el mismo directorio, con el nombre <code>import_logs_sindownloads.py</code>). La única diferencia entre esos scripts es la constante <code>DOWNLOAD_EXTENSIONS</code>.

En retrospectiva, quizás esto fue innecesario, y podemos prescindir de la detección de "visitas únicas" y simplemente obtener desde [la API de Matomo](https://developer.matomo.org/api-reference/reporting-api#VisitsSummary) el dato de descargas (<code>VisitsSummary.getActions</code>) en vez del dato de _unique visitors_ (<code>VisitsSummary.getUniqueVisitors</code>).


## Visualización de estadísticas

### Javascript

Desarrollé un pequeño código en JS para extraer los datos de visitas de Matomo y visualizarlos con [Google Charts](https://developers.google.com/chart/).

El mismo puede encontrarse en <code>/var/www/web/js/estadisticas.js</code>.

### Modificaciones macros

Para poder usar el script de JS, en las macros tuve que agregar algunas cosas.

#### \_scriptpaginas\_ 

Se agregó esto para cargar requerimientos y lanzar la función <code>dibujarCharts</code> al terminar de cargar.

    <!-- estadisticas -->
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <scrpit type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.2/URI.min.js"></script>
    <script type="text/javascript" src="_httpweb_/web/js/estadisticas.js"></script>

    <script type="text/javascript">
        // Load the Visualization API and the piechart package.
        google.load('visualization', '1.0', \{
          'packages': ['corechart', 'geochart'],
          'language': 'es'
        \});

        // Set a callback to run when the Google Visualization API is loaded.
        $( document ).ready( function() \{
          google.setOnLoadCallback(dibujarCharts);
        \});
    </script>

#### Global de colección

En el <code>collect.cfg</code> de cada colección (por ej. <code>/var/www/collect/tpos/etc/collect.cfg</code> para Tesis de Posgrado) agregué esto en la sección <code>collectionmeta collectionextra</code>.

    <div hidden id=\"urlaldocumento\">_httpweb_/download/_cgiargc_/</div>
    <div id=\"estadisticas-coleccion\"></div>
    <h6>Descargas mensuales</h6>
    <div id=\"estadisticas-documento\"></div>

    <h6>Distrubuci&oacute;n geogr&aacute;fica</h6>
    <div id=\"estadisticas-documento-geo\"></div>

#### Estadísticas de cada documento

En el <code>collect.cfg</code> de cada colección (por ej. <code>/var/www/collect/tpos/etc/collect.cfg</code> para Tesis de Posgrado) agregué esto en la sección <code>DocumentText</code>.

    <div hidden id=\"urlaldocumento\">_httpweb_/download/_cgiargc_/</div>
    <div id=\"estadisticas-coleccion\"></div>
    <h6>Descargas mensuales</h6>
    <div id=\"estadisticas-documento\"></div>

    <h6>Distrubuci&oacute;n geogr&aacute;fica</h6>
    <div id=\"estadisticas-documento-geo\"></div>

