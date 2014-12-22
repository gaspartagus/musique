
app.views.Youtube = Backbone.View.extend({
    tagName: 'div',
    className: 'section',
    template: _.template( $( '#youtube_template' ).html() ),

    initialize: function(options) {

        console.log('youtube view initialize',options);

        this.artiste = options.artiste;
        this.model = options.model;

        this.$el.html( $('<div>', { class: 'scroll_view clearfix' }) );

        this.$el = $('.scroll_view');

        this.render();

    },

    events: {
        'click .progs .program': function(elem) {
            var id = $(elem.currentTarget).find('div').attr('id');
            console.log(id);
            app.router.navigateTo('youtube/' + id, true);
        },
        'mouseover .navigable': function(elem) {

            var o = $(elem.currentTarget).offset().top;
            var p = o - $('.section').position().top;
            var H = $('#center').height();
            var h = $(elem.currentTarget).height();

            //console.log('scrollTop',o,p,H,h);

            if(o + h > H)
                $('#center').scrollTop(p - H + h + 20);
            else if(o < 0)
                $('#center').scrollTop(p - 40);
        }
    },

    render: function() {
        
        this.$el.html( this.template( this.model.attributes ) );

        var apiKey = 'be5de2bfd68c419c887b4e99a62c1775';

        jQuery.get('https://api.embed.ly/1/oembed?key='
            + apiKey
            + '&url=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D'
            + this.model.get('_id') , function(data){
            console.log(data);
            $('.youtube_container')
            .html(data.html
                .replace( '//cdn', 'http://cdn' )
                .replace( '854', '77%' )
                .replace( '480', '100%' )
            );
        });

        var youtubePrograms = new app.views.Programmes(
            {
                el: $('.youtube_progs'),
                collection: app.currentYoutubeCollection,
                source: 'youtube'
            }
        ).render();


        return this;
    }
    
});