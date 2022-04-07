from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage

from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import render, redirect

from django.utils.encoding import force_text, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.core.mail import EmailMultiAlternatives
from django.views.decorators.cache import cache_page
from rest_framework_simplejwt.tokens import RefreshToken

from .utils import get_tokens_for_user
from .models import *
from .tasks import (getLogFile, getUserFromID,
                    getListArticle, getListCategory,
                    getCompileLogFromID, getUserFromUsername, get_player_from_user,
                    getListCompileLogFromUser,
                    getNotification, getMatchPendingForUser,
                    addBottoMatch, getBotinMatch,
                    getNewNotify, addRecordNotify, sendEmail, getLeaderBoards,
                    getMatchfromTaskID, getMatchLive,
                    getDomainName, getRowInPage,
                    )

from .tokens import account_activation_token, account_password_reset_token
import json
import re

import logging

logger = logging.getLogger()


# Create your views here.


def index(request):
    user = request.user
    logger.info(request.user)

    if user.is_authenticated:
        newNotify = getNewNotify(user)
    else:
        user = None
        newNotify = []

    return render(request, 'index.html')


def home(request):
    user = request.user
    if user.is_authenticated:
        notifies = getNotification()
        newNotifies = getNewNotify(user)
        if (request.GET.get("action") == "clickNotify"):
            for newNotify in newNotifies:
                logger.info("newNotify: %s" % newNotify)
                addRecordNotify(user, newNotify)
    else:
        notifies = []
    return render(request, 'page/home.html', {'notifies': notifies})


@login_required()
def profile(request):
    user = request.user
    player = get_player_from_user(user)
    is_enableEdit = not isTournamentActive()

    if request.method == 'POST':
        type = 1
        if player == None:
            player = Player(user=user, isJoin=False, botLog=0)
        if not request.FILES.get('myimage', None):
            if 'firstname' in request.POST:
                try:
                    user.first_name = request.POST.get('firstname')
                    user.last_name = request.POST.get('lastname')
                    user.save()
                    player.phoneNumber = request.POST.get('phonenumber')
                    player.university = request.POST['university']
                    player.graduation = request.POST['graduation']
                    player.botLog = request.POST['botlog']
                    if int(request.POST['join']) == 1:
                        player.isJoin = True
                    else:
                        player.isJoin = False
                    player.save()
                    status = "success"
                    info = "Update successfully"
                except:
                    status = "error"
                    info = "Please double check your input"
                    type = 0
            elif 'currentpass' in request.POST:
                try:
                    currentPass = request.POST['currentpass']
                    newPassword = request.POST['newpass']
                    reNewpassword = request.POST['confirmNewPass']
                    if not user.check_password(currentPass):
                        info = "Wrong current password"
                    elif len(newPassword) < 8:
                        info = "Your password too short, minimum length is 8 characters"
                    elif newPassword != reNewpassword:
                        info = "The password does not match"
                    else:
                        user.set_password(newPassword)
                        user.save()
                        return JsonResponse({'type': 'reload'})
                    return JsonResponse({'type': 'error', 'data': info})
                except:
                    info = "Please double check your input"
                    status = "error"
                    type = 0
        else:
            player.avatar = request.FILES['myimage']
            player.save()
        return JsonResponse({'type': 'toast', 'status': status, 'data': info})

    return render(request, 'page/profile.html',
                  {'profile_user': user, 'profile_player': player, 'is_EnableEdit': is_enableEdit})


