from rest_framework import serializers

from backend.models import SkillSet


class SkillSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillSet
        fields = '__all__'
