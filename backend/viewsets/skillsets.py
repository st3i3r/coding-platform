from rest_framework import viewsets

from backend.models import SkillSet
from backend.serializers.skillsets import SkillSetSerializer


class SkillSetViewSet(viewsets.ModelViewSet):
    queryset = SkillSet.objects.all()
    serializer_class = SkillSetSerializer

    def get_queryset(self):
        return self.queryset.filter(enabled=True)
