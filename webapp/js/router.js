// js/router.js


var app = app || { models: {}, collections: {}, views: {} };

app.Router = Backbone.Router.extend({
    routes : {
        '' : 'tags',
        'categories' : 'categories',
        'tags' : 'tags',
        'artistes/:tag' : 'artistes',
        'artiste/:artiste' : 'artiste',
        'programme/:programme' : 'programme',
        'youtube/:id' : 'youtube'
    },

    tags: function(){
        console.log('[Router] tags');

        $('#center').html($('<img>', {
            class: 'loading',
            src: 'css/loading17.gif'
        }));

        var tagsColl = new app.collections.Tags();

        tagsColl.fetch(
        {
            reset: true,
            success: function(collection)
            {
                console.log(collection);
                app.tagsView = new app.views.Tags({ el: $('#center'), collection: collection });
                
                app.mainView.loadCurrentView( app.tagsView );

                // window.requestAnimFrame = (function(){
                //     return  window.requestAnimationFrame       ||
                //             window.webkitRequestAnimationFrame ||
                //             window.mozRequestAnimationFrame    ||
                //             function( callback ){
                //                 window.setTimeout(callback, 1000 / 20);
                //             };
                // })();

                // (function animloop(){
                //     requestAnimFrame(animloop);
                //     app.tagsView.instant();
                // })();
            }
        });
    },
    artistes: function(tag)
    {
        if(tag == null)
            var tag = 'pop';
        console.log('[Router] artistes/' + tag);

        $('#center').html($('<img>', {
            class: 'loading',
            src: 'css/loading17.gif'
        }));

        var artistesColl = new app.collections.Artistes({tag: tag});

        artistesColl.fetch(
        {
            reset: true,
            success: function(collection)
            {
                console.log(collection);
                var artistesView = new app.views.Artistes({ el: $('#center'), collection: collection , tag: tag});
                
                app.mainView.loadCurrentView( artistesView );

            }
        })
    },
    artiste: function(artiste)
    {
        console.log('[Router] artiste/' + artiste);

        $('#center').html($('<img>', {
            class: 'loading',
            src: 'css/loading17.gif'
        }));

        var artisteMod = new app.models.Artiste({dicName: artiste});

        artisteMod.fetch(
        {
            reset: true,
            success: function(model)
            {
                console.log(model);
                var artisteView = new app.views.Artiste({ el: $('#center'), model: model , dicName: artiste});
                
                app.mainView.loadCurrentView( artisteView );

            }
        })
    },

    youtube: function(id)
    {
        console.log('[Router] youtube/' + id);

        var youtubeModel = app.currentYoutubeCollection.get(id);

        var youtubeView = new app.views.Youtube({ el: $('#center'), model: youtubeModel });
 
    },
    categories: function(){
        console.log('[Router] categories');

        var concertsColl = new app.collections.Programmes({url: 'api/categories'});

        concertsColl.fetch(
        {
            reset: true,
            success: function(collection)
            {
                console.log(collection);

                $('#center')
                .html(
                    $('<h1>',{ class: 'titre', text: 'Découvrir' })
                    .appendTo($('<div>', { class: 'progs', 'data-nav-area': ".program"}))
                );

                var concertsView = new app.views.Programmes(
                    {
                        el: $('#center'),
                        collection: collection,
                        source: 'concerts'
                    }
                );
                app.mainView.loadCurrentView( concertsView );

            }
        });
    },
    /*
    * Permet de naviguer vers une autre route en mémorisant le focus en cas de retour sur la page
    */
    navigateTo: function(navTo, saveFocus) {
        // On sauvegarde la dernière position du curseur sur la page
        //app.focusHistory.push(app.mainView.mouse.pos);

        // On dépile la dernière position connue dans une variable temporaire
        // si on souhaite retrouvée le curseur à un endroit précis sur la nouvelle page
        // if(saveFocus === true) {
        //     app.prevFocus = app.focusHistory.pop();
        // }
        // else {
        //     app.prevFocus = null;
        // }

        app.router.navigate(navTo, { trigger: true });
    },

    /*
    * Permet de faire un retour sans perdre le focus précédent
    */
    backTo: function() {

        if(app.router.internalFocus)
        {
            app.mainView.currentView.removeFocus();

            app.router.internalFocus = false;
        }
        else
        {
             // On dépile la dernière position connue dans une variable temporaire
            app.prevFocus = app.focusHistory.pop();

            Backbone.history.history.back();
        }
    }
});