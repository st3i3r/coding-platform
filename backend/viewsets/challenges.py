from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.models import Question, Compile, Submission
from backend.serializers.challenges.serializers import QuestionSerializer, SolutionTemplateSerializer
from backend.serializers.compiles import CompileSerializer
from backend.serializers.compiles.serializers import CodeSubmitSerializer
from backend.serializers.submissions import SubmissionSerializer
from backend.tasks import process_submitted_code, check_testcases, get_player_from_user

import logging

logger = logging.getLogger()


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    lookup_field = 'slug'

    @action(methods=['get'], detail=True, url_path='last-compile')
    def get_last_compile(self, request, *args, **kwargs):
        question = self.get_object()
        compile_log = question.compile_logs.all().order_by('-created').first()
        serializer = CompileSerializer(compile_log)
        return Response(serializer.data, status.HTTP_200_OK)

    @action(methods=['get'], detail=True, url_path='solution-templates')
    def get_solution_templates(self, request, *args, **kwargs):
        question = self.get_object()
        solution_templates = question.solution_templates.all()
        serializer = SolutionTemplateSerializer(solution_templates, many=True)
        return Response(serializer.data, status.HTTP_200_OK)

    @action(methods=['get'], detail=True, url_path='submissions')
    def get_submissions(self, request, *args, **kwargs):
        question = self.get_object()
        player = get_player_from_user(request.user)
        submissions = question.submissions.filter(player=player).all().order_by("-created_at")
        page = self.paginate_queryset(submissions)
        if page is not None:
            serializer = SubmissionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['post'], detail=True, url_path='submit')
    def submit(self, request, *args, **kwargs):
        # TODO: remove admin
        user = User.objects.first()
        serializer = CodeSubmitSerializer(data=request.data)
        logger.info(request.data)
        if serializer.is_valid(raise_exception=True):
            submission = process_submitted_code(user, serializer.data)
            # Check if compiled successfully, then process testcases
            if submission:
                check_testcases.delay(submission.uid)
                submission_serializer = SubmissionSerializer(submission, many=False)
                return Response(submission_serializer.data, status.HTTP_200_OK)
            return Response(status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status.HTTP_400_BAD_REQUEST)



