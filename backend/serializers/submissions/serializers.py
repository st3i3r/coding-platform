from rest_framework import serializers
from backend.models import Submission
from backend.serializers.compiles import CompileSerializer
from backend.serializers.testresult import TestResultSerializer


class SubmissionSerializer(serializers.ModelSerializer):
    question = serializers.SlugRelatedField(many=False, slug_field='slug', read_only=True)
    compile_log = CompileSerializer(many=False, read_only=True)
    status = serializers.CharField(source='get_status_display', read_only=True)
    test_results = TestResultSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'

