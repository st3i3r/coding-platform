from rest_framework import viewsets

from backend.models import TestResult
from backend.serializers.testresult import TestResultSerializer


class TestResultViewSet(viewsets.ModelViewSet):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer

    def get_queryset(self):
        # TODO: Filter by submission
        return self.queryset