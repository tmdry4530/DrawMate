import { create } from "zustand";

interface ImageItem {
  clientId: string;
  id?: string;
  file?: File;
  previewUrl: string;
  caption: string;
  isCover: boolean;
  sortOrder: number;
}

interface TagState {
  field: string[];
  skill: string[];
  tool: string[];
  style: string[];
}

interface FormData {
  title: string;
  summary: string;
  description: string;
  startingPriceKrw: number | null;
  durationDays: number | null;
}

interface EditorState {
  portfolioId: string | null;
  currentStep: number; // 1-4
  selectedTemplateId: string | null;
  templateCustomization: Record<string, unknown>;
  images: ImageItem[];
  tags: TagState;
  formData: FormData;
  isDirty: boolean;

  setStep: (step: number) => void;
  setPortfolioId: (id: string) => void;
  setTemplate: (id: string) => void;
  setTemplateCustomization: (customization: Record<string, unknown>) => void;
  setImages: (images: ImageItem[]) => void;
  addImage: (image: ImageItem) => void;
  removeImage: (index: number) => void;
  updateImage: (index: number, updates: Partial<ImageItem>) => void;
  setCoverImage: (index: number) => void;
  setTags: (tags: Partial<TagState>) => void;
  setFormData: (data: Partial<FormData>) => void;
  reset: () => void;
}

const initialState = {
  portfolioId: null,
  currentStep: 1,
  selectedTemplateId: null,
  templateCustomization: {},
  images: [],
  tags: {
    field: [],
    skill: [],
    tool: [],
    style: [],
  },
  formData: {
    title: "",
    summary: "",
    description: "",
    startingPriceKrw: null,
    durationDays: null,
  },
  isDirty: false,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setPortfolioId: (id) => set({ portfolioId: id }),

  setTemplate: (id) => set({ selectedTemplateId: id, isDirty: true }),

  setTemplateCustomization: (customization) =>
    set({ templateCustomization: customization, isDirty: true }),

  setImages: (images) => set({ images, isDirty: true }),

  addImage: (image) =>
    set((state) => ({
      images: [...state.images, image],
      isDirty: true,
    })),

  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
      isDirty: true,
    })),

  updateImage: (index, updates) =>
    set((state) => ({
      images: state.images.map((img, i) =>
        i === index ? { ...img, ...updates } : img
      ),
      isDirty: true,
    })),

  setCoverImage: (index) =>
    set((state) => ({
      images: state.images.map((img, i) => ({
        ...img,
        isCover: i === index,
      })),
      isDirty: true,
    })),

  setTags: (tags) =>
    set((state) => ({
      tags: { ...state.tags, ...tags },
      isDirty: true,
    })),

  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
      isDirty: true,
    })),

  reset: () => set({ ...initialState }),
}));
