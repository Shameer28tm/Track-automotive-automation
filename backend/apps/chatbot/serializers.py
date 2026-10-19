from rest_framework import serializers

class ChatMessageItemSerializer(serializers.Serializer):
    sender = serializers.ChoiceField(choices=['user', 'ai', 'system', 'assistant', 'model'])
    text = serializers.CharField(max_length=2000)


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        max_length=1000,
        required=True,
        error_messages={'required': 'A message is required.', 'blank': 'Message cannot be empty.'}
    )
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    provider = serializers.CharField()
