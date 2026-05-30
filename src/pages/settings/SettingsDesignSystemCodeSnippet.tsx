export function SettingsDesignSystemCodeSnippet({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <figure className="settings-design-system__snippet">
      <figcaption>{label}</figcaption>
      <textarea aria-label={label} readOnly rows={children.split('\n').length} value={children} />
    </figure>
  );
}
