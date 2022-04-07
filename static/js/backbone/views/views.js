app.views.HomeView = Backbone.View.extend({
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
        app.utils.setupURL($.defaultPage);
    }
})
app.views.ModuleItemView = Backbone.View.extend({
    el: '#modules',
    events: {
        'click a': app.navigateHref
    },
    initialize: function() {
        var moduleTemplate = _.template($('#module-template').html());
        this.$el.append(moduleTemplate(this.model.toJSON()));
        return this;
    },
})


app.views.ModuleView = Backbone.View.extend({
    el: '#challenges',
    initialize: function() {
        this.listenTo(this.collection, 'add', this.addOneChallenge);
    },
    render: function() {
        app.utils.setupURL('modules/' + this.model.get('id'));
        var headerTemplate = _.template($('#module-header-template').html());
        $('#module-header').html(headerTemplate(this.model.toJSON()));

        this.collection.fetch();
        return this;
    },
    addOneChallenge: function(challenge) {
        var view = new app.views.ChallengeItemView({model: challenge})
        view.render();
    },
    addAllChallenge: function() {
        this.$('#challenges').html('');
        this.collection.each(this.addOneChallenge, this);
    }
})

app.views.DashboardView = Backbone.View.extend({
    el: '#ui-view',
    url: 'dashboard',
    initialize: function() {
        // Rewrite another function to put HTML to 'el'
        // TODO: Change to function var
        this.listenTo(this.collection, 'add', this.addModule); // 'this' is a ModuleItemView instance
    },
    render: function() {
        // Wait for HTML and then fetch modules
        app.utils.setupURL(this.url);
        this.collection.fetch();
        console.log(this.collection);
        return this;
    },
    addModule: function(module) {
        var view = new app.views.ModuleItemView({model: module})
        view.render();
    },
})

