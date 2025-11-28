import clsx from 'clsx';

/**
 * PUBLIC_INTERFACE
 * Filters
 * A pill-style filter bar supporting toggles for:
 * - hasIssues
 * - hasLicense
 * - archived
 * Props:
 * - values: current values
 * - onChange: callback with next values
 * - disabled: disable interaction
 */
export interface FilterValues {
  hasIssues: boolean;
  hasLicense: boolean;
  archived: boolean;
}

// PUBLIC_INTERFACE
export default function Filters({
  values,
  onChange,
  disabled
}: {
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  disabled?: boolean;
}) {
  function toggle(key: keyof FilterValues) {
    onChange({ ...values, [key]: !values[key] });
  }

  return (
    <div className={clsx('flex flex-wrap gap-2', disabled && 'opacity-60')}>
      <Pill
        label="Has issues"
        active={values.hasIssues}
        onClick={() => toggle('hasIssues')}
        disabled={disabled}
      />
      <Pill
        label="Has license"
        active={values.hasLicense}
        onClick={() => toggle('hasLicense')}
        disabled={disabled}
      />
      <Pill
        label="Archived"
        active={values.archived}
        onClick={() => toggle('archived')}
        disabled={disabled}
      />
    </div>
  );
}

function Pill({
  label,
  active,
  onClick,
  disabled
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'px-3 py-1 rounded-full border text-sm transition-colors',
        active
          ? 'bg-primary-600/20 text-primary-300 border-primary-700'
          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
