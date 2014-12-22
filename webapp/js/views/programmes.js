
app.views.Programmes = Backbone.View.extend({

    categories: ['Film','Concert','Mag.','Doc.','Téléfilm'],
    subViews: [],

    initialize: function(options) {

        console.log('Programmes initialize',options);

        this.source = options.source;

        //this.$el.attr('data-nav-area', ".navigable" );
    },

    events: {
        'mouseover .menu_in': function(elem) {
            console.log('navigation vers le menu de gauche');
            $('#left').addClass('nav');
            $('.filter').addClass('actif');
            app.mainView.mouse.focus($('.menu_nav')[0]);
        },
        'mouseover .navigable': function(elem) {

            var o = $(elem.currentTarget).offset().top;
            var p = o - $('.titre').position().top;
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
        console.log('collection de la vue programmes = ', this.collection);

        if(this.source == 'concerts')
        {
            this.$el.append( $('<div>', { class: 'menu_in navigable' }) );

            for (var i = this.categories.length - 1; i >= 0; i--) {

                var cat = this.categories[i];

                console.log(cat);

                var subItems = _.filter(this.collection.models, function(model){

                    var comp = {};
                    comp.cat = model.get('categories').indexOf(cat) > -1;
                    comp.proj = model.get('proj') > 0.1;
                    return comp.cat && comp.proj;
                });

                console.log(subItems);

                if(subItems.length)
                {
                    this.$el.append( $('<h1>',{ class: 'titre', text: cat+'s' }));

                    subItems.forEach(function( item ) {
                        console.log('item = ', item);
                        this.renderItem( item );
                    }, this );
                }
            }
            app.mainView.mouse.focus($('.program')[0]);
        }
        else
        {
            this.collection.each(function( item ) {
                this.renderItem( item );
            }, this );
        }
    },

    renderItem: function( item )
    {

        var programView = new app.views.ProgramItem({ model: item, source: this.source });

        this.$el.append( programView.render().el );
        
        this.subViews.push(programView);
        //this.jQelements.push($('#' + programView.model.attributes.id));
    },

    focus: function()
    {
        console.log('focus')
        app.mainView.mouse.focus($('.program')[0]);
    }
    
});