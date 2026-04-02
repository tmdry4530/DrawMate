import { create } from "zustand";

type SortOption = "latest" | "popular" | "price_asc" | "price_desc";

interface TagFilters {
  fieldTags: string[];
  skillTags: string[];
  toolTags: string[];
  styleTags: string[];
}

interface ExploreState {
  q: string;
  sort: SortOption;
  filters: TagFilters;
  setQ: (q: string) => void;
  setSort: (sort: SortOption) => void;
  setFilters: (filters: Partial<TagFilters>) => void;
  toggleTag: (category: keyof TagFilters, slug: string) => void;
  clearFilters: () => void;
  reset: () => void;
}

const initialFilters: TagFilters = {
  fieldTags: [],
  skillTags: [],
  toolTags: [],
  styleTags: [],
};

function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function filtersEqual(a: TagFilters, b: TagFilters) {
  return (
    arraysEqual(a.fieldTags, b.fieldTags) &&
    arraysEqual(a.skillTags, b.skillTags) &&
    arraysEqual(a.toolTags, b.toolTags) &&
    arraysEqual(a.styleTags, b.styleTags)
  );
}

export const useExploreStore = create<ExploreState>((set) => ({
  q: "",
  sort: "latest",
  filters: { ...initialFilters },

  setQ: (q) =>
    set((state) => {
      if (state.q === q) return state;
      return { q };
    }),

  setSort: (sort) =>
    set((state) => {
      if (state.sort === sort) return state;
      return { sort };
    }),

  setFilters: (partial) =>
    set((state) => {
      const nextFilters = { ...state.filters, ...partial };
      if (filtersEqual(state.filters, nextFilters)) {
        return state;
      }
      return { filters: nextFilters };
    }),

  toggleTag: (category, slug) =>
    set((state) => {
      const current = state.filters[category];
      const updated = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { filters: { ...state.filters, [category]: updated } };
    }),

  clearFilters: () =>
    set((state) => {
      if (filtersEqual(state.filters, initialFilters)) return state;
      return { filters: { ...initialFilters } };
    }),

  reset: () =>
    set((state) => {
      if (state.q === "" && state.sort === "latest" && filtersEqual(state.filters, initialFilters)) {
        return state;
      }
      return { q: "", sort: "latest", filters: { ...initialFilters } };
    }),
}));