@login_required()
def challenge(request, slug=None):
    # if slug is None, get last question using last compile log
    last_compile_log = getListCompileLogFromUser(request.user, lastcode=True)
    if slug is None:
        if not last_compile_log:
            return JsonResponse({'type': 'toast', 'status': 'error', 'redirect': '/#dashboard'})

        question = last_compile_log.question
        return JsonResponse({'type': 'toast', 'status': 'success', 'redirect': f'/#challenge/{question.slug}'})
    else:
        question = Question.objects.filter(slug=slug).first()

    submission_id = request.GET.get('submission_id')

    if not question:
        return JsonResponse({'type': 'error', 'success': 'error', 'data': 'Invalid question'})

    submissions = question.submissions.all().order_by('-created_at')
    if submission_id:
        # Open challenge page with source code of a particular submission
        _submission = Submission.objects.filter(id=submission_id).first()
        compile_log = _submission.compile_log
    else:
        compile_log = last_compile_log

    solution_templates = None
    if not compile_log:
        solution_templates = question.solution_templates.all()

    return render(request, 'page/codeditor.html',
                  {'question': question, 'compile_log': compile_log, 'solution_templates': solution_templates, 'submissions': submissions})


@login_required()
def addbottomatch(request):
    if isTournamentActive():
        if not isCustommatchActive(request.user):
            return JsonResponse({'type': 'toast', 'status': 'error', 'data': 'Tournament is running'})

    info = "There was an error adding the bot. Please contact with admin."
    status = "error"
    if request.method == "POST":
        botpk = request.POST['botnameadd']
        logger.info("botpk= %s" % (botpk))
        if isCustommatchActive(request.user) and isTournamentActive():
            botActiveforUser = getBotAvaliableForUser(request.user)
            if int(botpk) != int(botActiveforUser.pk):
                return JsonResponse({'type': 'toast', 'status': 'error',
                                     'data': 'The tournament is running, You cannot add rival bots'})

        if botpk:
            match = getMatchPendingForUser(request.user, True,
                                           (isCustommatchActive(request.user) and isTournamentActive()))
            bot_rival = getBotFromBotID(botpk)
            listbotinmatch = getBotinMatch(match.pk)
            if listbotinmatch.count() < getMaxLimitBot():
                if match and bot_rival:
                    addBottoMatch(match.pk, bot_rival.pk)
                    info = "Bot added to match"
                    status = "success"
            else:
                info = "You have added an over limit"
    return JsonResponse({'type': 'toast', 'status': status, 'data': info})


@login_required()
def live(request):
    if not isTournamentActive():
        return JsonResponse({'type': 'toast', 'status': 'error', 'data': 'Permission Denied'})
    return render(request, 'page/replay.html')


@login_required()
def live_time(request):
    pathSaveFile, timeStart = getMatchLive()
    return JsonResponse({'matchfile': pathSaveFile, 'timestart': timeStart})


@login_required()
def activebot(request, id):
    if isTournamentActive():
        if not isCustommatchActive(request.user):
            return JsonResponse({'type': 'toast', 'status': 'error', 'data': 'Tournament is running'})

    info = "Bot not activated"
    status = "error"
    logger.info("activebot :: id= %s" % (id))
    if request.method == "POST":
        listbot = getBotFromUsername(request.user)
        if listbot:
            for bot in listbot:
                logger.info("bot.pk= %s -- bot.name= %s -- activebot.pk = %s" % (bot.pk, bot.name, id))
                if bot.pk == id:
                    bot.active = True
                    info = "Bot %s activated" % bot.name
                    status = "success"
                else:
                    bot.active = False
                bot.save()
    return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#bot', 'tablist': 'tablistbot'})


@login_required()
def savebot(request):
    info = "Save bot error. Please contact with admin"
    status = "error"
    if request.method == "POST":
        botname = request.POST['botname']
        compileid = request.POST['compileid']
        if len(botname) < 3:
            info = "Bot name too short, minimum length is 3 characters"
            return JsonResponse({'type': 'error', 'data': info})
        if compileid:
            info = "Save bot complete"
            status = "success"
            compile = getCompileLogFromID(compileid)
            bot = Bot(user=request.user, compile=compile)
            bot.name = botname
            bot.save()

    return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#bot'})


