// js/models/serie.js

var app = app || { models: {}, collections: {}, views: {} };

app.models.Planet = Backbone.Model.extend({

    idAttribute: 'id',
    
    defaults: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        masse: 1,
        tag: 'Music'
    },

    initialize: function() {
        console.log('Initialisation modèle tag');
    },

});