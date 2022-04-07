app.PaginatedCollection = Backbone.Collection.extend({
    // Each paginated response from backend has the following structure (+ `results` attributes)
    defaults: {
        count: null,
        next: null,
        previous: null,
    },
    parse: function(response) {
        // Save this scope inside a variable.
        var self = this;

        // Construct model object from `results` attribute
        _.each(response.results, function(item, index) {
            var member = new self.model(item);
            self.push(member);
        });

        return this.models;
    }
})

app.collections.ModuleList = app.PaginatedCollection.extend({
    model: app.models.Module,
    url: '/api/modules/'
})

app.collections.SubmissionList = app.PaginatedCollection.extend({
  model: app.models.Submission,
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

app.collections.TestResultList = Backbone.Collection.extend({
  model: app.models.TestResult,
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

app.collections.SolutionTemplateList = Backbone.Collection.extend({
  model: app.models.SolutionTemplate,
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

app.collections.ChallengeList = Backbone.Collection.extend({ model: app.models.Challenge,
    initialize: function(moduleId) {
        this.moduleId = moduleId;
    },
    url: function() {
        return `/api/modules/${this.moduleId}/get-questions`;
    }
})
