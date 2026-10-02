var date_fields = [];
(function (ckan, jQuery) {

  /* Returns a Leaflet map to use on the different spatial widgets
   *
   * All Leaflet based maps should use this constructor to provide consistent
   * look and feel and avoid duplication.
   *
   * container               - HTML element or id of the map container
   * mapConfig               - (Optional) CKAN config related to the base map.
   *                           These are defined in the config ini file (eg
   *                           map type, API keys if necessary, etc).
   * leafletMapOptions       - (Optional) Options to pass to the Leaflet Map constructor
   * leafletBaseLayerOptions - (Optional) Options to pass to the Leaflet TileLayer constructor
   *
   * Examples
   *
   *   // Will return a map with attribution control
   *   var map = ckan.commonLeafletMap('map', mapConfig);
   *
   *   // For smaller maps where the attribution is shown outside the map, pass
   *   // the following option:
   *   var map = ckan.commonLeafletMap('map', mapConfig, {attributionControl: false});
   *
   * Returns a Leaflet map object.
   */

  // Override the default marker icon configuration globally
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: '/base/images/twdh-marker-white.svg',
    iconRetinaUrl: '/base/images/twdh-marker-white.svg',
    shadowUrl: '/img/leaflet/marker-shadow.png',
    iconSize: [25, 41],         // size of the icon [width, height]
    iconAnchor: [12, 41],       // point of the icon which will correspond to marker's location
    popupAnchor: [1, -34],      // point from which the popup should open relative to the iconAnchor
    shadowSize: [41, 41]        // size of the shadow
  });



   var basemaps = [
     'Streets','Topographic','Oceans','OceansLabels','NationalGeographic','Gray','GrayLabels','DarkGray','DarkGrayLabels','Imagery','ImageryLabels','ImageryTransportation','ShadedRelief','ShadedReliefLabels','Terrain','TerrainLabels','USATopo',
   ];
   function checkBasemap(url) {
     return url.indexOf('{x}') > -1 && url.indexOf('{y}') > -1 && url.indexOf('{z}') > -1
   }
  ckan.agsCreatemap = function (container,
                                    config) {

      var isHttps = window.location.href.substring(0, 5).toLowerCase() === 'https';
      var mapConfig =  {type: 'stamen'};
      if (config.basemap && typeof config.basemap === 'string' && checkBasemap(config.basemap)) {
        mapConfig = {
          type: 'custom',
          url: config.basemap
        }
      }

      var leafletBaseLayerOptions = {
                maxZoom: 18
                }

      map = new L.Map(container, leafletBaseLayerOptions);
      if (typeof config.basemap === 'string' && basemaps.indexOf(config.basemap) > -1) {
        var esriLayer = new L.esri.BasemapLayer(config.basemap);
        map.addLayer(esriLayer);
      } else {
        if (mapConfig.type == 'custom') {
            // Custom XYZ layer
            baseLayerUrl = mapConfig.url;
        } else {
            // Default to Stamen base map
            baseLayerUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            leafletBaseLayerOptions.subdomains = mapConfig.subdomains || 'abcd';
            leafletBaseLayerOptions.attribution = mapConfig.attribution || '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a>';
        }

        var baseLayer = new L.TileLayer(baseLayerUrl, leafletBaseLayerOptions);
        map.addLayer(baseLayer);
  }
      return map;

  }
  function singleFeature(item) {
    var properties = item.properties;
    var keys = Object.keys(properties);
    return '<div>' + keys.map(function (key) {
      var value = properties[key];
      if (date_fields.indexOf(key) > -1) {
        date_value = new Date(value);
        value = date_value.toLocaleString(undefined, {
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          timeZoneName:'short'
        });
      }
      return '<span><strong>' + key + ':</strong> ' + value + '</span>';
    }).join('<br/>') + '</div>';
  }
  ckan.singleFeature = singleFeature;
  function manyFeatures(featureCollection) {
    return  '<div>' + featureCollection.features.map(function (item, i) {
      return '<div><strong>Feature: ' + (i + 1) + '</strong><div>'  + singleFeature(item) + '</div></div><br/>';
    }).join("") + '</div>';
  }
  ckan.commonDynamicLayerInfo = function (layer) {
    layer.bindPopup(function (err, featureCollection) {
      if (err || !featureCollection || !featureCollection.features || !featureCollection.features.length) {
        return false;
      }
      if (featureCollection.features.length === 1) {
        return singleFeature(featureCollection.features[0])
      }
      return manyFeatures(featureCollection);
    }, {
      maxHeight: 200
    });
  };
  ckan.commonTiledLayerInfo = function (layer) {
    layer.bindPopup('<span></span>', {
      maxHeight: 200
    });
    layer.on('click', function (e) {
      layer.setPopupContent('<span>loading</span>');
      layer.identify().at(e.latlng).run(function (err, featureCollection) {
        if (err) {
          layer.setPopupContent('<span><strong>Error</strong>: ' + err && err.toString()+'</span>');
          return;
        }
        if (!featureCollection || !featureCollection.features || !featureCollection.features.length) {
          layer.setPopupContent('<span>No features found</span>');
          return;
        }
        if (featureCollection.features.length === 1) {
          layer.setPopupContent(singleFeature(featureCollection.features[0]));
          return;
        }
        return layer.setPopupContent(manyFeatures(featureCollection));
      });
    })
  };
})(this.ckan, this.jQuery);
