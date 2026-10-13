interface ProgressBarProps {
  value: number; // 0-100
  tone?: "violet" | "green" | "blue" | "orange";
}

export function ProgressBar({ value, tone = "violet" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill progress-fill-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default ProgressBar;