app.views.ChallengeItemView = Backbone.View.extend({
    el: '#challenges',
    events: {
        'click a': app.navigateHref
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

app.views.SubmissionItemView = Backbone.View.extend({
    el: '#submission-list',
    events: {
        'click a': app.navigateHref,
    },
    initialize: function() {
    },
    render: function() {
        var submissionTemplate = _.template($('#submission-template').html());
        this.$el.append(submissionTemplate(this.model.toJSON()));

        return this;
    }
})

app.views.SubmissionView = Backbone.View.extend({
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
        'click .paginate': "changePage",
    },
    changePage: function(e) {
        e.preventDefault();
        $("#submission-list").html("");
        this.collection.url = e.target.href;
        this.collection.fetch({reset: true});
    },
    initialize: function() {
        this.listenTo(this.collection, 'reset', this.onResetSubmissions);
    },
    render: function() {
        this.$el.html(this.submissionListContainer);
        this.collection.fetch({reset: true})
        this.addPaginator();
        $('#submission-tab').tab('show');
        return this;
    },
    onResetSubmissions: function() {
        this.collection.each(function(submission) {
            var view = new app.views.SubmissionItemView({model: submission})
            view.render();
        });
    },
    addPaginator: function() {
        var paginateTemplate = _.template($('#paginate-template').html());
        console.log(this.collection.metaInfo);
        this.$el.append(paginateTemplate({next: this.collection.metaInfo.next, previous: this.collection.metaInfo.previous}));
    }
})

app.views.SubmissionDetailView = Backbone.View.extend({
    el: '#submissions',
    events: {
        'click a': app.navigateHref
    },
    initialize: function() {
        this.compileLog = new app.models.CompileLog(this.model.get('compile_log'))
        var editor = new app.models.Editor({
            selector: 'submitted-code',
            compile_log: this.compileLog,
            options: {
                readOnly: true,
                height: $(window).height() / 1.7
            }
        })
        this.editorView = new app.views.EditorView({model: editor});
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
app.views.QuestionView = Backbone.View.extend({
    el: '#challenge',
    initialize: function() {
    },
    render: function() {
        var challengeTemplate = _.template($('#challenge-template').html());
        this.$el.html(challengeTemplate({'description': this.model.get('description')}))
        return this;
    }
})
app.views.EditorView = Backbone.View.extend({
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
            this.solutionTemplateList = new app.collections.SolutionTemplateList(compileLog.get('question'));
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

app.views.TestResultDetailView = Backbone.View.extend({
    el: '#test-result-detail',
    initialize: function() {
        // this.$el.html('');
    },
    render: function() {
        var data = this.model.toJSON();
        console.log(data);
        data['color'] = this.model.get('passed') === true ? app.utils.passedColor : app.utils.failedColor;

        var resultTemplate = _.template($('#test-result-detail-template').html());
        this.$el.html(resultTemplate(data));
        return this;
    }
})

app.views.TestResultItemView = Backbone.View.extend({
    el: '#test-result',
    events: function() {
          var selector = '#testcase-' + this.model.get('testcase').id; // this id corresponds to your template id
          var ev = {};
          ev['click ' + selector] = 'onTestCaseClick';
          return ev;
    },
	passedIconHTML: function() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label="Passed" class="ui-svg-icon" fill=${app.utils.passedColor}><path d="M12 23C5.9 23 1 18.1 1 12c0-3 1.1-5.7 3.2-7.8C6.3 2.1 9.1 1 12 1c1.6 0 3.1.3 4.5 1 .5.2.7.8.5 1.3-.2.5-.8.7-1.3.5-1.2-.5-2.4-.8-3.7-.8-5 0-9 4-9 9s4 9 9 9 9-4 9-9v-.9c0-.6.4-1 1-1s1 .4 1 1v.9c0 6.1-4.9 11-11 11z"></path><path d="M12 15c-.3 0-.5-.1-.7-.3l-3-3c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l2.3 2.3L22.3 2.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-11 11c-.2.2-.4.3-.7.3z"></path></svg>`;
	},
	failedIconHTML: function() {
		return ` <svg viewBox="0 0 100 100" width="1em" height="1em" role="img" aria-label="Failed" class="ui-svg-icon" fill=${app.utils.failedColor}><path d="M88.184 81.468a3.008 3.008 0 0 1 0 4.242l-2.475 2.475a3.008 3.008 0 0 1-4.242 0l-69.65-69.65a3.008 3.008 0 0 1 0-4.242l2.476-2.476a3.008 3.008 0 0 1 4.242 0l69.649 69.651z"></path><path d="M18.532 88.184a3.01 3.01 0 0 1-4.242 0l-2.475-2.475a3.008 3.008 0 0 1 0-4.242l69.65-69.651a3.008 3.008 0 0 1 4.242 0l2.476 2.476a3.01 3.01 0 0 1 0 4.242l-69.651 69.65z"></path></svg>`;
	},
	lockedIconHTML: function() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" class="ui-svg-icon" fill=""><path d="M19 10h-1V7c0-3.3-2.7-6-6-6S6 3.7 6 7v3H5c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3zM8 7c0-2.2 1.8-4 4-4s4 1.8 4 4v3H8V7zm12 13c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-7c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v7z"></path></svg>`
	},
    initialize: function() {
        this.testResultDetailView = new app.views.TestResultDetailView({model: this.model});
    },
    render: function() {
        var testResultTemplate = _.template($('#test-result-template').html());
        var data = this.model.toJSON();
        data['color'] = this.model.get('passed') === true ? app.utils.passedColor : app.utils.failedColor;
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

app.views.ConsoleLogView = Backbone.View.extend({
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

app.views.TestSummaryView = Backbone.View.extend({
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
            await app.utils.sleep(1000);
            this.collection.fetch({async: false, reset: true, url: `/api/submissions/${this.model.get('uid')}/test-result/`, success: function() {
                $("#animation").remove();
            }})
        }
    },
    addTestResult: function(testResult) {
        var that = this;
        this.collection.each(function(testResult) {
            var view = new app.views.TestResultItemView({model: testResult});
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

app.views.ConsoleView = Backbone.View.extend({
    initialize: function() {
        this.el = '#console-view';
        this.logView = new app.views.ConsoleLogView();

        if (this.collection !== null || this.collection !== undefined) {
            this.testResultView = new app.views.TestSummaryView({collection: this.collection});
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
                "color": app.utils.failedColor,
                "status": "Compilation Error",
                "log": this.model.get('log')
            }
            this.logView.log(consoleLogTemplate(logData), false);
        } else if (state === 0) {
            var submission = this.model.get('submission');
            var testResultList = new app.collections.TestResultList(submission.get('uid'));

            this.testResultView = new app.views.TestSummaryView({model: submission, collection: testResultList});
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
app.views.ChallengeView = Backbone.View.extend({
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
        this.compileLog = new app.models.CompileLog();
        _.extend(this.compileLog, Backbone.Events);
        this.listenTo(this.compileLog, 'compiled', this.onCompileDone);
        this.listenTo(this.compileLog, 'change', this.onCompileChange);

        this.lastCompileLog = new app.models.CompileLog({'question': this.model.get('slug')});
        this.questionView = app.utils.disposeView(new app.views.QuestionView({model: this.model}));

        this.submission = new app.models.Submission()
        this.listenTo(this.submission, 'change', this.onSubmissionChange);

        this.consoleView = app.utils.disposeView(new app.views.ConsoleView());

        var editor = new app.models.Editor({
            selector: 'editor',
            compile_log: this.lastCompileLog,
            options: {
                readOnly: false,
                height: $(window).height() / 1.4
            }
        })
        this.editorView = new app.views.EditorView({model: editor})
    },
    render: function() {
        app.utils.setupURL('challenge/' + this.model.get('slug') + '/');
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
            await app.utils.sleep(1000);
            this.compileLog.fetch({async: false});
        }
    },
    onCompileDone: function(e) {
        this.consoleModel = new app.models.Console({
            'state': this.compileLog.get('state'),
            'log': this.compileLog.get('log'),
            'submission': this.submission
        });
        this.consoleView.model = this.consoleModel;
        this.consoleView.render();
    },
    submissionTabFocus: function(e) {
        this.consoleView.setDefaultView();
        var submissionList = new app.collections.SubmissionList(this.model.get('slug'));
        var view = new app.views.SubmissionView({collection: submissionList});
        view.render();
    },
})
