from rest_framework import serializers
from backend.models import TestCase


class TestCaseSerializer(serializers.ModelSerializer):
    input_line = serializers.SerializerMethodField()
    output = serializers.SerializerMethodField()

    class Meta:
        model = TestCase
        fields = '__all__'

    @staticmethod
    def get_input_line(obj):
        return "Hidden" if obj.hidden else obj.input_line

    @staticmethod
    def get_output(obj):
        return "Hidden" if obj.hidden else obj.output
