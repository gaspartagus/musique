// js/collections/series.js

var app = app || { models: {}, collections: {}, views: {} };

app.collections.Tags = Backbone.Collection.extend({

  model: app.models.Planet,

  initialize: function(options) {

    this.url = app.rootUrl + 'api/tags';
    
  }
});