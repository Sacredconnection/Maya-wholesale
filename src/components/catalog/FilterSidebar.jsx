"use client";

import { useState } from "react";
import { ChevronDown, Filter, Search, SlidersHorizontal } from "lucide-react";

function SelectField({ id, label, value, onChange, children, disabled = false }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-white/55"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full cursor-pointer appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-4 pr-10 text-sm text-white outline-none transition-colors focus:border-[#999933] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  categories,
  subcategories = [],
  childCategories = [],
  attributes = [],
  onChange,
  onClear,
  disabled = false,
  allValue = "",
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const update = (field, value) => onChange({ ...filters, [field]: value });
  const updateCategory = (value) =>
    onChange({
      ...filters,
      category: value,
      subcategory: allValue,
      childCategory: allValue,
    });
  const updateSubcategory = (value) =>
    onChange({
      ...filters,
      subcategory: value,
      childCategory: allValue,
    });
  const updateAttribute = (key, value) =>
    onChange({
      ...filters,
      attributes: {
        ...(filters.attributes || {}),
        [key]: value,
      },
    });
  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.childCategory,
    ...Object.values(filters.attributes || {}),
  ].filter((value) => value && value !== allValue).length;

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-white/5 bg-[#1a1a1a] p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-white sm:flex">
        <Filter className="h-4 w-4 text-[#f2f2f2]" aria-hidden="true" />
        Filter Products
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="flex w-full min-w-0 flex-col gap-2">
          <label
            htmlFor="catalog-search"
            className="sr-only text-xs font-semibold uppercase tracking-wide text-white/55 sm:not-sr-only"
          >
            Search
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="text"
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
              placeholder="Name or SKU..."
              autoComplete="off"
              className="w-full rounded-sm border border-white/10 bg-[#131313] py-4 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#999933]"
            />
          </div>
        </div>

        <button
          type="button"
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-catalog-filters"
          aria-label={mobileFiltersOpen ? "Hide product filters" : "Show product filters"}
          onClick={() => setMobileFiltersOpen((current) => !current)}
          className="relative flex h-[54px] w-[54px] cursor-pointer items-center justify-center rounded-sm border border-[#999933]/60 bg-[#999933]/10 text-[#f2f2f2] transition-colors hover:bg-[#999933]/20 sm:hidden"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d5672f] px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div
          id="mobile-catalog-filters"
          className={`${mobileFiltersOpen ? "grid" : "hidden"} col-span-full grid-cols-1 items-end gap-5 sm:contents`}
        >
          <SelectField
            id="catalog-category"
            label="Category"
            value={filters.category}
            onChange={(event) => updateCategory(event.target.value)}
          >
            <option value={allValue}>All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </SelectField>

          <SelectField
            id="catalog-subcategory"
            label="Subcategory"
            value={filters.subcategory || allValue}
            onChange={(event) => updateSubcategory(event.target.value)}
            disabled={filters.category === allValue || subcategories.length === 0}
          >
            <option value={allValue}>All Subcategories</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>{subcategory}</option>
            ))}
          </SelectField>

          {childCategories.length > 0 && (
            <SelectField
              id="catalog-child-category"
              label="Subcategory level 2"
              value={filters.childCategory || allValue}
              onChange={(event) => update("childCategory", event.target.value)}
              disabled={!filters.subcategory}
            >
              <option value={allValue}>All Level 2 Subcategories</option>
              {childCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </SelectField>
          )}

          {attributes.map((attribute) => (
            <SelectField
              key={attribute.key}
              id={`catalog-attribute-${attribute.key}`}
              label={attribute.name}
              value={filters.attributes?.[attribute.key] || ""}
              onChange={(event) => updateAttribute(attribute.key, event.target.value)}
              disabled={attribute.options.length === 0}
            >
              <option value="">{attribute.name}</option>
              {attribute.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} ({option.count})
                </option>
              ))}
            </SelectField>
          ))}

          <button
            type="button"
            onClick={() => {
              onClear();
              setMobileFiltersOpen(false);
            }}
            disabled={disabled}
            className="w-full cursor-pointer rounded-sm border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
