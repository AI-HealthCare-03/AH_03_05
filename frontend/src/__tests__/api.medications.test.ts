import { verifyMedication, verifyMedications, updateMedicationDosage, getMedicationAlarms, updateMedicationAlarm } from '../api/medications';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();

jest.mock('../api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    patch: (...args: any[]) => mockPatch(...args),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('medications API', () => {
  it('verifyMedication calls PATCH /medications/{id}/verify', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await verifyMedication(1, { drug_id: 10, is_verified: true });
    expect(mockPatch).toHaveBeenCalledWith('/medications/1/verify', expect.any(Object));
  });

  it('verifyMedications calls POST /records/{id}/medications/verify', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await verifyMedications(1, []);
    expect(mockPost).toHaveBeenCalledWith('/records/1/medications/verify', expect.any(Object));
  });

  it('updateMedicationDosage calls PATCH /medications/{id}', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await updateMedicationDosage(1, { dosage: '1정' });
    expect(mockPatch).toHaveBeenCalledWith('/medications/1', expect.any(Object));
  });

  it('getMedicationAlarms calls GET /medications/alarms', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getMedicationAlarms();
    expect(mockGet).toHaveBeenCalledWith('/medications/alarms');
  });

  it('updateMedicationAlarm calls PATCH /medications/{id}/alarm', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await updateMedicationAlarm(1, { is_enabled: true });
    expect(mockPatch).toHaveBeenCalledWith('/medications/1/alarm', expect.any(Object));
  });
});
