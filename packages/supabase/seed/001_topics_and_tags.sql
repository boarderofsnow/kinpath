-- =============================================================================
-- Seed: Topics
-- =============================================================================

insert into public.topics (id, label, icon, sort_order) values
  ('prenatal', 'Prenatal Care', 'baby', 1),
  ('newborn_care', 'Newborn Care', 'heart', 2),
  ('nutrition_and_diet', 'Nutrition & Diet', 'apple', 3),
  ('vaccinations', 'Vaccinations', 'syringe', 4),
  ('breastfeeding', 'Breastfeeding & Feeding', 'droplet', 5),
  ('emotional_wellness', 'Emotional Wellness', 'smile', 6),
  ('sleep', 'Sleep', 'moon', 7),
  ('milestones', 'Milestones', 'flag', 8),
  ('safety', 'Safety', 'shield', 9),
  ('postpartum', 'Postpartum', 'flower', 10),
  ('infant_development', 'Infant Development', 'trending-up', 11),
  ('toddler_development', 'Toddler Development', 'footprints', 12),
  ('relationships', 'Relationships & Co-Parenting', 'users', 13)
on conflict (id) do nothing;

-- =============================================================================
-- Seed: Tags
-- =============================================================================

-- Faith/spirituality
insert into public.tags (id, namespace, value, label) values
  ('faith:christian', 'faith', 'christian', 'Christian'),
  ('faith:catholic', 'faith', 'catholic', 'Catholic'),
  ('faith:jewish', 'faith', 'jewish', 'Jewish'),
  ('faith:muslim', 'faith', 'muslim', 'Muslim'),
  ('faith:hindu', 'faith', 'hindu', 'Hindu'),
  ('faith:buddhist', 'faith', 'buddhist', 'Buddhist'),
  ('faith:secular', 'faith', 'secular', 'Secular / Non-religious'),
  ('faith:spiritual', 'faith', 'spiritual', 'Spiritual (non-denominational)')
on conflict (id) do nothing;

-- Birth preference
insert into public.tags (id, namespace, value, label) values
  ('birth:home', 'birth', 'home', 'Home Birth'),
  ('birth:hospital', 'birth', 'hospital', 'Hospital Birth'),
  ('birth:birth_center', 'birth', 'birth_center', 'Birth Center'),
  ('birth:water', 'birth', 'water', 'Water Birth')
on conflict (id) do nothing;

-- Vaccine approach
insert into public.tags (id, namespace, value, label) values
  ('vaccine:standard', 'vaccine', 'standard', 'Standard CDC Schedule'),
  ('vaccine:delayed', 'vaccine', 'delayed', 'Delayed Schedule'),
  ('vaccine:selective', 'vaccine', 'selective', 'Selective Vaccination')
on conflict (id) do nothing;

-- Dietary preferences
insert into public.tags (id, namespace, value, label) values
  ('diet:vegetarian', 'diet', 'vegetarian', 'Vegetarian'),
  ('diet:vegan', 'diet', 'vegan', 'Vegan'),
  ('diet:kosher', 'diet', 'kosher', 'Kosher'),
  ('diet:halal', 'diet', 'halal', 'Halal'),
  ('diet:gluten_free', 'diet', 'gluten_free', 'Gluten-Free'),
  ('diet:dairy_free', 'diet', 'dairy_free', 'Dairy-Free')
on conflict (id) do nothing;

-- Feeding approach
insert into public.tags (id, namespace, value, label) values
  ('feeding:breastfeeding', 'feeding', 'breastfeeding', 'Breastfeeding'),
  ('feeding:formula', 'feeding', 'formula', 'Formula Feeding'),
  ('feeding:combination', 'feeding', 'combination', 'Combination Feeding'),
  ('feeding:blw', 'feeding', 'blw', 'Baby-Led Weaning')
on conflict (id) do nothing;

-- Parenting philosophy
insert into public.tags (id, namespace, value, label) values
  ('parenting:attachment', 'parenting', 'attachment', 'Attachment Parenting'),
  ('parenting:gentle', 'parenting', 'gentle', 'Gentle Parenting'),
  ('parenting:montessori', 'parenting', 'montessori', 'Montessori'),
  ('parenting:rie', 'parenting', 'rie', 'RIE')
on conflict (id) do nothing;
