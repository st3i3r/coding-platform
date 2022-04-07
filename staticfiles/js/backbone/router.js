app.Router = Backbone.Router.extend({
  routes: {
    'home': 'homeRoute',
    'dashboard': 'dashboardRoute',
    'challenge/:slug': 'challengeRoute',
    'modules/:id': 'moduleRoute',
    'login': 'loginRoute',
    'challenge/:slug/submissions/': 'submissionListRoute',
    'submissions/:uid': 'submissionRoute',
    '*filter' : 'setFilter',
  },
  setFilter: function(params) {
    if (params !== null) {
        console.log('params: ' + params);
        window.filter = params.trim() || '';
    }
  },
  homeRoute: function() {
    app.view = app.utils.disposeView(new app.views.HomeView());
  },
  moduleRoute: function(id) {
    var module = new app.models.Module({id: id})
    module.fetch({success: function() {
        var challenges = new app.collections.ChallengeList(module.get('id'))
        var view = app.utils.disposeView(new app.views.ModuleView({model: module, collection: challenges}));
        view.render();
    }})
  },
  dashboardRoute: function() {
    var moduleList = new app.collections.ModuleList()
    var view = app.utils.disposeView(new app.views.DashboardView({collection: moduleList}));
    view.render();
  },
  loginRoute: function() {
    setUpUrl('formlogin');
  },
  challengeRoute: function(slug) {
    var challenge = new app.models.Challenge({slug: slug})
    challenge.fetch({success: function() {
        var view = app.utils.disposeView(new app.views.ChallengeView({model: challenge}));
        view.render();
    }})
  },
  submissionRoute: function(uid) {
    var submission = new app.models.Submission({uid: uid})
    submission.fetch({success: function() {
        var view = app.utils.disposeView(new app.views.SubmissionDetailView({model: submission}));
        view.render();
    }})
  },
});
