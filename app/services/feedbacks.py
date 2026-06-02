from app.dtos.feedbacks import FeedbackCreateRequest
from app.exceptions.common import NotFoundException
from app.models.chat_messages import ChatMessage
from app.models.feedbacks import Feedback
from app.models.guides import Guide
from app.models.users import User


class FeedbackService:
    """가이드/챗봇 답변에 대한 피드백 등록 서비스."""

    async def create_feedback(self, user: User, request: FeedbackCreateRequest) -> Feedback:
        # 참조 대상이 본인 소유인지 검증 (아니면 404)
        if request.guide_id is not None:
            guide = await Guide.get_or_none(id=request.guide_id, user=user)
            if guide is None:
                raise NotFoundException("연결된 가이드를 찾을 수 없습니다.")

        if request.chat_message_id is not None:
            message = await ChatMessage.get_or_none(id=request.chat_message_id, user=user)
            if message is None:
                raise NotFoundException("연결된 챗봇 메시지를 찾을 수 없습니다.")

        return await Feedback.create(
            user=user,
            guide_id=request.guide_id,
            chat_message_id=request.chat_message_id,
            rating=request.rating,
            comment=request.comment,
            report_type=request.report_type,
            is_safety_report=request.is_safety_report,
        )
