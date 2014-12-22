// js/views/main.js

var app = app || { models: {}, collections: {}, views: {} };

app.views.MainView = Backbone.View.extend({
    el: $('#center'),

    initialize: function() {
        console.log('mainView initialize');
        // var html = [
        // '<div id="menu" data-nav-area="ul > li" data-nav-track></div>',
        // '<div id="center"></div>'
        // ].join('');

        // $(this.el).html(html);

        // var semaine = moment().format('w'),
        //     url = 'http://10.0.1.3:8080/api/count/diffusions/semaine/' + semaine + '/series/' + app.memory.join(','),
        //     nbEpisodes = getCountAPI(url);

        this.menu = new app.views.MenuView();

        //this.mouse = new Mickey(document.querySelector('body'), { overlap: 2}).init();
    },

    loadCurrentView: function(view) {
    // Arrêt des listeners sur la vue précédente
    if(this.currentView) {
        console.log('Replacing currentView events')
        this.currentView.undelegateEvents();
        this.currentView.stopListening();
    }

    // Update de la vue
    this.currentView = view;
    this.currentView.render();

    // On initialise le curseur à un endroit précis si une position précédente existe dans variable temporaire
    // if(app.prevFocus !== null) {
    // this.mouse.pos = app.prevFocus;
    // }

    // this.mouse.update();
    }
});

app.views.MenuView = Backbone.View.extend({
    el: $('#left'),

    events: { 
        'click #artistes': function(elem) {

            app.router.navigateTo('', true);
        },
        'click #concerts': function(elem) {

            app.router.navigateTo('categories', true);
        },
        'mouseover #menu_out': function(elem) {
            console.log('navigation vers le contenu principal');
            $('#left').removeClass('nav');
            $('.filter').removeClass('actif');
            //app.mainView.mouse.focus($('.planet')[0]);
            app.mainView.currentView.focus() ;

        },
    },

    initialize: function(options) {
        // this.nbFavorites = options.nbFavorites;
        // this.nbEpisodes = options.nbEpisodes;

    },

    render: function() {
        $(this.el).html(menuTemplate);
        this.renderStats();

        this.on('changeStats', this.renderStats, this);
    },

    renderStats: function() {
        $('#nb-series > span:first-child').html(this.nbFavorites);
        $('#nb-episodes > span:first-child').html(this.nbEpisodes);
    },

    setNbFavorites: function(nb) {
        this.nbFavorites = nb;
        this.trigger('changeStats');
    },

    setNbEpisodes: function(nb) {
        this.nbEpisodes = nb;
        this.trigger('changeStats');
    }
});

app.WorkInProgressView = Backbone.View.extend({
    render: function() {
        var html = [
            '<div id="wip">',
            '<h2>Work in progress</h2>',
            '</div>'
        ].join('');

        $(this.el).html(html);
    }
});