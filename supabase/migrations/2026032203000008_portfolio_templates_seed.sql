-- ============================================================
-- 00008_portfolio_templates_seed.sql
-- Seed 3 portfolio templates
-- ============================================================

INSERT INTO portfolio_templates (id, code, name, description, layout_schema, is_active, sort_order) VALUES
  (
    gen_random_uuid(),
    'minimal-grid',
    '미니멀 그리드',
    '깔끔한 그리드 레이아웃으로 작품을 정갈하게 배치합니다. 여백을 살린 심플한 디자인으로 작품 자체에 집중할 수 있습니다.',
    '{
      "layout": "grid",
      "columns": 3,
      "gap": "md",
      "showTitle": true,
      "showSummary": true,
      "showTags": true,
      "coverStyle": "square",
      "theme": "minimal"
    }'::JSONB,
    TRUE,
    0
  ),
  (
    gen_random_uuid(),
    'full-showcase',
    '풀 쇼케이스',
    '대형 이미지와 상세 설명을 함께 보여주는 풀페이지 쇼케이스 레이아웃입니다. 작품의 스토리와 제작 과정을 풍부하게 소개할 수 있습니다.',
    '{
      "layout": "showcase",
      "columns": 1,
      "gap": "lg",
      "showTitle": true,
      "showSummary": true,
      "showDescription": true,
      "showTags": true,
      "coverStyle": "wide",
      "theme": "bold"
    }'::JSONB,
    TRUE,
    1
  ),
  (
    gen_random_uuid(),
    'compact-card',
    '컴팩트 카드',
    '작은 카드 형태로 많은 작품을 한눈에 볼 수 있는 레이아웃입니다. 다양한 작품을 효율적으로 보여주고 싶을 때 적합합니다.',
    '{
      "layout": "card",
      "columns": 4,
      "gap": "sm",
      "showTitle": true,
      "showSummary": false,
      "showTags": false,
      "coverStyle": "square",
      "theme": "compact"
    }'::JSONB,
    TRUE,
    2
  )
ON CONFLICT (code) DO NOTHING;
