from rest_framework import viewsets

from backend.models import TestCase
from backend.serializers.testcases import TestCaseSerializer


class TestCaseViewSet(viewsets.ModelViewSet):
    queryset = TestCase.objects.all()
    serializer_class = TestCaseSerializer

    def get_queryset(self):
        # TODO: Filter by question slug
        return self.queryset