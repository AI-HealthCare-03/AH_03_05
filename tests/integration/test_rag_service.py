from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture
def mock_embedding():
    return [0.1] * 1536


@pytest.fixture
def sample_chunks():
    chunk1 = MagicMock()
    chunk1.embedding = [0.1] * 1536
    chunk1.chunk_text = "고혈압 환자는 저염식을 권장합니다."
    chunk1.source_id = 1
    chunk1.source.organization_name = "대한고혈압학회"
    chunk1.source.guideline_title = "고혈압 진료지침"

    chunk2 = MagicMock()
    chunk2.embedding = [0.9] * 1536
    chunk2.chunk_text = "당뇨병 환자는 규칙적인 운동을 권장합니다."
    chunk2.source_id = 2
    chunk2.source.organization_name = "대한당뇨병학회"
    chunk2.source.guideline_title = "당뇨병 진료지침"

    return [chunk1, chunk2]


class TestSplitText:
    """split_text 함수 테스트"""

    def test_split_short_text(self):
        from app.services.rag_service import split_text

        text = "짧은 텍스트입니다."
        result = split_text(text)
        assert len(result) == 1
        assert result[0] == text

    def test_split_long_text(self):
        from app.services.rag_service import split_text

        text = "가" * 1200
        result = split_text(text, chunk_size=500)
        assert len(result) >= 2

    def test_split_empty_text(self):
        from app.services.rag_service import split_text

        result = split_text("")
        assert result == []


class TestCosineSimilarity:
    """cosine_similarity 함수 테스트"""

    def test_identical_vectors(self):
        from app.services.rag_service import cosine_similarity

        a = [1.0, 0.0, 0.0]
        b = [1.0, 0.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(1.0)

    def test_orthogonal_vectors(self):
        from app.services.rag_service import cosine_similarity

        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(0.0)

    def test_zero_vector(self):
        from app.services.rag_service import cosine_similarity

        a = [0.0, 0.0, 0.0]
        b = [1.0, 0.0, 0.0]
        assert cosine_similarity(a, b) == 0.0


class TestGetEmbedding:
    """get_embedding 함수 테스트"""

    @pytest.mark.asyncio
    async def test_get_embedding_returns_vector(self, mock_embedding):
        with patch("app.services.rag_service._get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=mock_embedding)]
            mock_client.embeddings.create = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            from app.services.rag_service import get_embedding

            result = await get_embedding("테스트 텍스트")

            assert result == mock_embedding
            mock_client.embeddings.create.assert_called_once()


class TestSearchSimilarChunks:
    """search_similar_chunks 함수 테스트"""

    @pytest.mark.asyncio
    async def test_returns_similar_chunks(self, mock_embedding, sample_chunks):
        with patch("app.services.rag_service.get_embedding", AsyncMock(return_value=mock_embedding)):
            with patch("app.services.rag_service.GuidelineChunk") as mock_model:
                mock_model.all.return_value.prefetch_related = AsyncMock(return_value=sample_chunks)
                from app.services.rag_service import search_similar_chunks

                results = await search_similar_chunks("고혈압 식단", top_k=3, threshold=0.0)
                assert len(results) > 0
                assert "chunk_text" in results[0]
                assert "similarity" in results[0]
                assert "organization_name" in results[0]

    @pytest.mark.asyncio
    async def test_filters_by_threshold(self, mock_embedding, sample_chunks):
        # 쿼리 벡터와 완전히 다른 벡터로 설정 → 유사도 0
        different_embedding = [-0.1] * 1536
        with patch("app.services.rag_service.get_embedding", AsyncMock(return_value=different_embedding)):
            with patch("app.services.rag_service.GuidelineChunk") as mock_model:
                mock_model.all.return_value.prefetch_related = AsyncMock(return_value=sample_chunks)
                from app.services.rag_service import search_similar_chunks

                results = await search_similar_chunks("고혈압 식단", top_k=3, threshold=0.99)
                assert len(results) == 0


class TestGetRagContext:
    """get_rag_context 함수 테스트"""

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_chunks(self):
        with patch("app.services.rag_service.search_similar_chunks", AsyncMock(return_value=[])):
            from app.services.rag_service import get_rag_context

            result = await get_rag_context("쿼리")
            assert result == ""

    @pytest.mark.asyncio
    async def test_returns_formatted_context(self):
        mock_chunks = [
            {
                "chunk_text": "저염식을 권장합니다.",
                "similarity": 0.9,
                "source_id": 1,
                "organization_name": "대한고혈압학회",
                "guideline_title": "고혈압 진료지침",
            }
        ]
        with patch("app.services.rag_service.search_similar_chunks", AsyncMock(return_value=mock_chunks)):
            from app.services.rag_service import get_rag_context

            result = await get_rag_context("고혈압 식단")
            assert "대한고혈압학회" in result
            assert "저염식을 권장합니다." in result
