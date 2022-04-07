/*****
 * CONFIGURATION
 */
// Active ajax page loader
$.ajaxLoad = true;
//required when $.ajaxLoad = true
$.defaultPage = 'home';
$.subPagesDirectory = '/';
$.page404 = 'views/pages/404.html';
$.mainContent = $('#ui-view');

//Main navigation
$.navigation = $('nav > ul.nav');

$.panelIconOpened = 'icon-arrow-up';
$.panelIconClosed = 'icon-arrow-down';

//Default colours
$.brandPrimary = '#20a8d8';
$.brandSuccess = '#4dbd74';
$.brandInfo = '#63c2de';
$.brandWarning = '#f8cb00';
$.brandDanger = '#f86c6b';

$.grayDark = '#2a2c36';
$.gray = '#55595c';
$.grayLight = '#818a91';
$.grayLighter = '#d1d4d7';
$.grayLightest = '#f8f9fa';

var passedColor = '#1ba94c';
var failedColor = '#d11534';

'use strict';
/****
 * AJAX LOAD
 * Load pages asynchronously in ajax mode
 */

/*
if ($.ajaxLoad) {
    var paceOptions = {
        elements: false,
        restartOnRequestAfter: false
    };
    var url = location.hash.replace(/^#/, '');
    toastr.options = {
        "positionClass": "toast-bottom-right",
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "preventDuplicates": false,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    if (url != '') {
        setUpUrl(url);
    } else {
        setUpUrl($.defaultPage);
    }
}
*/

