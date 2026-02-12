/**
 * Lifestyle and belief tags for resource personalization.
 * Tags use a namespace:value format (e.g., "faith:christian").
 * Resources can have multiple tags; users match based on preferences.
 */
export const TAG_NAMESPACES = {
  faith: {
    label: "Faith & Spirituality",
    values: [
      { value: "christian", label: "Christian" },
      { value: "catholic", label: "Catholic" },
      { value: "jewish", label: "Jewish" },
      { value: "muslim", label: "Muslim" },
      { value: "hindu", label: "Hindu" },
      { value: "buddhist", label: "Buddhist" },
      { value: "secular", label: "Secular / Non-religious" },
      { value: "spiritual", label: "Spiritual (non-denominational)" },
    ],
  },
  birth: {
    label: "Birth Preference",
    values: [
      { value: "home", label: "Home Birth" },
      { value: "hospital", label: "Hospital Birth" },
      { value: "birth_center", label: "Birth Center" },
      { value: "water", label: "Water Birth" },
    ],
  },
  vaccine: {
    label: "Vaccine Approach",
    values: [
      { value: "standard", label: "Standard CDC Schedule" },
      { value: "delayed", label: "Delayed Schedule" },
      { value: "selective", label: "Selective Vaccination" },
    ],
  },
  diet: {
    label: "Dietary Preferences",
    values: [
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Vegan" },
      { value: "kosher", label: "Kosher" },
      { value: "halal", label: "Halal" },
      { value: "gluten_free", label: "Gluten-Free" },
      { value: "dairy_free", label: "Dairy-Free" },
    ],
  },
  feeding: {
    label: "Feeding Approach",
    values: [
      { value: "breastfeeding", label: "Breastfeeding" },
      { value: "formula", label: "Formula Feeding" },
      { value: "combination", label: "Combination Feeding" },
      { value: "blw", label: "Baby-Led Weaning" },
    ],
  },
  parenting: {
    label: "Parenting Philosophy",
    values: [
      { value: "attachment", label: "Attachment Parenting" },
      { value: "gentle", label: "Gentle Parenting" },
      { value: "montessori", label: "Montessori" },
      { value: "rie", label: "RIE" },
    ],
  },
} as const;

export type TagNamespace = keyof typeof TAG_NAMESPACES;

/**
 * Build a full tag string from namespace + value.
 */
export function buildTag(namespace: TagNamespace, value: string): string {
  return `${namespace}:${value}`;
}
