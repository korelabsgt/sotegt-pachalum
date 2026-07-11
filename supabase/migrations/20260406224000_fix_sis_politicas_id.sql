CREATE SEQUENCE IF NOT EXISTS sis_politicas_id_seq;

SELECT setval(
  'sis_politicas_id_seq',
  COALESCE((SELECT MAX(id) FROM sis_politicas), 0) + 1,
  false
);

ALTER TABLE sis_politicas
  ALTER COLUMN id SET DEFAULT nextval('sis_politicas_id_seq');

ALTER SEQUENCE sis_politicas_id_seq OWNED BY sis_politicas.id;
