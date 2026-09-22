import type { Generator } from "./types";
import {
  rp_ratio_simplify,
  rp_unit_rate,
  rp_equivalent_ratios,
  rp_percent_of_number,
} from "./ratiosProportional";
import {
  ns_fraction_add_sub,
  ns_fraction_mult_div,
  ns_decimal_operations,
  ns_integers_absolute_value,
  ns_gcf_lcm,
} from "./numberSystem";
import {
  ee_evaluate_expressions,
  ee_simplify_expressions,
  ee_one_step_equations,
  ee_inequalities,
} from "./expressionsEquations";
import {
  g_area_polygons,
  g_area_composite,
  g_volume_rect_prism,
  g_coordinate_plane,
} from "./geometry";
import {
  sp_mean_median_mode_range,
  sp_interpret_data,
  sp_probability_basic,
} from "./statistics";

export const GENERATORS: Record<string, Generator> = {
  rp_ratio_simplify,
  rp_unit_rate,
  rp_equivalent_ratios,
  rp_percent_of_number,
  ns_fraction_add_sub,
  ns_fraction_mult_div,
  ns_decimal_operations,
  ns_integers_absolute_value,
  ns_gcf_lcm,
  ee_evaluate_expressions,
  ee_simplify_expressions,
  ee_one_step_equations,
  ee_inequalities,
  g_area_polygons,
  g_area_composite,
  g_volume_rect_prism,
  g_coordinate_plane,
  sp_mean_median_mode_range,
  sp_interpret_data,
  sp_probability_basic,
};

export type { GeneratedQuestion } from "./types";
