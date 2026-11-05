export type Grade = 3 | 4 | 5 | 6;

export interface GradeMeta {
  grade: Grade;
  name: string;
  color: string; // tailwind color stem
}

export const GRADES: GradeMeta[] = [
  { grade: 3, name: "Grade 3 foundations", color: "sky" },
  { grade: 4, name: "Grade 4 foundations", color: "violet" },
  { grade: 5, name: "Grade 5 foundations", color: "amber" },
  { grade: 6, name: "Grade 6", color: "emerald" },
];

export interface SkillMeta {
  key: string;
  grade: Grade;
  /** Short topic label shown on question cards, e.g. "Fractions". */
  topic: string;
  name: string;
  /** Order within the grade. Combined with grade this is the learning path. */
  order: number;
}

// The learning path. Each grade's skills are in the order Allie works through
// them; a skill unlocks only once every skill before it is mastered.
export const SKILLS: SkillMeta[] = [
  // ---------------- Grade 3 ----------------
  { key: "g3_add_sub_regroup", grade: 3, topic: "Add & subtract", name: "Adding & subtracting with regrouping", order: 1 },
  { key: "g3_place_value_round", grade: 3, topic: "Place value", name: "Place value & rounding to tens and hundreds", order: 2 },
  { key: "g3_mult_facts", grade: 3, topic: "Multiplication", name: "Multiplication facts (0-10)", order: 3 },
  { key: "g3_div_facts", grade: 3, topic: "Division", name: "Division facts (0-10)", order: 4 },
  { key: "g3_mult_div_word", grade: 3, topic: "Word problems", name: "Multiplication & division word problems", order: 5 },
  { key: "g3_fraction_identify", grade: 3, topic: "Fractions", name: "Understanding fractions (parts of a whole)", order: 6 },
  { key: "g3_fraction_compare", grade: 3, topic: "Fractions", name: "Comparing simple fractions", order: 7 },
  { key: "g3_area_perimeter", grade: 3, topic: "Geometry", name: "Area & perimeter of rectangles", order: 8 },

  // ---------------- Grade 4 ----------------
  { key: "g4_place_value_large", grade: 4, topic: "Place value", name: "Place value, comparing & rounding big numbers", order: 1 },
  { key: "g4_multi_digit_mult", grade: 4, topic: "Multiplication", name: "Multi-digit multiplication", order: 2 },
  { key: "g4_long_division", grade: 4, topic: "Division", name: "Long division with remainders", order: 3 },
  { key: "g4_factors_multiples", grade: 4, topic: "Factors", name: "Factors, multiples, prime & composite", order: 4 },
  { key: "g4_equivalent_fractions", grade: 4, topic: "Fractions", name: "Equivalent fractions", order: 5 },
  { key: "g4_compare_fractions", grade: 4, topic: "Fractions", name: "Comparing fractions with different denominators", order: 6 },
  { key: "g4_fraction_add_sub_like", grade: 4, topic: "Fractions", name: "Adding & subtracting fractions (same denominator)", order: 7 },
  { key: "g4_fraction_times_whole", grade: 4, topic: "Fractions", name: "Multiplying a fraction by a whole number", order: 8 },
  { key: "g4_decimals_intro", grade: 4, topic: "Decimals", name: "Decimals: tenths & hundredths", order: 9 },
  { key: "g4_multi_step_word", grade: 4, topic: "Word problems", name: "Multi-step word problems", order: 10 },

  // ---------------- Grade 5 ----------------
  { key: "g5_decimal_place_value", grade: 5, topic: "Decimals", name: "Decimal place value, comparing & rounding", order: 1 },
  { key: "g5_order_of_operations", grade: 5, topic: "Operations", name: "Order of operations", order: 2 },
  { key: "g5_long_division_2digit", grade: 5, topic: "Division", name: "Dividing by 2-digit numbers", order: 3 },
  { key: "g5_fraction_add_sub_unlike", grade: 5, topic: "Fractions", name: "Adding & subtracting fractions (different denominators)", order: 4 },
  { key: "g5_mixed_numbers", grade: 5, topic: "Fractions", name: "Mixed numbers & improper fractions", order: 5 },
  { key: "g5_fraction_multiply", grade: 5, topic: "Fractions", name: "Multiplying fractions", order: 6 },
  { key: "g5_fraction_divide_unit", grade: 5, topic: "Fractions", name: "Dividing with unit fractions", order: 7 },
  { key: "g5_decimal_add_sub", grade: 5, topic: "Decimals", name: "Adding & subtracting decimals", order: 8 },
  { key: "g5_decimal_mult_div", grade: 5, topic: "Decimals", name: "Multiplying & dividing decimals", order: 9 },
  { key: "g5_volume", grade: 5, topic: "Geometry", name: "Volume of rectangular prisms", order: 10 },
  { key: "g5_coordinate_plane", grade: 5, topic: "Geometry", name: "Plotting points on a coordinate plane", order: 11 },

  // ---------------- Grade 6 ----------------
  { key: "ns_fraction_add_sub", grade: 6, topic: "Fractions", name: "Adding & subtracting fractions", order: 1 },
  { key: "ns_fraction_mult_div", grade: 6, topic: "Fractions", name: "Multiplying & dividing fractions", order: 2 },
  { key: "ns_decimal_operations", grade: 6, topic: "Decimals", name: "Decimal operations", order: 3 },
  { key: "ns_gcf_lcm", grade: 6, topic: "Factors", name: "GCF & LCM", order: 4 },
  { key: "ns_integers_absolute_value", grade: 6, topic: "Integers", name: "Integers & absolute value", order: 5 },
  { key: "rp_ratio_simplify", grade: 6, topic: "Ratios", name: "Writing ratios in simplest form", order: 6 },
  { key: "rp_equivalent_ratios", grade: 6, topic: "Ratios", name: "Equivalent ratios", order: 7 },
  { key: "rp_unit_rate", grade: 6, topic: "Ratios", name: "Unit rates", order: 8 },
  { key: "rp_percent_of_number", grade: 6, topic: "Percents", name: "Percent of a number", order: 9 },
  { key: "ee_evaluate_expressions", grade: 6, topic: "Algebra", name: "Evaluating expressions", order: 10 },
  { key: "ee_simplify_expressions", grade: 6, topic: "Algebra", name: "Simplifying expressions", order: 11 },
  { key: "ee_one_step_equations", grade: 6, topic: "Algebra", name: "One-step equations", order: 12 },
  { key: "ee_inequalities", grade: 6, topic: "Algebra", name: "Inequalities", order: 13 },
  { key: "g_area_polygons", grade: 6, topic: "Geometry", name: "Area of triangles & parallelograms", order: 14 },
  { key: "g_area_composite", grade: 6, topic: "Geometry", name: "Area of composite figures", order: 15 },
  { key: "g_volume_rect_prism", grade: 6, topic: "Geometry", name: "Volume with fractional edges", order: 16 },
  { key: "g_coordinate_plane", grade: 6, topic: "Geometry", name: "Distance on the coordinate plane", order: 17 },
  { key: "sp_mean_median_mode_range", grade: 6, topic: "Data", name: "Mean, median, mode & range", order: 18 },
  { key: "sp_interpret_data", grade: 6, topic: "Data", name: "Interpreting data", order: 19 },
  { key: "sp_probability_basic", grade: 6, topic: "Data", name: "Basic probability", order: 20 },
];

/** Skills in learning-path order: grade 3 first, then within each grade by order. */
export const ORDERED_SKILLS: SkillMeta[] = [...SKILLS].sort(
  (a, b) => a.grade - b.grade || a.order - b.order
);

export function skillsForGrade(grade: Grade): SkillMeta[] {
  return ORDERED_SKILLS.filter((s) => s.grade === grade);
}

export function skillMeta(skillKey: string): SkillMeta {
  const skill = SKILLS.find((s) => s.key === skillKey);
  if (!skill) throw new Error(`Unknown skill: ${skillKey}`);
  return skill;
}

export function skillName(skillKey: string): string {
  return SKILLS.find((s) => s.key === skillKey)?.name ?? skillKey;
}

export function gradeMeta(grade: Grade): GradeMeta {
  return GRADES.find((g) => g.grade === grade)!;
}