function setupConfig() {
    var paceOptions = {
        elements: false,
        restartOnRequestAfter: false
    };

    toastr.options = {
        "positionClass": "toast-bottom-right",
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "preventDuplicates": false,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
}

function gameFullScreen() {
    if (
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled
    ) {
        var i = document.getElementById("game_canvas");
        // go full-screen
        if (i.requestFullscreen) {
            i.requestFullscreen();
        } else if (i.webkitRequestFullscreen) {
            i.webkitRequestFullscreen();
        } else if (i.mozRequestFullScreen) {
            i.mozRequestFullScreen();
        } else if (i.msRequestFullscreen) {
            i.msRequestFullscreen();
        }
    }
}

function expandCodeEditor() {
    if ($('#expandButton').hasClass("fa-angle-right")) {
        $('#codeview').removeClass('col-md-8');
        $('#codeview').addClass('col-md-12');
        $('#console').hide();
        $('#expandButton').removeClass("fa-angle-right");
        $('#expandButton').addClass("fa-angle-left");
    } else {
        $('#codeview').removeClass('col-md-12');
        $('#codeview').addClass('col-md-8');
        $('#console').show();
        $('#expandButton').addClass("fa-angle-right");
        $('#expandButton').removeClass("fa-angle-left");
    }
}

function setUpUrl(url, callback) {
    if (url === undefined) return;
    $('nav .nav li .nav-link').removeClass('active');
    $('nav .nav li.nav-dropdown').removeClass('open');
    $('nav .nav li:has(a[href="' + url.split('?')[0] + '"])').addClass('open');
    $('nav .nav a[href="' + url.split('?')[0] + '"]').addClass('active');
    url = url.replace('/#', '');
    url = url.replace('#', '');

    if (url && url.length > 4 && url.substr(0, 4) == 'form') {
        submitAjax = function (formInput) {
            var formData = new FormData(formInput[0]);
            $.ajax({
                url: formInput.attr('action'),
                type: "POST",
                headers: {"Authorization": getCookie('access')},
                data: formData,
                cache: false,
                async: true,
                contentType: false,
                processData: false,
                success: function (msg) {
                    if (msg.type == 'error') {
                        $("#text-msg").html(msg.data);
                    } else if (msg.type == 'toast') {
                        if (msg.data !== null && msg.data !== undefined && msg.data !== '')  {
                            if (msg.status == 'error') {
                                toastr.error(msg.data);
                            } else if (msg.status == 'success') {
                                toastr.success(msg.data);
                            } else {
                                toastr.info(msg.data);
                            }
                        }
                    } else if (msg.type == 'reload') {
                        location.reload();
                    } else if (msg.type === 'login') {
						var tokens = JSON.parse(msg.tokens);
						setCookie('refresh', tokens.refresh);
						setCookie('access', tokens.access);
                        location.reload();
					}
                }
            });
        };
        return submitAjax($('#' + url));
    } else if (url) {
        var stateObj = {
            url: window.location.hash,
            innerhtml: document.getElementById("ui-view").innerHTML
        };
        window.history.pushState(stateObj, null, null);
        Pace.restart();
        $('html, body').animate({
            scrollTop: 0
        }, 0);

        return $.ajax({
            url: url,
            async: false,
            type: "GET",
            headers: {"Authorization": getCookie('access')},
            success: function (msg) {
                if (msg.type == 'toast') {
                    if (msg.data !== '' && msg.data !== undefined && msg.data !== null) {
                        if (msg.status == 'error') {
                            toastr.error(msg.data);
                        } else if (msg.status == 'success') {
                            toastr.success(msg.data);
                        } else {
                            toastr.info(msg.data);
                        }
                    }
                } else if (msg.type == 'reload') {
                    window.location.href = "/"
                } else if (msg.type == 'logout') {
					eraseCookie('refresh');
					eraseCookie('access');
                    window.location.href = "/";
				} else {
                    // window.location.hash = url;
                    $.mainContent.html(msg);
                    $("body").addClass("footer-fixed");
                }
            }
        });
    }
}

$(document).on('click', 'a[href!="#"]', function (e) {
    if ($(this).attr('target') === undefined) return;

    if ($(this).parent().parent().hasClass('nav-tabs') || $(this).parent().parent().hasClass('nav-pills')) {
        e.preventDefault();
    } else if ($(this).attr('target') == '_top') {
        e.preventDefault();
        var target = $(e.currentTarget);
        // window.location = (target.attr('href'));
    } else if ($(this).attr('target') == '_blank') {
        e.preventDefault();
        var target = $(e.currentTarget);
        window.open(target.attr('href'));
    } else if ($(this).attr('target') == '_download') {
        e.preventDefault();
        var target = $(e.currentTarget);
        window.open(target.attr('href'));
    } else if ($(this).attr('target') == '_none') {
        e.preventDefault();
    } else if ($(this).attr('target') == '_fullscreen') {
        gameFullScreen();
        e.preventDefault();
    } else if ($(this).attr('target') == '_expand') {
        expandCodeEditor();
        e.preventDefault();
    } else {
        e.preventDefault();
        var target = $(e.currentTarget);
        setUpUrl(target.attr('href'), target.attr('data-idTab'));
    }
});

$(document).on('click', 'a[href="#"]', function (e) {
    e.preventDefault();
});

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


/****
 * MAIN NAVIGATION
 */
window.onpopstate = function (event) {
    var currentState = history.state;
    if (currentState && currentState.innerhtml)
        document.getElementById("ui-view").innerHTML = currentState.innerhtml;
};


// $(document).ready(function ($) {
//
//     // Add class .active to current link
//     $.navigation.find('a').each(function () {
//         var cUrl = String(window.location).split('?')[0];
//         if (cUrl.substr(cUrl.length - 1) == '#') {
//             cUrl = cUrl.slice(0, -1);
//         }
//         if ($($(this))[0].href == cUrl) {
//             $(this).addClass('active');
//             $(this).parents('ul').add(this).each(function () {
//                 $(this).parent().addClass('open');
//             });
//         }
//     });
//     // Dropdown Menu
//     $.navigation.on('click', 'a', function (e) {
//         if ($.ajaxLoad) {
//             e.preventDefault();
//         }
//         if ($(this).hasClass('nav-dropdown-toggle')) {
//             $(this).parent().toggleClass('open');
//             resizeBroadcast();
//         }
//     });
//     function resizeBroadcast() {
//         var timesRun = 0;
//         var interval = setInterval(function () {
//             timesRun += 1;
//             if (timesRun === 5) {
//                 clearInterval(interval);
//             }
//             if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
//                 var evt = document.createEvent('UIEvents');
//                 evt.initUIEvent('resize', true, false, window, 0);
//                 window.dispatchEvent(evt);
//             } else {
//                 window.dispatchEvent(new Event('resize'));
//             }
//         }, 62.5);
//     }
//
//     setInterval(function () {
//         if (!$("body").hasClass("aside-menu-hidden")) {
//             $('#topten').load#home("/topten", null, function (responseText) {
//                 console.log("Update Topten")
//             }).delay(250).animate({
//                 opacity: 1
//             }, 0);
//         };
//     }, 5000);
//     /* ---------- Main Menu Open/Close, Min/Full ---------- */
//     $('.sidebar-toggler').click(function () {
//         $('body').toggleClass('sidebar-hidden');
//         resizeBroadcast();
//     });
//     $('.sidebar-minimizer').click(function () {
//         $('body').toggleClass('sidebar-minimized');
//         resizeBroadcast();
//     });
//     $('.brand-minimizer').click(function () {
//         $('body').toggleClass('brand-minimized');
//     });
//     $('.aside-menu-toggler').click(function () {
//         $('body').toggleClass('aside-menu-hidden');
//         resizeBroadcast();
//         if (!$('body.aside-menu-hidden')) {
//             reloadTopTen();
//         }
//     });
//     $('.sidebar-close').click(function () {
//         $('body').toggleClass('sidebar-opened').parent().toggleClass('sidebar-opened');
//     });
// });

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));
}

