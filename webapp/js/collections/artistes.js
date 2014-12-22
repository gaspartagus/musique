// js/collections/series.js

var app = app || { models: {}, collections: {}, views: {} };

app.collections.Artistes = Backbone.Collection.extend({

	model: app.models.ArtistItem,

	initialize: function(options) {
		console.log('Initialisation de la collection Artistes avec tag:', options.tag);

	this.url = app.rootUrl + 'api/artistes/' + options.tag;
	console.log(this.url);

	},

	comparator: function(model1, model2) {
		if(model1.get('scale') > model2.get('scale'))
			return -1;
		else return 1;
	}
});