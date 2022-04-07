from datetime import datetime
import zoneinfo
from django.http import HttpResponse, Http404
from django.db.models import Sum
from django.contrib.auth.models import User

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.encoding import smart_str
from django.db.models import Sum
from wsgiref.util import FileWrapper

from .utils import send_message, randomString, getpathforUser
from .models import *
from .discord import *
from .portal import StartBattle

from celery import task
from celery.result import AsyncResult
from celery.exceptions import SoftTimeLimitExceeded

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from subprocess import PIPE
from subprocess import TimeoutExpired
import subprocess
import random
import json
import os
import time
from discord_webhook import DiscordWebhook
import requests

# import random

import logging

logger = logging.getLogger()


##############
# GET DATABASE#
##############

def getListCategory(categoryId=None):
    if categoryId:
        try:
            category = Category.objects.get(pk=categoryId)
        except Category.DoesNotExist:
            category = None
    else:
        try:
            category = Category.objects.all().order_by('pk')
        except Category.DoesNotExist:
            category = None

    return category


def getListArticle(articleId=None):
    if articleId:
        try:
            article = Article.objects.get(pk=articleId)
        except Article.DoesNotExist:
            article = None
    else:
        try:
            article = Article.objects.all().order_by('pk')
        except Article.DoesNotExist:
            article = None

    return article


def getListUserActive():
    listuser = None
    try:
        listuser = User.objects.filter(is_active=True).all()
    except User.DoesNotExist:
        logger.info("user.DoesNotExist")
        listuser = None
    return listuser


def get_player_from_user(user):
    if user:
        try:
            player = Player.objects.filter(isJoin=True).get(user=user)
        except Player.DoesNotExist:
            logger.info("Player.DoesNotExist = %s" % (user))
            player = None
    return player


def getTotalRankOfUser(userid=None):
    try:
        score = Rank.objects.filter(match__User=userid).aggregate((Sum('top')))['top__sum']
    except Rank.DoesNotExist:
        logger.info("rank.DoesNotExist")
        score = None

    return score


def getLeaderBoards():
    listscore = []
    listbot = []
    listbotHaveWinrate = WinRate.objects.all()
    for bot in listbotHaveWinrate:
        listbot.append(bot.botID)
        listscore.append(bot.win_rate * 100)
    mylist = zip(listbot, listscore)
    if listscore:
        listscore.sort(reverse=True)
    else:
        logger.info("list score does not exits")
    return mylist


def getUserFromUsername(username):
    user = None
    if username:
        user = User.objects.filter(username=username).first()

    return user


def getUserFromID(id):
    user = None
    if id:
        try:
            user = User.objects.get(pk=id)
        except User.DoesNotExist:
            logger.info("User.DoesNotExist = %s" % (id))
            user = None
    return user


def getListPlayer(playerid=None):
    player = None
    if playerid:
        try:
            player = Player.objects.filter(isJoin=True).get(pk=playerid)
        except Player.DoesNotExist:
            player = None

    else:
        try:
            player = Player.objects.filter(isJoin=True).all().order_by('pk')
        except Player.DoesNotExist:
            player = None

    return player


def get_player_from_user(user):
    # TODO: Change to None
    player = Player.objects.first()
    if user.is_authenticated:
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            logger.info("Player.DoesNotExist = %s" % (user))

    return player


def getCompileLogFromID(compileid):
    logger.info("getCompileLogFromID -- compileid= %s" % (compileid))
    compile = None
    if compileid:
        try:
            compile = Compile.objects.get(pk=compileid)
            logger.info("getCompileLogFromID -- compileid= %s -- compile = %s" % (compileid, compile))
        except Compile.DoesNotExist:
            logger.info("Compile.DoesNotExist = %s" % (compileid))
            compile = None
    return compile


def getListCompileLogFromUser(user, lastcode=False):
    listcompile = None
    if user:
        try:
            if lastcode:
                listcompile = Compile.objects.filter(user=user).last()
            else:
                listcompile = Compile.objects.filter(user=user).all().order_by('pk')
            logger.info("getListCompileLogFromUser -- user= %s -- lastcode = %d" % (user.username, lastcode))
        except Compile.DoesNotExist:
            logger.info("Compile.DoesNotExist")
            listcompile = None
    return listcompile


