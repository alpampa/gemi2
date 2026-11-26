import {
  PrismaScheduleProvider,
  formatIstanbulTime,
} from './prisma-schedule.provider';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Regresyon: gece yarısı kalkışları "24:00" olarak biçimlendiriliyordu.
 *
 * `hour12: false` locale'in varsayılan saat döngüsüne düşüyor ve ICU
 * sürümüne göre `h24` (01–24) seçilebiliyor. Aynı kod Node 24'te "00:05",
 * Node 20'de "24:05" üretti. Tarifede 24:05 yoktur; bu değer doğrudan
 * yolcuya gösterilen `departureTime` alanına yazılıyordu.
 */
describe('formatIstanbulTime', () => {
  it('gece yarısı kalkışını 00:xx olarak biçimlendirir', () => {
    const { time24 } = formatIstanbulTime(
      new Date('2026-10-02T00:05:00+03:00'),
    );
    expect(time24).toBe('00:05');
  });

  it('tam gece yarısını 00:00 olarak biçimlendirir', () => {
    expect(
      formatIstanbulTime(new Date('2026-10-02T00:00:00+03:00')).time24,
    ).toBe('00:00');
  });

  it('günün hiçbir saatinde 24 üretmez', () => {
    const dayStart = new Date('2026-10-02T00:00:00+03:00').getTime();
    const hours: number[] = [];
    for (let minute = 0; minute < 24 * 60; minute += 17) {
      const { time24 } = formatIstanbulTime(
        new Date(dayStart + minute * 60_000),
      );
      hours.push(Number(time24.split(':')[0]));
    }
    expect(hours.filter((h) => h < 0 || h > 23)).toEqual([]);
    expect(hours).toHaveLength(85);
  });

  it('gündüz kalkışını 24 saatlik dilimde olduğu gibi bırakır', () => {
    expect(
      formatIstanbulTime(new Date('2026-10-02T15:45:00+03:00')).time24,
    ).toBe('15:45');
  });
});

describe('PrismaScheduleProvider.getSchedules', () => {
  function providerWithTrip(scheduledDeparture: Date): PrismaScheduleProvider {
    const prisma = {
      trip: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'trip-1',
            scheduledDeparture,
            status: 'SCHEDULED',
            stops: null,
            platform: '1',
            price: 25,
            vessel: { name: 'Test Vapur' },
            route: {
              originPort: { name: 'Kadıköy' },
              destinationPort: { name: 'Beşiktaş' },
              operator: { name: 'Şehir Hatları' },
            },
          },
        ]),
      },
    } as unknown as PrismaService;

    return new PrismaScheduleProvider(prisma);
  }

  it('gece yarısı seferini DTO içinde 00:00 olarak taşır', async () => {
    const provider = providerWithTrip(new Date('2026-10-02T00:00:00+03:00'));
    const response = await provider.getSchedules();
    expect(response.schedules[0].departureTime).toBe('00:00');
  });

  it('gece yarısı seferini 12 saatlik alanda 12:00 (ÖÖ) olarak taşır', async () => {
    const provider = providerWithTrip(new Date('2026-10-02T00:00:00+03:00'));
    const response = await provider.getSchedules();
    // tr-TR h12 gösterimi gün dönemini de yazar ("ÖÖ 12:00"); sözleşme saat
    // kısmıdır — gece yarısı 12 saatlik dilimde "12:00"dir, "00:00" değil.
    expect(response.schedules[0].departureTime12).toMatch(/12:00$/);
  });
});
