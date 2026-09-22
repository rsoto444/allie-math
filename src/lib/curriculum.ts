export type StrandKey = "RP" | "NS" | "EE" | "G" | "SP";

export interface Strand {
  key: StrandKey;
  name: string;
  short: string;
  color: string; // tailwind color stem, e.g. "sky"
  order: number;
}

export const STRANDS: Strand[] = [
  { key: "RP", name: "Ratios & Rates", short: "Ratios", color: "sky", order: 1 },
  { key: "NS", name: "Fractions, Decimals & Integers", short: "Numbers", color: "violet", order: 2 },
  { key: "EE", name: "Expressions & Equations", short: "Algebra", color: "amber", order: 3 },
  { key: "G", name: "Geometry", short: "Geometry", color: "emerald", order: 4 },
  { key: "SP", name: "Statistics & Probability", short: "Data", color: "rose", order: 5 },
];

export interface SkillMeta {
  key: string;
  strand: StrandKey;
  name: string;
  order: number;
}

export const SKILLS: SkillMeta[] = [
  // Ratios & Proportional Relationships
  { key: "rp_ratio_simplify", strand: "RP", name: "Writing ratios in simplest form", order: 1 },
  { key: "rp_unit_rate", strand: "RP", name: "Unit rates", order: 2 },
  { key: "rp_equivalent_ratios", strand: "RP", name: "Equivalent ratios", order: 3 },
  { key: "rp_percent_of_number", strand: "RP", name: "Percent of a number", order: 4 },

  // The Number System
  { key: "ns_fraction_add_sub", strand: "NS", name: "Adding & subtracting fractions", order: 1 },
  { key: "ns_fraction_mult_div", strand: "NS", name: "Multiplying & dividing fractions", order: 2 },
  { key: "ns_decimal_operations", strand: "NS", name: "Decimal operations", order: 3 },
  { key: "ns_integers_absolute_value", strand: "NS", name: "Integers & absolute value", order: 4 },
  { key: "ns_gcf_lcm", strand: "NS", name: "GCF & LCM", order: 5 },

  // Expressions & Equations
  { key: "ee_evaluate_expressions", strand: "EE", name: "Evaluating expressions", order: 1 },
  { key: "ee_simplify_expressions", strand: "EE", name: "Simplifying expressions", order: 2 },
  { key: "ee_one_step_equations", strand: "EE", name: "One-step equations", order: 3 },
  { key: "ee_inequalities", strand: "EE", name: "Inequalities", order: 4 },

  // Geometry
  { key: "g_area_polygons", strand: "G", name: "Area of triangles & parallelograms", order: 1 },
  { key: "g_area_composite", strand: "G", name: "Area of composite figures", order: 2 },
  { key: "g_volume_rect_prism", strand: "G", name: "Volume of rectangular prisms", order: 3 },
  { key: "g_coordinate_plane", strand: "G", name: "Coordinate plane", order: 4 },

  // Statistics & Probability
  { key: "sp_mean_median_mode_range", strand: "SP", name: "Mean, median, mode & range", order: 1 },
  { key: "sp_interpret_data", strand: "SP", name: "Interpreting data", order: 2 },
  { key: "sp_probability_basic", strand: "SP", name: "Basic probability", order: 3 },
];

export function strandOf(skillKey: string): Strand {
  const skill = SKILLS.find((s) => s.key === skillKey);
  const strand = STRANDS.find((s) => s.key === skill?.strand);
  if (!strand) throw new Error(`Unknown skill: ${skillKey}`);
  return strand;
}

export function skillName(skillKey: string): string {
  return SKILLS.find((s) => s.key === skillKey)?.name ?? skillKey;
}
