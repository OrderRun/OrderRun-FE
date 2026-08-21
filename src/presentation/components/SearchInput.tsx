interface SearchInputProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}

export function SearchInput({
  label,
  value,
  placeholder,
  onChange,
}: SearchInputProps) {
  return (
    <label className="or-field or-field-grow">
      <span className="or-field-label">{label}</span>
      <input
        className="or-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
