interface FilterSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <label className="or-field">
      <span className="or-field-label">{label}</span>
      <select
        className="or-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
