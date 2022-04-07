from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.models import Submission, Player
from backend.serializers.submissions import SubmissionSerializer
from backend.serializers.testresult import TestResultSerializer
from backend.tasks import get_player_from_user


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        # TODO: Filter by player
        player = Player.objects.first()
        return self.queryset.filter(player=player)

    @action(methods=['get'], detail=True, url_path='test-result')
    def get_test_result(self, request, *args, **kwargs):
        submission = self.get_object()
        test_results = submission.test_results.all()
        serializer = TestResultSerializer(test_results, many=True)
        return Response(serializer.data, status.HTTP_200_OK)