def getNotification():
    listNotify = None
    try:
        listNotify = Notification.objects.all().order_by('-created')
    except Notification.DoesNotExist:
        logger.info("Notification.DoesNotExist ")
    return listNotify


def getValueConfig(key=''):
    data = None
    try:
        record = Setting.objects.get(key=key)
        data = record.value
    except Setting.DoesNotExist or Setting.MultipleObjectsReturned:
        logger.info("Setting.DoesNotExist || Setting.MultipleObjectsReturned")

    return data


def getDomainName():
    txtDomainName = getValueConfig('domain_name')

    if txtDomainName:
        return txtDomainName

    return "http://localhost"


def getRowInPage():
    rowInPage = getValueConfig('row_in_page')

    if rowInPage:
        return int(rowInPage)

    return 15


def getCompileTimeLimit():
    match_time_out = getValueConfig('match_time_out')

    if match_time_out:
        return int(match_time_out) * 60

    return 60 * 5


def isRecordNotify(user, notify):
    isRead = False
    if (user):
        try:
            recordNotify = RecordNotify.objects.filter(user=user).filter(notify=notify)
            if (recordNotify.count() > 0):
                isRead = True
        except RecordNotify.DoesNotExist:
            logger.info("RecordNotify.DoesNotExist")
    return isRead


def getNewNotify(user):
    newNotify = Notification.objects.none()
    if user:
        try:
            listNotify = getNotification()
            newNotify = listNotify
            for notify in listNotify:
                if (isRecordNotify(user, notify)):
                    newNotify = newNotify.exclude(pk=notify.pk)
        except Notification.DoesNotExist:
            logger.info("Notification.DoesNotExist ")
    return newNotify


def addRecordNotify(user, newNotify):
    try:
        recordNotify = RecordNotify.objects.create(user=user, notify=newNotify)
    except RecordNotify.DoesNotExist:
        logger.info("RecordNotify.DoesNotExist ")
    return recordNotify


def getMatchfromID(matchID):
    match = None
    if matchID:
        try:
            match = Match.objects.get(pk=matchID)
        except Match.DoesNotExist:
            logger.info("Match.DoesNotExist")
            match = None
    return match


def getMatchfromTaskID(taskID):
    match = None
    if taskID:
        try:
            match = Match.objects.get(taskID=taskID)
        except Match.DoesNotExist or Match.MultipleObjectsReturned:
            logger.info("Match.DoesNotExist || MultipleObjectsReturned = %s" % taskID)
            match = None
    return match


def getMatchLive():
    matchFileRecord = None
    time = None
    try:
        live = Live.objects.get(state=1)
        if live:
            matchFileRecord = "/webservice/media/%s/%s.txt" % (live.match.User.username, live.match.taskID)
            time = live.getLiveTime()
    except Live.DoesNotExist or Live.MultipleObjectsReturned:
        logger.info("Live.DoesNotExist || MultipleObjectsReturned")

    return (matchFileRecord, time)


def getMatchPendingForUser(user, isCreateIfDoesntExit=False, isCustommatch=False):
    match = None
    if user:
        match = getMatchAvalibleforStatus(user, 0)
        round = getDefaultRound() if not isCustommatch else getCustomRoundMatch(user)
        if match is None and isCreateIfDoesntExit:
            logger.info("Create isCreateIfDoesntExit")
            match = Match(User=user, status=0)
            match.round = round
            match.save()
            bot = getBotAvaliableForUser(user)
            if bot:
                match.bot = bot
                match.save()
    return match


def getMatchAvalibleforStatus(user, status=0):
    match = None
    if user:
        try:
            match = Match.objects.filter(User=user).filter(status=status).get()
        except Match.DoesNotExist:
            logger.info("Match.DoesNotExist")
    return match


def addBottoMatch(matchid, botid):
    if matchid and botid:
        match = getMatchfromID(matchid)
        bot = getBotFromBotID(botid)
        if match and bot:
            rival = Rival(match=match, bot=bot)
            rival.save()
            return True
    return False


def getBotinMatch(matchid):
    listbot = None
    if matchid:
        match = getMatchfromID(matchid)
        try:
            listbot = Rival.objects.filter(match=match).all().order_by('pk')
        except Rival.DoesNotExist:
            logger.info("Match.DoesNotExist")
            listbot = None
    return listbot


