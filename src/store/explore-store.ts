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

export const useExploreStore = create<ExploreState>((set) => ({
  q: "",
  sort: "latest",
  filters: { ...initialFilters },

  setQ: (q) => set({ q }),

  setSort: (sort) => set({ sort }),

  toggleTag: (category, slug) =>
    set((state) => {
      const current = state.filters[category];
      const updated = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      return { filters: { ...state.filters, [category]: updated } };
    }),

  clearFilters: () => set({ filters: { ...initialFilters } }),

  reset: () => set({ q: "", sort: "latest", filters: { ...initialFilters } }),
}));
