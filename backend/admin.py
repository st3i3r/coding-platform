from django.contrib import admin, messages
from backend.models import *

# from .tasks import addBottoMatch, start_battle, getRoundToCustomMatch
import logging

logger = logging.getLogger()


# Register your models here.
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'index', 'created', 'modified']
    list_filter = ['created']
    search_fields = ['title']
    ordering = ['index']


class ArticleAdmin(admin.ModelAdmin):
    list_display = ['category', 'title', 'index', 'sortContent', 'created', 'modified']
    list_filter = ['created']
    search_fields = ['title']
    ordering = ['category', 'index']


class PlayerAdmin(admin.ModelAdmin):
    list_display = ['user', 'phoneNumber', 'graduation', 'university', 'botLog', 'isJoin']
    search_fields = []
    list_filter = ['botLog', 'isJoin']
    actions = ['resetScore']

    def resetScore(self, request, queryset):
        queryset.update(score=0)

    resetScore.short_description = "Reset score of players selected"


class CompileAdmin(admin.ModelAdmin):
    list_display = ['user', 'language', 'taskID', 'state', 'created', 'modified']
    list_filter = ['language', 'state', 'user']
    search_fields = ['taskID']


class BotAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'compile', 'active']
    list_filter = ['active', 'user']
    search_fields = ['name']
    actions = ['startmatch']

    def startmatch(self, request, queryset):
        logger.info("Start Match Custom -- Number Bot Select = %s" % (queryset.count()))
        if queryset.count() > 1:
            match = Match(User=request.user, status=1, customatch=True)
            match.round = getRoundToCustomMatch()
            match.save()
            for index, bot in enumerate(queryset.all()):
                logger.info("Start Match Custom -- index = %s -- Bot.pk select = %s" % (index, bot.pk))
                if index == 0:
                    match.bot = bot
                    match.save()
                else:
                    addBottoMatch(match.pk, bot.pk)
            # Start Battle
            taskID = start_battle.delay(match.pk)
            match.taskID = taskID
            match.save()
            messages.info(request, "The match has been added to queue.")
        else:
            messages.error(request, "The number BOT in match MUST larger than 1")

    startmatch.short_description = "Create a custom match with bot select"


class RoundAdmin(admin.ModelAdmin):
    list_display = ['name', 'created', 'active', 'user']
    list_filter = ['active']
    search_fields = []


class RoundGroupAdmin(admin.ModelAdmin):
    list_display = ['roundid', 'groupid']
    list_filter = ['roundid']
    search_fields = []


class RankAdmin(admin.ModelAdmin):
    list_display = ['bot', 'match', 'getround', 'getgroup', 'owner', 'top', 'score', 'kills', 'damge']
    list_filter = ['owner', 'match__group', 'match__round']
    search_fields = ['match']

    def getround(self, obj):
        return obj.match.round

    getround.admin_order_field = 'round'
    getround.short_description = 'Round'

    def getgroup(self, obj):
        return obj.match.group

    getgroup.admin_order_field = 'group'
    getgroup.short_description = 'Group'


class RivalAdmin(admin.ModelAdmin):
    list_display = ['match', 'bot', 'created']
    list_filter = ['match']
    search_fields = ['match']


class LiveAdmin(admin.ModelAdmin):
    list_display = ['match', "livetime", 'state']
    list_filter = []
    search_fields = []


class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', "message", 'created']
    list_filter = []
    search_fields = []
    ordering = ['-created']


class RecordNotifyAdmin(admin.ModelAdmin):
    list_display = ['user', 'notify']
    list_filter = []
    search_fields = []
    ordering = ['user']


class SettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value']
    list_filter = []
    search_fields = ['key']


class TestCaseInline(admin.StackedInline):
    model = TestCase


class QuestionAdmin(admin.ModelAdmin):
    list_display = ['description']
    inlines = [TestCaseInline, ]


class SkillSetAdmin(admin.ModelAdmin):
    pass


class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['uid', 'status', 'player']


class ModuleAdmin(admin.ModelAdmin):
    pass


class SolutionTemplateAdmin(admin.ModelAdmin):
    pass


class TestResultAdmin(admin.ModelAdmin):
    pass


admin.site.register(Category, CategoryAdmin)
admin.site.register(Article, ArticleAdmin)
admin.site.register(Player, PlayerAdmin)
admin.site.register(Compile, CompileAdmin)
admin.site.register(Round, RoundAdmin)
admin.site.register(Round_Group, RoundGroupAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(RecordNotify, RecordNotifyAdmin)
admin.site.register(Setting, SettingAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(SkillSet, SkillSetAdmin)
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(Module, ModuleAdmin)
admin.site.register(SolutionTemplate, SolutionTemplateAdmin)
admin.site.register(TestResult, TestResultAdmin)