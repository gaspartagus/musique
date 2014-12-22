
app.views.Artiste = Backbone.View.extend({
    tagName: 'div',
    className: 'section',
    template: _.template( $( '#artist_fiche_template' ).html() ),

    initialize: function(options) {

        console.log('artiste initialize',options);

        this.artiste = options.dicName;
        this.model = options.model;

        this.$el.html( $('<div>', { class: 'section'}) );

        this.$el = $('.section');
        
        $('#left').attr('data-nav-area','.menu_nav');

    },

    events: {
        'click .bddp .program': function(elem) {
            var progId = $(elem.currentTarget).find('div').attr('id');
            console.log(progId);
            app.router.navigateTo('programme/' + progId, true);
        },
        'click .you .program': function(elem) {
            var id = $(elem.currentTarget).find('div').attr('id');
            console.log(id);
            app.router.navigateTo('youtube/' + id, true);
        },
        'mouseover .menu_in': function(elem) {
            console.log('navigation vers le menu de gauche');
            $('#left').addClass('nav');
            $('.filter').addClass('actif');
            app.mainView.mouse.focus($('.menu_nav')[0]);
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
        this.$el.append( $('<div>', { class: 'menu_in navigable' }) );

        var models = this.model.get('progs').map(function(item){
            console.log(item);
            return new app.models.Programme(item);
        });

        app.currentBddpCollection = new app.collections.Programmes(models);

        var bddpPrograms = new app.views.Programmes(
            {
                el: $('.bddp'),
                collection: app.currentBddpCollection,
                source: 'bddp'
            }
        ).render();
        
        var models = this.model.get('youtube').map(function(item){
            console.log(item);
            return new app.models.Programme(item);
        });

        app.currentYoutubeCollection = new app.collections.Programmes(models);

        var youtubePrograms = new app.views.Programmes(
            {
                el: $('.you'),
                collection: app.currentYoutubeCollection,
                source: 'youtube'
            }
        ).render();

        app.mainView.mouse.focus($('.navigable')[0]);

        return this;
    },
    focus: function()
    {
        console.log('focus')
        app.mainView.mouse.focus($('.navigable')[0]);
    }
    
});