def register(request):
    info = None
    # Disbale Register
    # if request.method == "POST":
    if False:
        firstname = request.POST['firstname']
        lastname = request.POST['lastname']
        username = request.POST['username']
        phonenumber = request.POST['phonenumber']
        email = request.POST['email']
        graduation = request.POST['graduation']
        university = request.POST['university']
        password = request.POST['password']
        repassword = request.POST['confirm_password']
        user = getUserFromUsername(username)
        if user:
            info = "Username already exists"
        elif len(username) < 5:
            info = "Your username too short, minimum length is 5 characters"
        elif email and not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
            info = "Invalid email format"
        elif password != repassword:
            info = "The password does not match"
        elif len(password) < 8:
            info = "Your password too short, minimum length is 8 characters"
        else:
            user_email = User.objects.filter(email=email).first()
            if user_email:
                info = "Email already exists"
            else:
                info = "You have successfully created an account, please access the email to activate."
                status = "success"
                user = User(username=username, email=email, is_active=False)
                user.first_name = firstname
                user.last_name = lastname
                user.set_password(password)
                user.save()

                player = Player(user=user, isJoin=False, botLog=2)
                player.phoneNumber = phonenumber
                player.graduation = graduation
                player.university = university
                player.save()

                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = account_activation_token.make_token(user)
                url = "%s/#verify/%s/%s" % (getDomainName(), uid, token)
                logger.info("Uid= %s -- Token= %s -- Url= %s " %
                            (uid, token, url))
                sendEmail(email, username, settings.EMAIL_REGISTER_VERIFY, url)

                return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#login'})

        return JsonResponse({'type': 'error', 'data': info})

    return render(request, 'page/register.html')


def verifyemail(request, uidb64, token):
    uid = force_text(urlsafe_base64_decode(uidb64))
    user = getUserFromID(uid)

    if user.is_active:
        info = " Your account is already activated, you can login now"
        status = "success"
        return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#login'})

    if user and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        login(request, user)
        logger.info("User=%s uidb64= %s -- token= %s -- " %
                    (user, uidb64, token))
        return JsonResponse({'type': 'toast', 'data': 'Verify Token Valid'})
        # TODO Need processs redirect home with toast above
    if request.method == "POST":
        info = "The email has been sent, please access the email to activate."
        status = "info"
        token = account_activation_token.make_token(user)
        url = "%s/#verify/%s/%s" % (getDomainName(), uidb64, token)
        logger.info("Resend email verify :: Uid= %s -- Token= %s -- Url= %s " % (uid, token, url))
        sendEmail(email, user.username, settings.EMAIL_REGISTER_VERIFY, url)
        return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#login'})

    return render(request, 'page/invalidtoken.html', {'uidb64': uidb64, 'token': token})


def forgotpassword(request):
    info = None
    # Disbale Forgot password
    # if request.method == "POST":
    if False:
        email = request.POST['email']
        if email and not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
            info = "Invalid email format"
        else:
            user_email = User.objects.filter(email=email).first()
            if user_email:
                info = "An email to confirm forgot password has been sent to your email.!"
                status = "info"
                uid = urlsafe_base64_encode(force_bytes(user_email.pk))
                token = account_password_reset_token.make_token(user_email)
                url = "%s/#passwordresetconfirm/%s/%s" % (getDomainName(), uid, token)
                logger.info("Uid= %s -- Token= %s -- Url= %s " %
                            (uid, token, url))
                sendEmail(email, user_email.username, settings.EMAIL_FORGOT_VERIFY, url)
                return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#login'})

            info = "Email Invalid"
        return JsonResponse({'type': 'error', 'data': info})
    return render(request, 'page/forgotpassword.html', {'info': info})


