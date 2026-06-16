import { getHealthProfile, upsertHealthProfile } from '../api/healthProfile';
import { searchDrugs, getDrug } from '../api/drugs';
import { createGuide, getGuide } from '../api/guides';
import { getProcessingJob } from '../api/jobs';
import { createFeedback, getFeedbackSummary } from '../api/feedbacks';
import { getNotificationSettings, updateNotificationSettings } from '../api/notificationSettings';
import { searchGuidelines } from '../api/rag';
import { createOcrJobWithFile } from '../api/ocr';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockPut = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    patch: (...args: any[]) => mockPatch(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('healthProfile API', () => {
  it('getHealthProfile calls GET /health-profile', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getHealthProfile();
    expect(mockGet).toHaveBeenCalledWith('/health-profile');
  });

  it('upsertHealthProfile calls PUT /health-profile', async () => {
    mockPut.mockResolvedValue({ data: {} });
    await upsertHealthProfile({ diseases: [] } as any);
    expect(mockPut).toHaveBeenCalledWith('/health-profile', expect.any(Object));
  });
});

describe('drugs API', () => {
  it('searchDrugs calls GET /drugs/search', async () => {
    mockGet.mockResolvedValue({ data: { items: [] } });
    await searchDrugs({ keyword: '타이레놀' });
    expect(mockGet).toHaveBeenCalledWith('/drugs/search', expect.any(Object));
  });

  it('getDrug calls GET /drugs/{id}', async () => {
    mockGet.mockResolvedValue({ data: { data: {} } });
    await getDrug(1);
    expect(mockGet).toHaveBeenCalledWith('/drugs/1');
  });

  it('getDrug unwraps { data } envelope and maps dosage→usage_method', async () => {
    mockGet.mockResolvedValue({
      data: {
        drug_code: '202005623',
        source: 'MFDS',
        data: { drug_name: '타이레놀', efficacy: '해열', dosage: '1일 3회' },
      },
    });
    const d = await getDrug(202005623);
    expect(d.drug_name).toBe('타이레놀');
    expect(d.efficacy).toBe('해열');
    expect(d.usage_method).toBe('1일 3회');
  });
});

describe('guides API', () => {
  it('createGuide calls POST /guides/generate (긴 타임아웃)', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await createGuide({ record_id: 1 } as any);
    expect(mockPost).toHaveBeenCalledWith(
      '/guides/generate',
      expect.any(Object),
      expect.objectContaining({ timeout: 90_000 })
    );
  });

  it('getGuide calls GET /guides/{id}', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getGuide(1);
    expect(mockGet).toHaveBeenCalledWith('/guides/1');
  });
});

describe('jobs API', () => {
  it('getProcessingJob calls GET /processing-jobs/{id}', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getProcessingJob(1);
    expect(mockGet).toHaveBeenCalledWith('/processing-jobs/1');
  });
});

describe('feedbacks API', () => {
  it('createFeedback calls POST /feedbacks', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await createFeedback({ rating: 5 } as any);
    expect(mockPost).toHaveBeenCalledWith('/feedbacks', expect.any(Object));
  });

  it('getFeedbackSummary calls GET /feedbacks/summary', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getFeedbackSummary();
    expect(mockGet).toHaveBeenCalledWith('/feedbacks/summary');
  });
});

describe('notificationSettings API', () => {
  it('getNotificationSettings calls GET /notification-settings', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getNotificationSettings();
    expect(mockGet).toHaveBeenCalledWith('/notification-settings/');
  });

  it('updateNotificationSettings calls PUT /notification-settings', async () => {
    mockPut.mockResolvedValue({ data: {} });
    await updateNotificationSettings({} as any);
    expect(mockPut).toHaveBeenCalledWith('/notification-settings/', expect.any(Object));
  });
});

describe('rag API', () => {
  it('searchGuidelines calls GET /rag/search', async () => {
    mockGet.mockResolvedValue({ data: { query: '고혈압', sources: [
      { organization_name: '보건복지부', guideline_title: '고혈압 지침', source_url: 'https://example.com', chunk_text: '내용', similarity_score: 0.9 },
    ] } });
    const result = await searchGuidelines('고혈압');
    expect(mockGet).toHaveBeenCalledWith('/rag/search', expect.any(Object));
    expect(result[0].relevance_score).toBe(0.9);
  });
});

describe('ocr API', () => {
  it('createOcrJobWithFile (네이티브 uri) → POST /ocr/jobs/upload', async () => {
    mockPost.mockResolvedValue({ data: {} });
    const file = { uri: 'file:///x.png', name: 'x.png', type: 'image/png' } as any;
    await createOcrJobWithFile(1, file);
    expect(mockPost).toHaveBeenCalledWith(
      '/ocr/jobs/upload',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': undefined } })
    );
  });

  it('createOcrJobWithFile (웹 File, uri 없음) → POST /ocr/jobs/upload', async () => {
    mockPost.mockResolvedValue({ data: {} });
    const webFile = { name: 'x.png', type: 'image/png', size: 10 } as any; // uri 없음 → File 분기
    await createOcrJobWithFile(2, webFile);
    expect(mockPost).toHaveBeenCalledWith(
      '/ocr/jobs/upload',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': undefined } })
    );
  });
});