function onDocumentReady() {
    // Add class .active to current link
    $.navigation.find('a').each(function () {
        var cUrl = String(window.location).split('?')[0];
        if (cUrl.substr(cUrl.length - 1) == '#') {
            cUrl = cUrl.slice(0, -1);
        }
        if ($($(this))[0].href == cUrl) {
            $(this).addClass('active');
            $(this).parents('ul').add(this).each(function () {
                $(this).parent().addClass('open');
            });
        }
    });
    // Dropdown Menu
    $.navigation.on('click', 'a', function (e) {
        if ($.ajaxLoad) {
            e.preventDefault();
        }
        if ($(this).hasClass('nav-dropdown-toggle')) {
            $(this).parent().toggleClass('open');
            resizeBroadcast();
        }
    });
    function resizeBroadcast() {
        var timesRun = 0;
        var interval = setInterval(function () {
            timesRun += 1;
            if (timesRun === 5) {
                clearInterval(interval);
            }
            if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
                var evt = document.createEvent('UIEvents');
                evt.initUIEvent('resize', true, false, window, 0);
                window.dispatchEvent(evt);
            } else {
                window.dispatchEvent(new Event('resize'));
            }
        }, 62.5);
    }

    setInterval(function () {
        if (!$("body").hasClass("aside-menu-hidden")) {
            $('#topten').load("/topten", null, function (responseText) {
                console.log("Update Topten")
            }).delay(250).animate({
                opacity: 1
            }, 0);
        };
    }, 5000);
    /* ---------- Main Menu Open/Close, Min/Full ---------- */
    $('.sidebar-toggler').click(function () {
        $('body').toggleClass('sidebar-hidden');
        resizeBroadcast();
    });
    $('.sidebar-minimizer').click(function () {
        $('body').toggleClass('sidebar-minimized');
        resizeBroadcast();
    });
    $('.brand-minimizer').click(function () {
        $('body').toggleClass('brand-minimized');
    });
    $('.aside-menu-toggler').click(function () {
        $('body').toggleClass('aside-menu-hidden');
        resizeBroadcast();
        if (!$('body.aside-menu-hidden')) {
            reloadTopTen();
        }
    });
    $('.sidebar-close').click(function () {
        $('body').toggleClass('sidebar-opened').parent().toggleClass('sidebar-opened');
    });
}

function navigateHref(e) {
    var href = $(e.currentTarget).attr('href');
    app.router.navigate(href, { trigger: true, replace: true });
}

var app = {};
app.view = {};

app.HomeView = Backbone.View.extend({
    el: '#app-header',
    events: {
        'click a': 'onClick',
    },
    onClick: function(e) {
    },
    initialize: function() {
        this.render();
        onDocumentReady();
    },
    render: function() {
        setUpUrl($.defaultPage);
    }
})


app.SkillSet = Backbone.Model.extend({
  defaults: {
    title: '',
    id: null,
    description: '',
    enabled: true,
  }
});

app.Module = Backbone.Model.extend({
  defaults: {
    title: '',
    id: null,
    description: '',
    enabled: true,
    questions: []
  },
  idAttribute: 'id',
  urlRoot: '/api/modules/'
});

app.ModuleList = Backbone.Collection.extend({
    model: app.Module,
    url: '/api/modules/'
})

app.ModuleItemView = Backbone.View.extend({
    el: '#modules',
    events: {
        'click a': navigateHref
    },
    initialize: function() {
        var moduleTemplate = _.template($('#module-template').html());
        this.$el.append(moduleTemplate(this.model.toJSON()));
        return this;
    },
})


app.ModuleView = Backbone.View.extend({
    el: '#challenges',
    initialize: function() {
        this.listenTo(this.collection, 'add', this.addOneChallenge);
    },
    render: function() {
        setUpUrl('modules/' + this.model.get('id'));
        var headerTemplate = _.template($('#module-header-template').html());
        $('#module-header').html(headerTemplate(this.model.toJSON()));

        this.collection.fetch();
        return this;
    },
    addOneChallenge: function(challenge) {
        var view = new app.ChallengeItemView({model: challenge})
        view.render();
    },
    addAllChallenge: function() {
        this.$('#challenges').html('');
        app.challengeList.each(this.addOneChallenge, this);
    }
})

