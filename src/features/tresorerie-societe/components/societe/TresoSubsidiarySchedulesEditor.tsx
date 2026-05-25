import { SimActionButton } from '@/components/ui/sim';
import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import type { AmountScheduleInput, SubsidiaryInput } from '@/engine/tresorerie/types';
import { fmtEuroInput, parseEuroInput, parseNumberInput } from '../../utils/tresorerieFormatters';

interface TresoSubsidiarySchedulesEditorProps {
  servicesSchedule: AmountScheduleInput[] | undefined;
  dividendsSchedule: AmountScheduleInput[] | undefined;
  projectionYear: number;
  onChange: (patch: Partial<SubsidiaryInput>) => void;
}

export function normalizeSchedules(
  schedules: AmountScheduleInput[] | undefined,
  fallbackYear = new Date().getFullYear(),
): AmountScheduleInput[] {
  if (schedules && schedules.length > 0) return schedules;
  return [
    {
      amount: 0,
      startYear: fallbackYear,
      endYear: fallbackYear,
    },
  ];
}

export function buildNextSchedule(
  schedules: AmountScheduleInput[],
  fallbackYear: number,
): AmountScheduleInput {
  const previous = schedules[schedules.length - 1];
  const startYear =
    previous?.endYear != null ? previous.endYear + 1 : (previous?.startYear ?? fallbackYear) + 1;
  return {
    amount: Math.max(0, previous?.amount ?? 0),
    startYear,
    endYear: startYear,
  };
}

function ScheduleRows({
  kind,
  title,
  addLabel,
  schedules,
  projectionYear,
  onSchedulesChange,
}: {
  kind: 'services' | 'dividends';
  title: string;
  addLabel: string;
  schedules: AmountScheduleInput[];
  projectionYear: number;
  onSchedulesChange: (schedules: AmountScheduleInput[]) => void;
}) {
  const patchSchedule = (index: number, patch: Partial<AmountScheduleInput>) => {
    onSchedulesChange(
      schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, ...patch } : schedule,
      ),
    );
  };

  return (
    <>
      <div className="ts-schedule-editor__header">
        <strong>{title}</strong>
        <SimActionButton
          variant="add"
          mode="text"
          label={addLabel}
          onClick={() =>
            onSchedulesChange([...schedules, buildNextSchedule(schedules, projectionYear)])
          }
        />
      </div>
      {schedules.map((schedule, index) => (
        <div key={`${kind}-${index}`} className="ts-schedule-row">
          <SimFieldShell
            label={`Montant palier ${index + 1}`}
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(schedule.amount)}
              onChange={(event) =>
                patchSchedule(index, { amount: parseEuroInput(event.target.value) })
              }
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
          <SimFieldShell label="De" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={schedule.startYear}
              onChange={(event) =>
                patchSchedule(index, { startYear: parseNumberInput(event.target.value) })
              }
            />
          </SimFieldShell>
          <SimFieldShell label="À" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={schedule.endYear ?? ''}
              onChange={(event) =>
                patchSchedule(index, {
                  endYear: parseNumberInput(event.target.value) || undefined,
                })
              }
            />
          </SimFieldShell>
          <SimActionButton
            variant="delete"
            mode="text"
            label="Supprimer"
            ariaLabel={`Supprimer le palier ${index + 1} ${title.toLowerCase()}`}
            danger
            disabled={schedules.length <= 1}
            onClick={() =>
              onSchedulesChange(schedules.filter((_, scheduleIndex) => scheduleIndex !== index))
            }
          />
        </div>
      ))}
    </>
  );
}

export function TresoSubsidiarySchedulesEditor({
  servicesSchedule,
  dividendsSchedule,
  projectionYear,
  onChange,
}: TresoSubsidiarySchedulesEditorProps) {
  const servicesSchedules = normalizeSchedules(servicesSchedule, projectionYear);
  const dividendsSchedules = normalizeSchedules(dividendsSchedule, projectionYear);

  return (
    <div className="ts-schedule-editor">
      <ScheduleRows
        kind="services"
        title="Prestations annuelles vers la mère"
        addLabel="Ajouter un palier de prestations"
        schedules={servicesSchedules}
        projectionYear={projectionYear}
        onSchedulesChange={(nextSchedules) => onChange({ servicesSchedule: nextSchedules })}
      />
      <ScheduleRows
        kind="dividends"
        title="Dividendes annuels vers la mère"
        addLabel="Ajouter un palier de dividendes"
        schedules={dividendsSchedules}
        projectionYear={projectionYear}
        onSchedulesChange={(nextSchedules) => onChange({ dividendsSchedule: nextSchedules })}
      />
    </div>
  );
}
