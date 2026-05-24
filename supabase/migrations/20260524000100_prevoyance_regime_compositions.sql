update public.prevoyance_regime_settings
set data = jsonb_set(
  data,
  '{composition}',
  jsonb_build_object('componentCodes', jsonb_build_array('cnavpl', code)),
  true
)
where code in ('cipav', 'cavp', 'carpv', 'cprn', 'cavom', 'cavamac');