app.DashboardView = Backbone.View.extend({
    el: '#ui-view',
    url: 'dashboard',
    initialize: function() {
        // Rewrite another function to put HTML to 'el'
        // TODO: Change to function var
        this.listenTo(this.collection, 'add', this.addModule); // 'this' is a ModuleItemView instance
    },
    render: function() {
        // Wait for HTML and then fetch modules
        setUpUrl(this.url);
        this.collection.fetch();
        return this;
    },
    addModule: function(module) {
        var view = new app.ModuleItemView({model: module})
        view.render();
    },
})

app.CompileLog = Backbone.Model.extend({
  defaults: {
    uid: null,
    content: null,
    language: '',
    state: null,
    log:'',
    question: '',
    exitStatus: 0
  },
  idAttribute: 'uid',
  urlRoot: '/api/compiles/'
})

app.Submission = Backbone.Model.extend({
  defaults: {
    uid: '',
    status: '',
    score: 0,
    compileLog: {
        uid: '',
        language: ''
    }
  },
  idAttribute: 'uid',
  urlRoot: '/api/submissions/'
})

app.SubmissionList = Backbone.Collection.extend({
  model: app.Submission,
  initialize: function(questionSlug) {
    if (questionSlug !== undefined) {
        this.questionSlug = questionSlug;
    }
  },
  url: function() {
    if (this.questionSlug === null || this.questionSlug === undefined) {
        return '/api/submissions/';
    } else {
        return `/api/challenges/${this.questionSlug}/submissions/`;
    }
  }
})

app.SolutionTemplate = Backbone.Model.extend({
  defaults: {
    id: null,
    language: '',
    content: '',
    question: null,
  },
  idAttribute: 'id',
  urlRoot: '/api/solution-templates/'
})

app.TestResult = Backbone.Model.extend({
  defaults: {
    uid: null,
    passed: null,
    output: '',
    testcase: null
  },
  idAttribute: 'uid',
  urlRoot: '/api/test-result/'
})

app.TestResultList = Backbone.Collection.extend({
  model: app.TestResult,
  initialize: function(submissionUid) {
    this.submissionUid = submissionUid;
  },
  url: function() {
      if (this.submissionUid !== undefined && this.submissionUid !== null) {
          return `/api/submissions/${this.submissionUid}/test-result/`;
      } else {
          return '/api/test-result/'
      }
  }
})

app.SolutionTemplateList = Backbone.Collection.extend({
  model: app.SolutionTemplate,
  initialize: function(questionSlug) {
    this.questionSlug = questionSlug;
  },
  url: function() {
    if (this.questionSlug !== undefined && this.questionSlug !== null) {
        return `/api/challenges/${this.questionSlug}/solution-templates/`;
    } else {
        return '/api/solution-templates/';
    }
  }
})

app.Challenge = Backbone.Model.extend({
  defaults: {
    title: '',
    slug: null,
    description: '',
    shortDescription: '',
    score: 0,
    skillset: ''
  },
  // model.fetch will make a request to /api/challenges/challenge-slug
  idAttribute: 'slug',
  urlRoot: '/api/challenges/'
})

app.ChallengeList = Backbone.Collection.extend({ model: app.Challenge,
    initialize: function(moduleId) {
        this.moduleId = moduleId;
    },
    url: function() {
        return `/api/modules/${this.moduleId}/get-questions`;
    }
})

// Challenge card to be displayed in /skillsets route
app.ChallengeItemView = Backbone.View.extend({
    el: '#challenges',
    events: {
        'click a': navigateHref
    },
    initialize: function() {
        console.log("Initialize ChallengeItemView");
    },
    render: function() {
        var challengeTemplate = _.template($('#challenge-template').html());
        this.$el.append(challengeTemplate(this.model.toJSON()));
        return this;
    },
})

app.SubmissionItemView = Backbone.View.extend({
    el: '#submission-list',
    events: {
        'click a': navigateHref
    },
    initialize: function() {
    },
    render: function() {
        var submissionTemplate = _.template($('#submission-template').html());
        this.$el.append(submissionTemplate(this.model.toJSON()));

        return this;
    }
})