def getRankBotforMatch(matchid, botid=None):
    listbot = None
    if matchid:
        match = getMatchfromID(matchid)
        if botid:
            bot = getBotFromBotID(botid)
            try:
                listbot = Rank.objects.filter(match=match).filter(bot=bot).all().order_by('pk')
            except Rank.DoesNotExist:
                logger.info("Match.DoesNotExist")
                listbot = None
        else:
            try:
                listbot = Rank.objects.filter(match=match).all().order_by('pk')
            except Rank.DoesNotExist:
                logger.info("Match.DoesNotExist")
                listbot = None

    return listbot


def IsCompileInProcessing(user):
    if user:
        try:
            isProcessing = Compile.objects.filter(state=2).filter(user=user).count()
            logger.info("IsCompileInProcessing :: isProcessing=%s" % isProcessing)
            if isProcessing == 0:
                return True
        except Compile.DoesNotExist:
            pass
    return False


def IsBattleInProcessing(user):
    if user:
        try:
            isProcessing = Match.objects.filter(status=1).filter(User=user).count()
            if isProcessing == 0:
                return True
        except Match.DoesNotExist:
            logger.info("Match.DoesNotExist")
    return False


def calcSorce(rank=None, kills=None, damge=None):
    # MAP RANK WITH POINT
    sourcelist = {
        1: 7,
        2: 4,
        3: 3,
        4: 2,
        5: 1
    }
    if rank:
        return sourcelist.get(rank, 0)

    return 0


def addRank(matchid, botid, position=0, kills=0, damge=0, owner=False):
    if matchid and botid:
        rMatch = getMatchfromID(matchid)
        bot = getBotFromBotID(botid)
        logging.info("---- addRank-- rMatch = %s -- bot= %s ---- owner= %s" % (matchid, botid, owner))
        if rMatch and rMatch.isStared() and bot:
            rank = Rank(match=rMatch, bot=bot)
            rank.owner = owner
            rank.top = position
            rank.score = calcSorce(position, kills, damge)
            rank.kills = kills
            rank.damge = damge
            rank.save()


def getLogFile(taskID, username):
    file_path = None

    if taskID:
        file_path = '/webservice/media/%s/%s' % (username, taskID)
    try:
        response = HttpResponse(FileWrapper(open(file_path, "r")), content_type='application/force-download')
        response['Content-Length'] = os.path.getsize(file_path)
        response['Content-Disposition'] = 'attachment; filename=%s' % smart_str(os.path.basename(file_path))
        return response
    except FileNotFoundError:
        raise Http404


def compile_cpp(username, src):
    path = getpathforUser(username)
    fileName = randomString()

    src_file = default_storage.save(path + "/%s.cpp" % fileName, ContentFile(src))
    out_file = src_file + ".out"

    compile_ = subprocess.Popen([r"g++", \
                                 "-ffast-math", "-fstack-protector-strong", "-fstrict-aliasing", \
                                 "-fno-exceptions", "-fsigned-char", "-O3", \
                                 "-w", '-std=c++0x', '-Wall', "-o", out_file, src_file \
                                 ], stdout=PIPE, stderr=PIPE)

    result = compile_.communicate()
    os.remove(src_file)

    return (out_file, result, compile_.returncode)


def compileJava(username, src):
    path = getpathforUser(username)

    fileName = "j_" + randomString()
    file = default_storage.save(path + "/%s.java" % fileName,
                                ContentFile(src.replace('class AiContest2019', "class " + fileName)))
    compile = subprocess.Popen([r"javac", file], stdout=PIPE, stderr=PIPE)
    result = compile.communicate()
    os.remove(file)
    return (path + '/' + fileName, result)


@task(name="Compile_Source")
def compile_source(username, compile_pk):
    compile_log = getCompileLogFromID(compile_pk)
    if compile_log:
        if compile_log.language == "cpp":
            file, result, return_code = compile_cpp(username, compile_log.content)
        elif compile_log.language == "java":
            file, result, return_code = compileJava(username, compile_log.content)

        compile_log.localFile = file
        compile_log.exit_status = return_code

        if result == (b'', b''):
            compile_log.state = 0
        else:
            compile_log.state = 1
            compile_log.log = result[1].decode('utf-8')

        compile_log.save()


