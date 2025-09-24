import type { Field } from 'payload'

export const anchorField: Field = {
  name: 'anchor',
  type: 'text',
  admin: {
    description:
      'Optional anchor ID for linking to this block (e.g., "features", "testimonials"). Will be used as the HTML id attribute.',
    placeholder: 'e.g., about-us, pricing, contact',
  },
  validate: (value: string | null | undefined) => {
    if (value && typeof value === 'string') {
      // Check if it's a valid HTML id (alphanumeric, hyphens, underscores, no spaces)
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        return 'Anchor must start with a letter and contain only letters, numbers, hyphens, and underscores'
      }
    }
    return true
  },
}
