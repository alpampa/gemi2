import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ScheduleProvider,
  SchedulesResponse,
  ScheduleCardDto,
  TripStatus,
} from './schedule.provider';

/**
 * İstanbul saatini tarife formatında üretir.
 *
 * `hour12: false` KULLANILMAZ: locale'in varsayılan saat döngüsüne düşer ve
 * ICU sürümüne göre `h23` (00–23) yerine `h24` (01–24) seçilebilir. Aynı kod
 * Node 24'te "00:05", Node 20'de "24:05" üretiyordu; tarifede 24:05 yoktur.
 * `hourCycle` açıkça istenir, yoruma yer bırakılmaz.
 */
const ISTANBUL_HHMM_24 = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const ISTANBUL_HHMM_12 = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'Europe/Istanbul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h12',
});

export function formatIstanbulTime(targetDate: Date): {
  time24: string;
  time12: string;
} {
  return {
    time24: ISTANBUL_HHMM_24.format(targetDate),
    time12: ISTANBUL_HHMM_12.format(targetDate),
  };
}

@Injectable()
export class PrismaScheduleProvider implements ScheduleProvider {
  private readonly logger = new Logger(PrismaScheduleProvider.name);

  constructor(private prisma: PrismaService) {}

  async getSchedules(): Promise<SchedulesResponse> {
    this.logger.debug('Fetching schedules from DB');

    // Only fetch trips that haven't departed more than 1 minute ago
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    const trips = await this.prisma.trip.findMany({
      where: {
        scheduledDeparture: {
          gte: oneMinuteAgo,
        },
      },
      include: {
        route: {
          include: {
            originPort: true,
            destinationPort: true,
            operator: true,
          },
        },
        vessel: true,
      },
      orderBy: { scheduledDeparture: 'asc' },
    });

    const schedules: ScheduleCardDto[] = trips.map((t) => {
      // Mock progress calculation for Demo
      let progress = 0;
      if (t.status === 'IN_TRANSIT') progress = 50;
      else if (t.status === 'COMPLETED') progress = 100;

      const targetDate = t.scheduledDeparture;

      // Format to Europe/Istanbul time (tek kaynak: formatIstanbulTime)
      const { time24, time12 } = formatIstanbulTime(targetDate);

      let parsedStops: { name: string; time: string }[] = [];
      if (t.stops) {
        try {
          parsedStops = JSON.parse(t.stops) as { name: string; time: string }[];
        } catch (e) {
          this.logger.error('Failed to parse stops JSON', e);
        }
      }

      return {
        id: t.id,
        origin: t.route.originPort.name,
        destination: t.route.destinationPort.name,
        operator: t.route.operator.name,
        routeTitle: `${t.route.originPort.name} - ${t.route.destinationPort.name}`,
        departureTime: time24,
        departureTime12: time12,
        status: t.status as TripStatus,
        targetTimeIso: targetDate.toISOString(),
        vessel: t.vessel?.name || 'Unknown Vessel',
        platform: t.platform || 'TBD',
        price: `${t.price.toFixed(2)} ₺`,
        progress,
        stops: parsedStops.length > 0 ? parsedStops : undefined,
      };
    });

    const serverTime = new Date();
    const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return {
      serverTimeIso: serverTime.toISOString(),
      serverDateFormatted: dateFormatter.format(serverTime),
      schedules,
    };
  }
}
