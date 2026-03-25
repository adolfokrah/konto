'use client'

import { ChevronDown } from 'lucide-react'
import { Switch } from './ui/switch'
import type { CustomField } from './ContributionInput'

interface CustomFieldsProps {
  fields: CustomField[]
  values: Record<string, any>
  onChange: (id: string, value: any) => void
}

export default function CustomFields({ fields, values, onChange }: CustomFieldsProps) {
  if (fields.length === 0) return null

  return (
    <>
      {fields.map((field) => (
        <div key={field.id}>
          {field.fieldType === 'checkbox' ? (
            <label className="flex items-center">
              <Switch
                checked={!!values[field.id]}
                onCheckedChange={(checked) => onChange(field.id, checked)}
              />
              <span className="ml-3 text-sm font-supreme text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          ) : field.fieldType === 'select' ? (
            <div className="relative">
              <select
                value={values[field.id] ?? ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                className="w-full h-14 border-2 border-gray-300 rounded-2xl font-supreme bg-white text-black px-4 pr-10 appearance-none outline-none focus:border-gray-400 transition-colors"
              >
                <option value="">
                  {field.placeholder || `Select ${field.label}`}
                  {field.required ? ' *' : ''}
                </option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          ) : (
            <input
              type={
                field.fieldType === 'phone'
                  ? 'tel'
                  : field.fieldType === 'email'
                    ? 'email'
                    : field.fieldType === 'number'
                      ? 'number'
                      : 'text'
              }
              placeholder={`${field.placeholder || field.label}${field.required ? ' *' : ''}`}
              value={values[field.id] ?? ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            />
          )}
        </div>
      ))}
    </>
  )
}
