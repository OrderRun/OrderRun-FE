interface TabsProps<TKey extends string> {
  items: { key: TKey; label: string }[]
  activeKey: TKey
  onChange: (key: TKey) => void
}

export function Tabs<TKey extends string>({
  items,
  activeKey,
  onChange,
}: TabsProps<TKey>) {
  return (
    <div className="or-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === activeKey}
          className={`or-tab${item.key === activeKey ? ' is-active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