app.SubmissionView = Backbone.View.extend({
    el: "#submissions",
    submissionListContainer: `
                                <div class="row">
                                    <div class="col-md-12">
                                        <table class="table table-responsive-sm">
                                            <thead>
                                            <tr>
                                                <th>RESULT</th>
                                                <th>SCORE</th>
                                                <th>LANGUAGE</th>
                                                <th>TIME</th>
                                                <th></th>
                                            </tr>
                                            </thead>
                                            <tbody id="submission-list">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
    `,
    events: {
    },
    initialize: function() {
        this.listenTo(this.collection, 'reset', this.onResetSubmissions);
    },
    render: function() {
        this.$el.html(this.submissionListContainer);
        this.collection.fetch({reset: true})

        $('#submission-tab').tab('show');
        console.log('call render');
        return this;
    },
    onResetSubmissions: function() {
        this.collection.each(function(submission) {
            var view = new app.SubmissionItemView({model: submission})
            view.render();
        });
    }
})

app.SubmissionDetailView = Backbone.View.extend({
    el: '#submissions',
    events: {
        'click a': navigateHref
    },
    initialize: function() {
        this.compileLog = new app.CompileLog(this.model.get('compile_log'))
        var editor = new app.Editor({
            selector: 'submitted-code',
            compile_log: this.compileLog,
            options: {
                readOnly: true,
                height: $(window).height() / 1.7
            }
        })
        this.editorView = new app.EditorView({model: editor});
    },
    render: function() {
        var submissionTemplate = _.template($('#submission-detail-template').html());
        $('#submissions').html(submissionTemplate(this.model.toJSON()));

        var that = this;
        this.compileLog.fetch({success: function() {
            that.editorView.setElement($('#submitted-code')).render();
        }})
        return this;
    }
})

// Challenge description tab
app.QuestionView = Backbone.View.extend({
    el: '#challenge',
    initialize: function() {
    },
    render: function() {
        var challengeTemplate = _.template($('#challenge-template').html());
        this.$el.html(challengeTemplate({'description': this.model.get('description')}))
        return this;
    }
})

app.Editor = Backbone.Model.extend({
  defaults: {
    selector: 'editor',
    compile_log: null,
    options: {
        readOnly: false,
        height: $(window).height() / 1.7
    }
  }
})

app.EditorView = Backbone.View.extend({
    el: "#codeeditor",
    events: {
        'click #reset-code': 'onResetCode',
        'change #language': 'onChangeLanguage',
    },
    initialize: function() {
    },
    render: function() {
        ace.require("ace/ext/language_tools");
        this.editor = ace.edit(this.model.get('selector'));

        this.setOptions();

        var compileLog = this.model.get('compile_log');
        if (compileLog.get('uid') === null) {
            this.solutionTemplateList = new app.SolutionTemplateList(compileLog.get('question'));
            this.listenTo(this.solutionTemplateList, 'change', this.setEditorModeAndCode);

            var that = this;
            this.solutionTemplateList.fetch({success: function() {
                if (
                    that.solutionTemplateList.length === 0 ||
                    that.solutionTemplateList.findWhere(function(_s) {return _s.get('language') === that.getLanguageChoice()}) === null
                    ) {
                        that.setDefaultTemplate();
                }
            }});
        } else {
            var code = compileLog.get('content');
            var language = compileLog.get('language');
            this.setMode(language);
            this.setCode(code);
        }

        return this;
    },
    getLanguageChoice: function() {
        return $('#language').val();
    },
    setOptions: function() {
        this.editor.setReadOnly(this.model.get('options').readOnly);
        this.editor.setTheme("ace/theme/sqlserver");
        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });
        var height = this.model.get('options').height;
        $(`#${this.model.get('selector')}`).css('minHeight', `${height}px`);
    },
    setMode: function(language) {
        switch (language) {
            case 'C++':
                mode = "ace/mode/c_cpp";
                break;
            case 'Java':
                mode = "ace/mode/java";
                break;
            default:
                mode = "ace/mode/c_cpp";
        }
        this.editor.getSession().setMode(mode);
    },
    setCode: function(code) {
        this.editor.setValue(code, -1);
    },
    setSolutionTemplate: function(solutionTemplate) {
        var language = solutionTemplate.get('language');
        // Depend on language box
        if (language === $('#language').val()) {
            var code = solutionTemplate.get('code');
            this.setMode(language);
            this.setCode(code);
        }
    },
    setDefaultTemplate: function() {
        var language = this.getLanguageChoice();
        switch (language) {
            case 'cpp':
                code = this._cppTemplate();
                break;
            case 'java':
                code = this._javaTemplate();
                break;
            default:
                code = '';
        }
        this.setMode(language);
        this.setCode(code);
    },
    _cppTemplate: function() {
        return "#include <iostream>\n" +
               "using namespace std;\n" +
               "\n" +
               "int main()\n" +
               "{\n" +
               "    // your code goes here" +
               "    \n    int val;\n    cin >> val;\n    cout << val;\n" +
               "    return 0;\n" +
               "}";
    },
    _javaTemplate: function() {
        return "import java.util.*;\n" +
               "import java.lang.*;\n" +
               "import java.io.*;\n" +
               "\n" +
               "public class AiContest2019// don't replace with another name!\n" +
               "{              \n" +
               "	public static void main(String[] args)\n" +
               "	{\n" +
               "		// your code goes here\n" +
               "		Scanner s = new Scanner(System.in);\n" +
               "		int val = s.nextInt();\n" +
               "		System.out.print(val);\n" +
               "	}\n" +
               "}";
    },
    onChangeLanguage: function(e) {
        this.render();
    },
    onResetCode: function(e) {
        this.render();
    },
})

