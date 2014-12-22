
var app = app || { models: {}, collections: {}, views: {} };

app.collections.Programmes = Backbone.Collection.extend({

  model: app.models.Programme,

	initialize: function(options) {
		console.log('Initialisation de la collection programmes');

		if(options.hasOwnProperty('url'))
		    this.url = app.rootUrl + options.url;
		// console.log(this.url);
		return this;

	},

	comparator: function(model1, model2) {
		if(model1.attributes.hasOwnProperty('proj'))
		{
			if(model1.get('proj') > model2.get('proj'))
				return -1;
			else return 1;
		}
		else return 1;
	}
});