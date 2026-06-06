import { uploadRecord, createManualRecord, getRecords, getRecord, deleteRecord, getRecordMedications, getRecordGuide, getOcrResult, updateOcrText } from '../api/records';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    patch: (...args: any[]) => mockPatch(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('records API', () => {
  it('uploadRecord calls POST /records', async () => {
    mockPost.mockResolvedValue({ data: { record_id: 1 } });
    await uploadRecord({ uri: 'file://x', name: 'x.jpg', type: 'image/jpeg' }, 'prescription');
    expect(mockPost).toHaveBeenCalledWith('/records', expect.any(Object), expect.any(Object));
  });

  it('createManualRecord calls POST /records/manual-input', async () => {
    mockPost.mockResolvedValue({ data: { record_id: 2 } });
    await createManualRecord('텍스트');
    expect(mockPost).toHaveBeenCalledWith('/records/manual-input', expect.any(Object));
  });

  it('getRecords calls GET /records', async () => {
    mockGet.mockResolvedValue({ data: { items: [] } });
    await getRecords();
    expect(mockGet).toHaveBeenCalledWith('/records', expect.any(Object));
  });

  it('getRecord calls GET /records/{id}', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getRecord(1);
    expect(mockGet).toHaveBeenCalledWith('/records/1');
  });

  it('deleteRecord calls DELETE /records/{id}', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await deleteRecord(1);
    expect(mockDelete).toHaveBeenCalledWith('/records/1');
  });

  it('getRecordMedications calls GET /records/{id}/medications', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getRecordMedications(1);
    expect(mockGet).toHaveBeenCalledWith('/records/1/medications');
  });

  it('getRecordGuide calls GET /records/{id}/guide', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getRecordGuide(1);
    expect(mockGet).toHaveBeenCalledWith('/records/1/guide');
  });

  it('getOcrResult calls GET /records/{id}/ocr-result', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await getOcrResult(1);
    expect(mockGet).toHaveBeenCalledWith('/records/1/ocr-result');
  });

  it('updateOcrText calls PATCH /records/{id}/ocr-text', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await updateOcrText(1, { ocr_edited_text: '수정' });
    expect(mockPatch).toHaveBeenCalledWith('/records/1/ocr-text', expect.any(Object));
  });
});
