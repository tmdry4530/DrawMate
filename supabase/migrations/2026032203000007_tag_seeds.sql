-- ============================================================
-- 00007_tag_seeds.sql
-- Canonical tag seeds: field, skill, tool, style
-- ============================================================

INSERT INTO tags (id, slug, name, category, is_active, sort_order) VALUES
  -- field (분야)
  (gen_random_uuid(), 'field-webtoon',      '웹툰',    'field', TRUE, 0),
  (gen_random_uuid(), 'field-illustration', '일러스트', 'field', TRUE, 1),
  (gen_random_uuid(), 'field-animation',    '애니메이션','field', TRUE, 2),
  (gen_random_uuid(), 'field-background',   '배경',    'field', TRUE, 3),
  (gen_random_uuid(), 'field-character',    '캐릭터',  'field', TRUE, 4),

  -- skill (스킬)
  (gen_random_uuid(), 'skill-lineart',      '선화',    'skill', TRUE, 0),
  (gen_random_uuid(), 'skill-coloring',     '채색',    'skill', TRUE, 1),
  (gen_random_uuid(), 'skill-postprocess',  '후보정',  'skill', TRUE, 2),
  (gen_random_uuid(), 'skill-storyboard',   '콘티보조', 'skill', TRUE, 3),
  (gen_random_uuid(), 'skill-coloring-book','컬러링',  'skill', TRUE, 4),
  (gen_random_uuid(), 'skill-pen-touch',    '펜터치',  'skill', TRUE, 5),

  -- tool (툴)
  (gen_random_uuid(), 'tool-photoshop',         'Photoshop',         'tool', TRUE, 0),
  (gen_random_uuid(), 'tool-clip-studio-paint', 'Clip Studio Paint', 'tool', TRUE, 1),
  (gen_random_uuid(), 'tool-procreate',         'Procreate',         'tool', TRUE, 2),
  (gen_random_uuid(), 'tool-sai',               'SAI',               'tool', TRUE, 3),
  (gen_random_uuid(), 'tool-krita',             'Krita',             'tool', TRUE, 4),

  -- style (스타일)
  (gen_random_uuid(), 'style-cel',          '셀식',    'style', TRUE, 0),
  (gen_random_uuid(), 'style-semi-realism', '반실사',  'style', TRUE, 1),
  (gen_random_uuid(), 'style-casual',       '캐주얼',  'style', TRUE, 2),
  (gen_random_uuid(), 'style-sd',           'SD',      'style', TRUE, 3),
  (gen_random_uuid(), 'style-watercolor',   '수채화풍', 'style', TRUE, 4),
  (gen_random_uuid(), 'style-oil-painting', '유화풍',  'style', TRUE, 5)
ON CONFLICT (slug) DO NOTHING;
