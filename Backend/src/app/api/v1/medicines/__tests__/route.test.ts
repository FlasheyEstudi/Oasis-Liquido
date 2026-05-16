import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as medicineService from '@/lib/services/medicine.service';
import { ErrorCodes } from '@/lib/utils/api-response';

// Mock the medicineService
jest.mock('@/lib/services/medicine.service', () => ({
  getMedicines: jest.fn(),
}));

describe('GET /api/v1/medicines', () => {
  const mockMedicines = [
    {
      id: '1',
      name: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      requiresPrescription: false,
      isActive: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a success response with a list of medicines', async () => {
    (medicineService.getMedicines as jest.Mock).mockResolvedValue(mockMedicines);

    const req = new NextRequest('http://localhost:3000/api/v1/medicines?search=Aspirin&limit=10');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockMedicines);
    expect(medicineService.getMedicines).toHaveBeenCalledWith({
      search: 'Aspirin',
      requiresPrescription: undefined,
      limit: 10,
    });
  });

  it('should handle internal errors and return an error response', async () => {
    const error = new Error('Database connection failed');
    (medicineService.getMedicines as jest.Mock).mockRejectedValue(error);

    const req = new NextRequest('http://localhost:3000/api/v1/medicines');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(json.error.message).toBe('Error interno del servidor');
  });
});
