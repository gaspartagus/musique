// js/views/serie.js

var app = app || { models: {}, collections: {}, views: {} };


app.views.Tags = Backbone.View.extend({

    subViews: [],

    initialize: function() {

        console.log('tagsView initialize',this.collection);

        this.$el.html( $('<div>', { id: 'planet_view' }) );

        this.$el = $('#planet_view');
        
        this.$el.append( $('<div>', { class: 'filter'}) );
        this.$el.append( $('<div>', { class: 'menu_in navigable' }) );

        $('<canvas>',{ class: 'canvas', id: 'canvas'}).attr({width:2000,height:1000}).appendTo(this.$el);

        var c = document.getElementById('canvas');
        this.canvas = c.getContext("2d");
        this.canvas.fillStyle = "#FF0000";
        this.canvas.fillRect(10,10,5,5);
    },

    events: { 
        'click .planet': function(elem) {
            var tag = $(elem.currentTarget).find('p').attr('tag');
            console.log(tag);
            // $('#sort li').removeClass('selected');
            // $('#sort li.hover').addClass('selected');
            app.router.navigateTo('artistes/' + tag, true);
        },
        'mouseover .menu_in': function(elem) {
            console.log('navigation vers le menu de gauche');
            $('#left').addClass('nav');
            $('.filter').addClass('actif');
            app.mainView.mouse.focus($('.menu_nav')[0]);
        },
        'click' : function(elem){
            console.log('click!',elem.currentTarget);
        }

    },

    render: function() {
        console.log('collection = ', this.collection);
        this.collection.each(function( item,index) {
            this.renderItem( item,index );
        }, this );

        this.subViews[0].$el.css('top',centre.x - 100 + 'px');
        this.subViews[0].$el.css('left',centre.y - 150 + 'px');

        this.matrix = addItemToGrid( [], this.subViews[0].el, {first: true, canvas: this.canvas});

        this.canvas.fillStyle = 'green';
        var l = this.subViews.length;

        for(var c = 0; c < (l-1)/8; c++){

            for (var i = 1; i<9 && i < l-8*c; i++) {
                var d = grid(i-1,700*(c+1),800*(c+1)); // compute the coordinates of the item on the c circle
                
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

                for(var q = 0; q < l-8*c-5 && q<4; q++) // position all corner elemfgents to their nearest corner
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
        app.mainView.mouse.focus($('.planet')[0]);
    },

    renderItem: function( item , i)
    {
        var planetView = new app.views.Planet({ model: item });

        this.$el.append( planetView.render().el);
        planetView.el = this.$el.children().last()[0];
        
        this.subViews[i] = planetView;
    },

    focus: function()
    {
        console.log('focus')
        app.mainView.mouse.focus($('.planet')[0]);
    },
    // renderPos: function() {

    //     for (var i = this.collection.length - 1; i >= 0; i--) {
    //         this.subViews[i].$el.css('top', ( centre.x + this.collection.models[i].get('x') ) + 'px' );
    //         this.subViews[i].$el.css('left', ( centre.y + this.collection.models[i].get('y') ) + 'px' );
    //     };
    //     return this;
    // },
    // instant: function ()
    // {
    //     var X = this.collection.models.map(function (model) {
    //         var vecteur = { x: model.get('x'), y: model.get('y') };
    //         vecteur.r3 = Math.pow( Math.pow( vecteur.x ,2) + Math.pow( vecteur.y ,2) , 3/2 );
    //         return vecteur;
    //     });

    //     var V = this.collection.models.map(function (model) {
    //         var vecteur = {vx: model.get('vx'), vy: model.get('vy') };
    //         return vecteur;
    //     });

    //     var A = X.map(function (coord) {
    //         return { ax: -G*coord.x/coord.r3 , ay: -G*coord.y/coord.r3 };
    //     });

    //     for (var i = this.collection.length - 1; i >= 0; i--) {

    //         V[i].vx += A[i].ax*dt;
    //         V[i].vy += A[i].ay*dt;

    //         this.collection.models[i].set({ vx: V[i].vx });
    //         this.collection.models[i].set({ vy: V[i].vy });

    //         this.collection.models[i].set({ x: X[i].x + V[i].vx*dt });
    //         this.collection.models[i].set({ y: X[i].y + V[i].vy*dt }); // models speeds and positions updated
    //     };

    //     this.renderPos();

    // }
});