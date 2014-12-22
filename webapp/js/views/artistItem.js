
var app = app || { models: {}, collections: {}, views: {} };

app.views.ArtistItem = Backbone.View.extend({

    tagName: 'div',
    className: 'tile navigable',
    template: _.template( $( '#artist_item_template' ).html() ),

    initialize: function () {
        this.id = this.model.get('dicName');
        this.attributes = { 'style': 'z-index:' + this.model.get('scale') + ';' };
        console.log('Création de la vue pour '+this.id);
    },

    render: function() {
        
        this.$el.html( this.template( this.model.attributes ) );
        return this;
    } 
});