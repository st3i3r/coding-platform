var app = {
	views: {},
	models: {},
	collections: {},
	utils: {},
	router: {}
}

// Helper function to handle Backbone ghost views



$(document).ready(function(){
    app.router.instance = new app.Router();
    Backbone.history.start();
});
