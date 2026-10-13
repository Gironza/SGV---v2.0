interface QuickActionProps {
  icon: string;
  label: string;
  tone?: "violet" | "green" | "blue" | "orange";
  onClick?: () => void;
}

export function QuickAction({ icon, label, tone = "violet", onClick }: QuickActionProps) {
  return (
    <button type="button" className={`quick-action quick-action-${tone}`} onClick={onClick}>
      <span className="quick-action-icon">
        <i className={icon}></i>
      </span>
      <span>{label}</span>
    </button>
  );
}

export default QuickAction;