def passwordresetconfirm(request, uidb64, token):
    info = None
    status = None
    uid = force_text(urlsafe_base64_decode(uidb64))
    user = getUserFromID(uid)

    if request.method == "POST":
        logger.info("Password reset Confirm :: uidb64 = %s --  token = %s" % (uidb64, token))
        password = request.POST['password']
        repassword = request.POST['confirm_password']
        if password != repassword:
            info = "The password does not match"
            status = "error"
        elif len(password) < 8:
            info = "Your password too short, minimum length is 8 characters"
            status = "error"
        else:
            info = "Change password successfully! Now you can login with a new password"
            status = "success"
            user.set_password(password)
            user.save()
            return JsonResponse({'type': 'toast', 'status': status, 'data': info, 'redirect': '/#login'})
        return JsonResponse({'type': 'toast', 'status': status, 'data': info})

    if user and account_password_reset_token.check_token(user, token):
        logger.info("User=%s uidb64= %s -- token= %s -- " % (user, uidb64, token))
        return render(request, 'page/registration/password_reset_confirm.html',
                      {'info': info, 'username': user.username, 'uidb64': uidb64, 'token': token})

    return render(request, 'page/registration/password_reset_invalidtoken.html')


def login_request(request):
    """
	Additionally generate JWT token
	"""

    info = None
    user = request.user
    if user != None and user.is_authenticated:
        if user.first_name.strip() == "" or user.last_name.strip() == "":
            return profile(request)
        else:
            return home(request)

    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        logger.info("Request=%s Username= %s -- Password= %s -- " % (request, username, password))
        user = authenticate(request=request, username=username, password=password)
        if user:
            player, created = Player.objects.get_or_create(user=user)
            if created:
                info = "You have successfully created an account, please access the email to activate."
                status = "success"

                player.isJoin = False
                player.botLog = 2
                player.save()
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = account_activation_token.make_token(user)
                url = "%s/#verify/%s/%s" % (getDomainName(), uid, token)
                logger.info("Uid= %s -- Token= %s -- Url= %s " % (uid, token, url))
                sendEmail(user.email, username, settings.EMAIL_REGISTER_VERIFY, url)
                return JsonResponse({'type': 'toast', 'status': status, 'data': info})

            if not user.is_active:
                info = "Please check your email to activate your account."
                status = "error"
                return JsonResponse({'type': 'toast', 'status': status, 'data': info})
            else:
                request.session.set_expiry(86400)
                login(request, user)
                # set cookie in front-end
                tokens = get_tokens_for_user(user)
                return JsonResponse({'type': 'login', 'tokens': json.dumps(tokens)})

        info = "Please check your username or password"
        return JsonResponse({'type': 'error', 'data': info})

    return render(request, 'page/login.html')


def logout_request(request):
    # Blacklist token
    if not request.user.is_anonymous:
        logger.info(request)
        refresh_token = get_tokens_for_user(request.user)['refresh']
        token = RefreshToken(refresh_token)
        logger.info(token.__dict__)
        token.blacklist()

        request.session.flush()
        return JsonResponse({'type': 'logout'})
    else:
        return JsonResponse({'type': 'toast', 'status': 'info', 'data': 'You are not logged in'})


def learn_view(request):
    Data = {'article': getListArticle(4),
            'category': getListCategory().order_by('index')}
    return render(request, 'page/learn.html', Data)


def article(request, id, human):
    Data = {'category': getListCategory().order_by('index'),
            'article': getListArticle(id)}
    return render(request, 'page/learn.html', Data)


def notify(request, id):
    noti = Notification.objects.get(id=id)
    user = request.user
    user.notification.add(noti)
    user.save()
    return HttpResponse(None, content_type="application/json")


@login_required()
def matchlist(request, botname=None):
    page = request.GET.get('page', 1)
    listMatch = None
    matchResult = None
    listRival = []
    round = getDefaultRound()
    if round:
        logger.info("matchlist -- round == %s -- botname = %s" % (round.name, botname))
        if botname:
            listMatch = getMatch(round, botname=botname)
        else:
            listMatch = getMatch(round)
    if listMatch:
        paginator = Paginator(listMatch, getRowInPage())
        matchResult = paginator.page(page)

    if matchResult:
        for match in matchResult:
            rank = getRankRivalList(match.pk)
            if rank:
                listRival.append({'matchid': match.pk, 'rank': rank})
    return render(request, 'page/matchlist.html',
                  {'listMatch': matchResult, 'page': page, 'listRival': listRival, 'keyword': botname})


