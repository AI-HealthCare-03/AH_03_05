import { getHealthProfile, upsertHealthProfile } from '../api/healthProfile';
import { searchDrugs, getDrug } from '../api/drugs';
import { createGuide, getGuide } from '../api/guides';
import { getProcessingJob } from '../api/jobs';
import { createFeedback, getFeedbackSummary } from '../api/feedbacks';
import { getNotificationSettings, updateNotificationSettings } from '../api/notificationSettings';
import { searchGuidelines } from '../api/rag';
import { createOcrJob } from '../api/ocr';

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
    mockGet.mockResolvedValue({ data: {} });
    await getDrug(1);
    expect(mockGet).toHaveBeenCalledWith('/drugs/1');
  });
});

describe('guides API', () => {
  it('createGuide calls POST /guides/generate', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await createGuide({ record_id: 1 } as any);
    expect(mockPost).toHaveBeenCalledWith('/guides/generate', expect.any(Object));
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
    mockGet.mockResolvedValue({ data: { query: '', sources: [] } });
    await searchGuidelines('고혈압');
    expect(mockGet).toHaveBeenCalledWith('/rag/search', expect.any(Object));
  });
});

describe('ocr API', () => {
  it('createOcrJob calls POST /ocr/jobs', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await createOcrJob({ record_id: 1 } as any);
    expect(mockPost).toHaveBeenCalledWith('/ocr/jobs', expect.any(Object));
  });
});