app.TestResultDetailView = Backbone.View.extend({
    el: '#test-result-detail',
    initialize: function() {
        // this.$el.html('');
    },
    render: function() {
        var data = this.model.toJSON();
        data['color'] = this.model.get('passed') === true ? passedColor : failedColor;

        var resultTemplate = _.template($('#test-result-detail-template').html());
        this.$el.html(resultTemplate(data));
        return this;
    }
})

app.TestResultItemView = Backbone.View.extend({
    el: '#test-result',
    events: function() {
          var selector = '#testcase-' + this.model.get('testcase').id; // this id corresponds to your template id
          var ev = {};
          ev['click ' + selector] = 'onTestCaseClick';
          return ev;
    },
	passedIconHTML: function() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label="Passed" class="ui-svg-icon" fill=${passedColor}><path d="M12 23C5.9 23 1 18.1 1 12c0-3 1.1-5.7 3.2-7.8C6.3 2.1 9.1 1 12 1c1.6 0 3.1.3 4.5 1 .5.2.7.8.5 1.3-.2.5-.8.7-1.3.5-1.2-.5-2.4-.8-3.7-.8-5 0-9 4-9 9s4 9 9 9 9-4 9-9v-.9c0-.6.4-1 1-1s1 .4 1 1v.9c0 6.1-4.9 11-11 11z"></path><path d="M12 15c-.3 0-.5-.1-.7-.3l-3-3c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l2.3 2.3L22.3 2.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-11 11c-.2.2-.4.3-.7.3z"></path></svg>`;
	},
	failedIconHTML: function() {
		return ` <svg viewBox="0 0 100 100" width="1em" height="1em" role="img" aria-label="Failed" class="ui-svg-icon" fill=${this.failedColor}><path d="M88.184 81.468a3.008 3.008 0 0 1 0 4.242l-2.475 2.475a3.008 3.008 0 0 1-4.242 0l-69.65-69.65a3.008 3.008 0 0 1 0-4.242l2.476-2.476a3.008 3.008 0 0 1 4.242 0l69.649 69.651z"></path><path d="M18.532 88.184a3.01 3.01 0 0 1-4.242 0l-2.475-2.475a3.008 3.008 0 0 1 0-4.242l69.65-69.651a3.008 3.008 0 0 1 4.242 0l2.476 2.476a3.01 3.01 0 0 1 0 4.242l-69.651 69.65z"></path></svg>`;
	},
	lockedIconHTML: function() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" class="ui-svg-icon" fill=""><path d="M19 10h-1V7c0-3.3-2.7-6-6-6S6 3.7 6 7v3H5c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3zM8 7c0-2.2 1.8-4 4-4s4 1.8 4 4v3H8V7zm12 13c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-7c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v7z"></path></svg>`
	},
    initialize: function() {
        this.testResultDetailView = new app.TestResultDetailView({model: this.model});
    },
    render: function() {
        var testResultTemplate = _.template($('#test-result-template').html());
        var data = this.model.toJSON();
        data['color'] = this.model.get('passed') === true ? passedColor : failedColor;
        data['result_icon_html'] = this.model.get('testcase').hidden === true ? this.lockedIconHTML() : this.model.get('passed') ? this.passedIconHTML() : this.failedIconHTML();

        // $('#test-result').append(testResultTemplate(data));
        this.setElement(testResultTemplate(data));
        return this;
    },
    renderResultDetail: function() {
        this.testResultDetailView.render();
    },
    onTestCaseClick: function(e) {
        this.renderResultDetail();
    }
})