def checkHack(code):
    isHacking = False
    with open(settings.BASE_DIR + "/backlist.txt", "rb") as file:
        keywords = file.read().splitlines()
    keywords = [x.decode('utf-8') for x in keywords]
    logger.info("keywords: %s" % keywords)
    dirty = ""
    for keyword in keywords:
        if code.find(keyword) != -1:
            dirty += " | " + keyword
    if dirty:
        isHacking = True
    logger.info("isHacking: %s" % isHacking)
    return isHacking


def process_submitted_code(user: User, data):
    if IsCompileInProcessing(user):
        compile_log = Compile(user=user)
        compile_log.content = data['content']
        compile_log.language = data['language']
        compile_log.state = 2  # Is Compiling
        compile_log.question = Question.objects.get(slug=data['question'])
        compile_log.save()

        compile_log.taskID = compile_source.delay(user.username, compile_log.pk)
        compile_log.save()

        # Create associated submission
        submission = Submission.objects.create(question=compile_log.question, compile_log=compile_log,
                                  player=get_player_from_user(user))
        return submission
    return None


def is_admin(user):
    return user.is_superuser


@task(name="Check_Testcases", soft_time_limit=getCompileTimeLimit())
def check_testcases(submission_uid):
    submission = Submission.objects.get(uid=submission_uid)
    compile_log = submission.compile_log
    test_summary = []

    # Check compile log state
    while compile_log.state == 2:
        compile_log.refresh_from_db()
        logger.info(compile_log.state)
        time.sleep(1)

    if compile_log.state == 1:
        submission.status = 1   # Wrong answer
        submission.save(update_fields=["status"])
        return

    question = compile_log.question
    test_cases = question.test_cases.all().order_by('tc_id')

    if test_cases and submission:
        for test in test_cases:
            tc_result = execute_testcase(test, compile_log, submission)
            test_summary.append(tc_result)

    if test_summary and submission:
        # submission.score = get_submission_score(test_summary)
        solved = False if any([res['passed'] is False for res in test_summary]) else True
        if solved:
            submission.status = 0  # Accepted
        else:
            submission.status = 1  # Wrong answer
        submission.save(update_fields=['status'])

        # In case user already solved the challenge, we still record submission status
        player = submission.player
        if not player.solved_questions.filter(pk=question.pk).exists():
            player.solved_questions.add(question)
            player.save()


