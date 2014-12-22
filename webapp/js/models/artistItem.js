// js/models/serie.js

var app = app || { models: {}, collections: {}, views: {} };

app.models.ArtistItem = Backbone.Model.extend({

    idAttribute: '_id',

    defaults: {
        name:'',
        dicName:'',
        rating: 0,
        progs: [],
        image: []
    },

    initialize: function() {
        console.log('Initialisation du modèle ArtistItem');
    },

});