app.ConsoleLogView = Backbone.View.extend({
    initialize: function() {
        this.el = '#log-view';
    },
	animation: function(msg) {
		return `<div id="animation"><svg width=\"20px\" height=\"20px\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\" class=\"loader-svg-icon\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"none\" class=\"bk\"></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(0 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(30 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.08333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(60 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.16666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(90 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.25s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(120 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.3333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(150 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.4166666666666667s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(180 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(210 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5833333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(240 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.6666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(270 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.75s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(300 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.8333333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(330 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.9166666666666666s\" repeatCount=\"indefinite\"></animate></rect></svg><span class=\"ui-icon-label tab-item-label\"> ${msg}</span></div>`;
	},
    log: function(msg='Processing', animation = true) {
        $(this.el).html('');
        if (animation === true) {
            $(this.el).html(this.animation(msg));
        } else {
            $(this.el).html(msg);
        }
    },
})

app.TestSummaryView = Backbone.View.extend({
    el: '#test-result',
    initialize: function() {
        this.listenTo(this.collection, 'reset', this.addTestResult);
        this.listenTo(this.model, 'change', this.onSubmissionChange);
    },
    render: function() {
        _.each(_.clone(this.collection.models), function(model) {
            model.destroy();
        });
        this.waitForTestResult();

        return this;
    },
    waitForTestResult: async function() {
        while (this.collection.length === 0) {
            await sleep(1000);
            this.collection.fetch({async: false, reset: true, url: `/api/submissions/${this.model.get('uid')}/test-result/`, success: function() {
                $("#animation").remove();
            }})
        }
    },
    addTestResult: function(testResult) {
        var that = this;
        this.collection.each(function(testResult) {
            var view = new app.TestResultItemView({model: testResult});
            that.$el.append(view.render().el);
        })
    },
    removeTestResult: function() {
        this.$el.html('');
    },
    onSubmissionChange: function() {
        this.removeTestResult();
    }
})

app.Console = Backbone.Model.extend({
    defaults: {
        'state': null, // compile state
        'log': null,    // compile log
        'submission': null
    }
})

app.ConsoleView = Backbone.View.extend({
    initialize: function() {
        this.el = '#console-view';
        this.logView = new app.ConsoleLogView();

        if (this.collection !== null || this.collection !== undefined) {
            this.testResultView = new app.TestSummaryView({collection: this.collection});
        }
    },
    compileLogTemplate: _.template(`
                    <div class="card">
                        <div class="card"

                    </div>
                    `
    ),
    setDefaultView: function() {
        this.emptyView();
        this.consoleLog('Click <b><i class="icon-rocket"></i> Submit</b> button to build your code and run.', false);
    },
	consoleLog: function(msg, animation=true) {
	    this.logView.log(msg, animation);
	},
    render: function() {
        var state = this.model.get('state');
        var consoleLogTemplate = _.template($('#console-log-template').html());
        var logData;
        if (state === 1) {
            logData = {
                "color": failedColor,
                "status": "Compilation Error",
                "log": this.model.get('log')
            }
            this.logView.log(consoleLogTemplate(logData), false);
        } else if (state === 0) {
            var submission = this.model.get('submission');
            var testResultList = new app.TestResultList(submission.get('uid'));

            this.testResultView = new app.TestSummaryView({model: submission, collection: testResultList});
            this.testResultView.render();
        } else {
            console.log('on compile change');
        }

        return this;
    },
    reset: function() {
        this.testResultView.collection = null;
    },
    emptyView: function() {
        $(this.el).children().each(function(index, node) {
            node.innerHTML = '';
        })
    }
})

