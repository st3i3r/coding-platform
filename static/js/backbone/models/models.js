app.models.SkillSet = Backbone.Model.extend({
  defaults: {
    title: '',
    id: null,
    description: '',
    enabled: true,
  }
});

app.models.Module = Backbone.Model.extend({
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

app.models.Editor = Backbone.Model.extend({
  defaults: {
    selector: 'editor',
    compile_log: null,
    options: {
        readOnly: false,
        height: $(window).height() / 1.7
    }
  }
})

app.models.CompileLog = Backbone.Model.extend({
  defaults: {
    uid: null,
    content: null,
    language: '',
    state: null,
    log:'',
    question: '',
    exit_status: 0
  },
  idAttribute: 'uid',
  urlRoot: '/api/compiles/'
})

app.models.Submission = Backbone.Model.extend({
  defaults: {
    uid: null,
    status: null,
    score: 0,
    compile_log: {
        uid: null,
        language: null
    }
  },
  idAttribute: 'uid',
  urlRoot: '/api/submissions/'
})

app.models.SolutionTemplate = Backbone.Model.extend({
  defaults: {
    id: null,
    language: null,
    content: '',
    question: null,
  },
  idAttribute: 'id',
  urlRoot: '/api/solution-templates/'
})

app.models.Console = Backbone.Model.extend({
    defaults: {
        'state': null, // compile state
        'log': null,    // compile log
        'submission': null
    }
})


app.models.TestResult = Backbone.Model.extend({
  defaults: {
    uid: null,
    passed: null,
    output: '',
    testcase: null
  },
  idAttribute: 'uid',
  urlRoot: '/api/test-result/'
})

app.models.Challenge = Backbone.Model.extend({
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

