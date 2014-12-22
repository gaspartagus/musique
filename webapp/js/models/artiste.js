
var app = app || { models: {}, collections: {}, views: {} };

app.models.Artiste = Backbone.Model.extend({

    idAttribute: '_id',

    defaults: {
        name: '',
        dicName: '',
        rating: 0,
        progs: [],
        image: [],
        resume: {},
        stats: '',
        tags: []
    },

    initialize: function(options) {
        console.log('Initialisation du modèle Artiste');

        this.url = app.rootUrl + 'api/artiste/' + options.dicName;
    },

});