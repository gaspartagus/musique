
app.views.Artistes = Backbone.View.extend({

    subViews: [],

    initialize: function(options) {

        console.log('artistes initialize',options);
        this.tag = options.tag;

        this.$el.html( $('<div>', { class: 'artists_container'}) );

        this.$el = $('.artists_container');
        this.$el.append( $('<div>', { class: 'menu_in navigable' }) );

        $('<h1>',{ class: 'titre', text: this.tag }).appendTo(this.$el);
        $('<canvas>',{ class: 'canvas', id: 'canvas'}).attr({width:2000,height:1000}).appendTo(this.$el);
        $('<div>', { class: 'filter'}).appendTo($('#center'));

        var c = document.getElementById('canvas');
        this.canvas = c.getContext("2d");
        this.canvas.fillStyle = "#FF0000";
        this.canvas.fillRect(10,10,5,5);


    },

    events: {
        'click .tile': function(elem) {
            console.log('tile');

            app.router.internalFocus = true;

            this.$el.removeAttr('data-nav-area');
            $('#left').removeAttr('data-nav-area');

            $(elem.currentTarget).addClass('selected').attr('data-nav-area','.action');

            $('.filter').addClass('actif').on("click", this.removeFocus) ;

            app.mainView.mouse.focus($(elem.currentTarget).find($('.like'))[0]);
        },
        'click .fiche': function(elem) {

            var name = $(elem.currentTarget).attr('dicname');
            console.log(name);
            this.removeFocus();
            app.router.navigateTo('artiste/' + name, true);
        },
        'click .like': function(elem) {

            var name = $(elem.currentTarget).attr('dicname');
            console.log(name);

            jQuery.get(
                app.rootUrl + 'api/artistes/star/' + name
                ,function(data){ console.log(data); }
            );
            $(elem.currentTarget).parent().find('p').toggleClass('starred');
        },
        'click .titre': function(elem) {
            app.router.navigateTo('categories' , true);
        },
        'mouseover .menu_in': function(elem) {
            console.log('navigation vers le menu de gauche');
            $('#left').addClass('nav');
            $('.filter').addClass('actif');
            app.mainView.mouse.focus($('.menu_nav')[0]);
        }
    },

    render: function() {
        console.log('collection = ', this.collection);

        this.collection.each(function( item, index ) {
            this.renderItem( item ,index);
        }, this );

        this.subViews[0].$el.css('top',centre.x - 100 + 'px');
        this.subViews[0].$el.css('left',centre.y - 150 + 'px');

        this.matrix = addItemToGrid( [], this.subViews[0].el, {first: true, canvas: this.canvas});

        this.canvas.fillStyle = 'green';
        var l = this.subViews.length;

        for(var c = 0; c < (l-1)/8; c++){

            for (var i = 1; i<9 && i < l-8*c; i++) {
                var d = grid(i-1,600*(c+1),700*(c+1)); // compute the coordinates of the item on the c circle
                
                positionner(this.subViews[i+8*c].$el, [ centre.x + d[0], centre.y + d[1] ] , 0)

            };
            if(1)
            {

                for(var q = 0; q < l-8*c-1 && q<4; q++) // position all middle elements to their nearest corner
                {
                    var corner = computeNearestCorner(this.matrix,origine(this.subViews[q+1+8*c].el,q),q);
                    
                    positionner(this.subViews[q+1+8*c].$el,corner,q);

                    console.log(this.subViews[q+1+8*c].$el);

                    this.canvas.fillRect(corner[1],corner[0],5,5);

                }
                for(var q = 0; q < l-8*c-1 && q<4; q++) // update grid
                {
                    this.matrix = addItemToGrid( this.matrix, this.subViews[q+1+8*c].el, {first: false, canvas: this.canvas});
                }

                for(var q = 0; q < l-8*c-5 && q<4; q++) // position all corner elements to their nearest corner
                {
                    var corner = computeNearestCorner(this.matrix, origine(this.subViews[q+5+8*c].el,q), q);
                    
                    positionner(this.subViews[q+5+8*c].$el,corner,q);

                    console.log(this.subViews[q+5+8*c].$el);

                    this.canvas.fillRect(corner[1],corner[0],5,5);

                }
                for(var q = 0; q < l-8*c-5 && q<4; q++)
                {
                    this.matrix = addItemToGrid( this.matrix, this.subViews[q+5+8*c].el, {first: false, canvas: this.canvas});
                }
            }
        }

        app.mainView.mouse.focus($('.tile')[0]);
        //$('.loading').css('display', 'none');
        
        console.log('render finished');
    },

    renderItem: function( item,i)
    {
        var artistView = new app.views.ArtistItem({ model: item });

        this.$el.append( artistView.render().el);
        artistView.el = this.$el.children().last()[0];
        
        this.subViews[i] = artistView;
    },
    removeFocus: function()
    {
        if(app.router.internalFocus)
        {
            $('div[data-nav-area]').removeClass('selected').removeAttr('data-nav-area');

            $('#center').attr('data-nav-area','.navigable');
            $('#left').attr('data-nav-area','.menu_nav');
            $('.filter').removeClass('actif');
            //this.focus();

            app.router.internalFocus = false;
        }
    },
    focus: function()
    {
        console.log('focus')
        app.mainView.mouse.focus($('.tile')[0]);
    }
    
});