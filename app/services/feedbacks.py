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

    async def get_summary(self, user: User) -> dict:
        """본인 피드백을 집계하여 개선 판단 근거를 제공한다.

        평점 분포·평균·신고 건수·낮은 평점(1~2점) 대상 목록을 반환.
        수집된 피드백을 가이드/프롬프트 개선에 활용하기 위한 집계 API.
        """
        feedbacks = await Feedback.filter(user=user)

        total_count = len(feedbacks)
        rating_distribution = {str(i): 0 for i in range(1, 6)}
        rating_sum = 0
        rating_count = 0
        report_count = 0
        safety_report_count = 0
        low_rated_items = []

        for fb in feedbacks:
            if fb.rating is not None:
                rating_distribution[str(fb.rating)] += 1
                rating_sum += fb.rating
                rating_count += 1
                if fb.rating <= 2:
                    low_rated_items.append(
                        {
                            "feedback_id": fb.id,
                            "guide_id": fb.guide_id,
                            "chat_message_id": fb.chat_message_id,
                            "rating": fb.rating,
                            "comment": fb.comment,
                        }
                    )
            if fb.report_type is not None:
                report_count += 1
            if fb.is_safety_report:
                safety_report_count += 1

        average_rating = round(rating_sum / rating_count, 2) if rating_count else None

        return {
            "total_count": total_count,
            "rating_distribution": rating_distribution,
            "average_rating": average_rating,
            "report_count": report_count,
            "safety_report_count": safety_report_count,
            "low_rated_items": low_rated_items,
        }