def execute_testcase(testcase: TestCase, compile_log: Compile, submission: Submission) -> dict:
    """"
	Return dict object
	{
		"passed":
		"input":
		"output":
		"expected_output":
		"hidden":
	}
	
	"""
    # initiate subprocess and check
    input_line = testcase.input_line
    expected_result = testcase.output

    compile_ = subprocess.Popen([r"%s" % compile_log.localFile], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = compile_.communicate(input=bytes(input_line, "utf-8"), timeout=10)
    output = output.decode('utf-8')

    test_result = TestResult.objects.create(
        testcase=testcase,
        output=output,
        submission=submission,
        passed=True if output == expected_result else False,
    )

    result = parse_test_result(test_result)
    return result


def parse_test_result(test_result: TestResult):
    testcase = test_result.testcase
    compile_log = test_result.submission.compile_log

    result = {
        "tc_id": testcase.tc_id,
        "question_slug": compile_log.question.slug,
        "passed": test_result.passed,
        "input": testcase.input_line if not testcase.hidden else None,
        "output": test_result.output if not testcase.hidden else None,
        "expected_output": testcase.output if not testcase.hidden else None,
        "hidden": True if testcase.hidden else False,
        "submission_id": str(test_result.submission.uid)
    }

    return result


def send_testcase_detail(reply_channel, player, data):
    """
	Send detail of a particular testcase
	"""
    tc_id = data.get('testcase_no', None)
    submission_uid = data.get('submission_id', None)

    if tc_id is None and submission_uid is None:
        send_message(
            reply_channel,
            {
                'status': 'error',
                'type_msg': 'toast',
                'message': 'Failed to get testcase detail'
            }
        )
        return

    submission = Submission.objects.filter(uid=submission_uid, player=player).first()

    if not submission:
        send_message(
            reply_channel,
            {
                'status': 'error',
                'type_msg': 'toast',
                'message': 'Failed to get testcase detail'
            }
        )
        return None

    test_result = submission.test_results.filter(testcase__tc_id=tc_id).first()
    if not test_result:
        send_message(
            reply_channel,
            {
                'status': 'error',
                'type_msg': 'toast',
                'message': 'Failed to get testcase details'
            }
        )
        return None

    result = parse_test_result(test_result)
    send_message(
        reply_channel,
        {
            'status': 'success',
            'type_msg': 'testcase-detail',
            'data': json.dumps(result)
        }
    )


@task(name="send_submission_summary")
def send_submission_summary(reply_channel, player_pk, question_slug):
    question = Question.objects.filter(slug=question_slug).first()
    result = list()
    status = 'error'
    if question:
        submissions = question.submissions.all().filter(player__pk=player_pk).order_by('-created_at')
        status = 'success'
        vn_tz = zoneinfo.ZoneInfo('Asia/Ho_Chi_Minh')
        result = [
            {
                "id": str(sub.uid),
                "score": sub.score,
                "status": sub.get_status_display(),
                "language": sub.compile_log.get_language_display(),
                "created_at": datetime.strftime(sub.created_at.astimezone(vn_tz), '%b. %-d, %Y, %-l:%M %P'),
                "url": sub.get_url(),
            } for sub in submissions
        ]
    send_message(reply_channel, {'status': status, 'type_msg': 'submission-summary', 'data': json.dumps(result)})


def send_submission_detail(reply_channel, player_pk, submission_id):
    submission = Submission.objects.filter(uid=submission_id, player__pk=player_pk).first()
    if not submission:
        send_message(reply_channel, {'status': 'error', 'type_msg': 'toast', 'message': 'Failed to get submission'})
        return

    compile_log = submission.compile_log
    submission_dict = {
        "id": str(submission.uid),
        "question_slug": submission.question.slug,
        "score": submission.score,
        "status": submission.get_status_display(),
        "language": compile_log.language.get_language_display(),
        "exit_status": compile_log.exit_status,
        "compile_log": compile_log.log,
        "code": compile_log.content,
        "test_results": [parse_test_result(test_result) for test_result in
                         submission.test_results.all().order_by("testcase__tc_id")]
    }
    return send_message(
        reply_channel,
        {'status': 'success', 'type_msg': 'submission-detail', 'data': json.dumps(submission_dict)}
    )


@task(name="Send_Email")
def sendEmail(email, username, type, url):
    subject = None
    content = None
    if type == settings.EMAIL_REGISTER_VERIFY:
        logger.info("EMAIL_REGISTER_VERIFY -- email = %s -- url = %s " % (email, url))
        subject = "Registration for LG VS DCV Da Nang Contest 2022"
        with open(settings.EMAIL_TEMPLATE_PATH + 'register_confirm_email.html') as f:
            content = f.read()

        content = content.replace("USERNAME_FILL_HERE", username)
        content = content.replace("URL_DOMAIN_FILL_HERE", getDomainName())
        content = content.replace("URL_VERIFY_FILL_HERE", url)
    elif type == settings.EMAIL_CHANGEPASSS_VERIFY:
        logger.info("EMAIL_CHANGEPASSS_VERIFY -- email = %s -- url = %s " % (email, url))
        subject = "LG VS DCV Contest 2022 Changing Password Confirmation"
        with open(settings.EMAIL_TEMPLATE_PATH + 'change_password_confirm_url.html') as f:
            content = f.read()

        content = content.replace("USERNAME_FILL_HERE", username)
        content = content.replace("URL_DOMAIN_FILL_HERE", getDomainName())
        content = content.replace("URL_VERIFY_FILL_HERE", url)
    elif type == settings.EMAIL_FORGOT_VERIFY:
        logger.info("EMAIL_FORGOT_VERIFY -- email = %s -- url = %s " % (email, url))
        subject = "LG VS DCV Contest 2022 Reset Account Password"
        with open(settings.EMAIL_TEMPLATE_PATH + 'forgot_password_confirm_url.html') as f:
            content = f.read()

        content = content.replace("USERNAME_FILL_HERE", username)
        content = content.replace("URL_DOMAIN_FILL_HERE", getDomainName())
        content = content.replace("URL_VERIFY_FILL_HERE", url)

    if subject and content:
        msg = EmailMultiAlternatives(subject, content, settings.EMAIL_HOST_USER, [email])
        msg.attach_alternative(content, "text/html")
        msg.send()
        return True

    return False