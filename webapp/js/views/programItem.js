
var app = app || { models: {}, collections: {}, views: {} };

app.views.ProgramItem = Backbone.View.extend({

    tagName: 'div',
    className: 'program navigable',

    initialize: function (options) {
        console.log(options.source);
        if(options.source == 'bddp')
        {
            this.template = _.template( $( '#program_item_template' ).html() );
        }

        if(options.source == 'youtube')
        {
            this.template = _.template( $( '#youtube_item_template' ).html() );
        }

        if(options.source == 'concerts')
        {
            this.template = _.template( $( '#concert_item_template' ).html() );
        }

    },

    render: function() {
        
        this.$el.html( this.template( this.model.attributes ) );
        return this;
    } 
});