// Challenge view for editing, submitting code
app.ChallengeView = Backbone.View.extend({
    // Must be #ui-view ???
    el: '#ui-view',
    events: {
        'click #submission-tab': 'submissionTabFocus',
        'click #submit': 'onSubmitCode',
    },
	animation: function(msg) {
		return `<div id="animation"><svg width=\"20px\" height=\"20px\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\" class=\"loader-svg-icon\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"none\" class=\"bk\"></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(0 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(30 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.08333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(60 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.16666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(90 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.25s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(120 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.3333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(150 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.4166666666666667s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(180 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(210 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5833333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(240 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.6666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(270 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.75s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(300 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.8333333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(330 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.9166666666666666s\" repeatCount=\"indefinite\"></animate></rect></svg><span class=\"ui-icon-label tab-item-label\"> ${msg}</span></div>`;
	},
    initialize: function() {
        this.compileLog = new app.CompileLog();
        _.extend(this.compileLog, Backbone.Events);
        this.listenTo(this.compileLog, 'compiled', this.onCompileDone);
        this.listenTo(this.compileLog, 'change', this.onCompileChange);

        this.lastCompileLog = new app.CompileLog({'question': this.model.get('slug')});
        this.questionView = app.disposeView(new app.QuestionView({model: this.model}));

        this.submission = new app.Submission()
        this.listenTo(this.submission, 'change', this.onSubmissionChange);

        this.consoleView = app.disposeView(new app.ConsoleView());

        var editor = new app.Editor({
            selector: 'editor',
            compile_log: this.lastCompileLog,
            options: {
                readOnly: false,
                height: $(window).height() / 1.4
            }
        })
        this.editorView = new app.EditorView({model: editor})
    },
    render: function() {
        setUpUrl('challenge/' + this.model.get('slug') + '/');
        this.questionView.setElement($('#challenge')).render();

        var that = this;
        this.lastCompileLog.fetch({url: `${this.model.url()}/last-compile/`, success: function() {
            that.editorView.setElement($('#codeeditor')).render();
        }});

        return this;
    },
    onSubmitCode: function(e) {
        this.consoleView.emptyView();
        this.consoleView.consoleLog();

        var code = this.editorView.editor.getValue();
        // Create processing animation
        var that = this;
        Backbone.ajax({
            url: `${this.model.url()}/submit/`,
            method: "POST",
            data: {
                'language': 'cpp',      // TODO: change
                'content': this.editorView.editor.getValue(),
                'question': this.model.get('slug')
            },
            dataType: "json",
            success: function(data, status, xhr) {
                // Trigger submission 'change' event
                that.submission.fetch({url: `/api/submissions/${data.uid}/`});
            },
            error: function(xhr, status, responseText) {
                // Refactor
                this.consoleView.log('An error has occurred');
            }
        });
    },
    onSubmissionChange: function() {
        this.compileLog.set("state", null);
        this.compileLog.set("uid", this.submission.get('compile_log').uid);

        // Wait for successfully compiling and fetch test result
        this.waitForCompiling();
    },
    onCompileChange: function() {
        // If is compiling, do nothing
        console.log('on compile change');
        if (this.compileLog.get('state') === 0 || this.compileLog.get('state') === 1) {
            this.compileLog.trigger('compiled');
            console.log('trigger compiled');
        }
    },
    waitForCompiling: async function() {
        this.consoleView.consoleLog('Compiling');
        while (this.compileLog.get('state') === 2 || this.compileLog.get('state') === null) {
            await sleep(1000);
            this.compileLog.fetch({async: false});
        }
    },
    onCompileDone: function(e) {
        this.consoleModel = new app.Console({
            'state': this.compileLog.get('state'),
            'log': this.compileLog.get('log'),
            'submission': this.submission
        });
        this.consoleView.model = this.consoleModel;
        this.consoleView.render();
        console.log('on compile done');
    },
    submissionTabFocus: function(e) {
        this.consoleView.setDefaultView();
        var submissionList = new app.SubmissionList(this.model.get('slug'));
        var view = new app.SubmissionView({collection: submissionList});
        view.render();
    },
})

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
    app.view = app.disposeView(new app.HomeView());
  },
  moduleRoute: function(id) {
    var module = new app.Module({id: id})
    module.fetch({success: function() {
        var challenges = new app.ChallengeList(module.get('id'))
        app.view = app.disposeView(new app.ModuleView({model: module, collection: challenges}));
        app.view.render();
    }})
  },
  dashboardRoute: function() {
    var moduleList = new app.ModuleList()
    app.view = app.disposeView(new app.DashboardView({collection: moduleList}));
    app.view.render();
  },
  loginRoute: function() {
    setUpUrl('formlogin');
  },
  challengeRoute: function(slug) {
    var challenge = new app.Challenge({slug: slug})
    challenge.fetch({success: function() {
        app.view = app.disposeView(new app.ChallengeView({model: challenge}));
        app.view.render();
    }})
  },
  submissionRoute: function(uid) {
    var submission = new app.Submission({uid: uid})
    submission.fetch({success: function() {
        app.view = app.disposeView(new app.SubmissionDetailView({model: submission}));
        app.view.render();
    }})
  },
});


// Helper function to handle Backbone ghost views
app.disposeView = function(view) {
   Backbone.View.prototype.close = function () {
      this.unbind();
      this.undelegateEvents();
   };

   /* --Destroy current view */
   if(this.currentView !== undefined) {
      this.currentView.close();
   }

   /* --Create new view */
   this.currentView = view;
   this.currentView.delegateEvents();

   return this.currentView;
}

app.router = new app.Router();
Backbone.history.start();
app.homeView = new app.HomeView();
app.view = app.homeView
