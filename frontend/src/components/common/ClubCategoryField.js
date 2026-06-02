import { useEffect, useMemo, useState } from 'react';
import { CLUB_CATEGORY_OPTIONS } from '../../data/clubCategories';

const CUSTOM_CATEGORY = '__custom__';

export function ClubCategoryField({ value, onChange }) {
  const isPreset = useMemo(
    () => CLUB_CATEGORY_OPTIONS.includes(value),
    [value]
  );
  const [mode, setMode] = useState(value && !isPreset ? 'custom' : 'preset');

  useEffect(() => {
    if (value && !CLUB_CATEGORY_OPTIONS.includes(value)) {
      setMode('custom');
    }
  }, [value]);

  return (
    <div className="category-field">
      <label>
        Category
        <select
          value={mode === 'custom' ? CUSTOM_CATEGORY : value || ''}
          onChange={(e) => {
            if (e.target.value === CUSTOM_CATEGORY) {
              setMode('custom');
              onChange('');
              return;
            }

            setMode('preset');
            onChange(e.target.value);
          }}
          required
        >
          <option value="" disabled>Select category...</option>
          {CLUB_CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
          <option value={CUSTOM_CATEGORY}>Custom...</option>
        </select>
      </label>

      {mode === 'custom' ? (
        <label>
          Custom category
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write a category"
            required
          />
        </label>
      ) : null}
    </div>
  );
}
