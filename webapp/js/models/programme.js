
var app = app || { models: {}, collections: {}, views: {} };

app.models.Programme = Backbone.Model.extend({

    idAttribute: '_id',

    defaults: {

    },

    initialize: function(options) {
        console.log('Initialisation du modèle Programme');

        console.log(options);
        // if(options.hasOwnProperty('_id'))
        // 	this.idAttribute = '_id';
        // if(options.hasOwnProperty('id'))
        // 	this.idAttribute = 'id';

        //this.url = 'http://localhost:8080/api/artiste/' + options.dicName;
    },

});