@login_required()
def custom_matchlist(request):
    if not isTournamentActive():
        return JsonResponse({'type': 'toast', 'status': 'error', 'data': 'Permission Denied'})

    page = request.GET.get('page', 1)
    listMatch = None
    matchResult = None
    listRival = []
    round = getCustomRoundMatch(request.user)
    if round:
        logger.info("matchlist -- round == %s" % round.name)
        listMatch = getMatch(round)

    if listMatch:
        paginator = Paginator(listMatch, getRowInPage())
        matchResult = paginator.page(page)

    if matchResult:
        for match in matchResult:
            rank = getRankRivalList(match.pk)
            if rank:
                listRival.append({'matchid': match.pk, 'rank': rank})
    return render(request, 'page/matchlist.html',
                  {'custom_match': 'True', 'listMatch': matchResult, 'page': page, 'listRival': listRival})


@login_required()
def logsmatch(request, id):
    player = get_player_from_user(request.user)
    match = getMatchfromTaskID(id[:-4])
    if player and match:
        logger.info(
            "Get Logs of Match -- User= %s -- taskID= %s -- match.User =%s" % (request.user.username, id, match.User))
        if player.is_enablelog():
            if match.User.pk == request.user.pk:
                return getLogFile(id, request.user.username)
    return HttpResponseForbidden()


def feedback(request):
    user = request.user
    requestType = None
    if request.method == 'GET':
        requestType = request.GET
    elif request.method == 'POST':
        requestType = request.POST
    title = requestType.get('title')
    content = requestType.get('content')
    logger.info("title %s" % (title))
    logger.info("content %s" % (content))

    if content == "":
        return JsonResponse({'type': 'error', 'data': 'Please give us more description!'})

    contentHTML = ""
    with open('templates/page/feedback.html') as f:
        contentHTML = f.read()

    username = user.username
    userEmail = user.email
    includeEmail = requestType.get('includeEmail')
    if includeEmail == 'false':
        username = "ANONYMOUS"
        userEmail = ""

    contentHTML = contentHTML.replace("%title%", title)
    contentHTML = contentHTML.replace("%username%", username)
    contentHTML = contentHTML.replace("%userEmail%", userEmail)
    contentHTML = contentHTML.replace("%content%", content)
    subject = "[AI Contest 2019][FEEDBACK][{}] {}".format(username, title)

    email = EmailMultiAlternatives(subject, "", settings.EMAIL_HOST_USER, ['kien.nguyenbinh@gameloft.com'])
    email.attach_alternative(contentHTML, "text/html")
    email.send()

    return JsonResponse({'type': 'toast', 'status': 'success', 'data': 'Thanks for your feedback', 'redirect': '/'})


@login_required()
def replaymatch(request, user, id):
    return render(request, 'page/replay.html')


@cache_page(5)
def topten(request):
    leaderboards = getLeaderBoards()
    return render(request, 'page/topten.html', {'leader_boards': leaderboards})


def dashboard(request):
    skillsets = SkillSet.objects.all()
    return render(request, 'page/dashboard.html', {'skillsets': skillsets})


def module(request, id):
    module = Module.objects.get(id=id)
    return render(request, 'page/module.html', {'module': module})

def skillset(request, id):
    skillset = SkillSet.objects.filter(id=id)
    if skillset.exists():
        skillset = skillset.first()
        next_question = skillset.questions.first()

        return render(request, 'page/skillset.html', {'skillset': skillset, 'next_question': next_question})

    data = {
        'type': 'error',
        'status': 'failed'
    }
    return JsonResponse(data)


def submission(request, uid=None):
    _submission = Submission.objects.filter(id=uid).first()
    if uid is None or not _submission:
        return HttpResponse(None)

    test_results = _submission.test_results.all()
    data = {
        'submission': _submission,
        'test_result': test_results,
        'tablist': 'submission-tab'
    }
    return render(request, 'page/submission.html', data)
