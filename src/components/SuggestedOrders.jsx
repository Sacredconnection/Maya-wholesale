"use client";

/* eslint-disable @next/next/no-img-element -- Product images come from WooCommerce. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  History,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";
import {
  findCatalogProduct,
  findOptionIndex,
  isStockedOption,
  mapWithClientConcurrency,
  preferredStockedOptionIndex,
  rankHistoricalItems,
  recipeScore,
  SUGGESTED_ORDER_RECIPES,
} from "@/lib/order-suggestions";

const LINE_COUNT = 4;
const CANDIDATE_COUNT = 7;

const uniqueProducts = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const candidatesForRecipe = (products, recipe) => {
  const ranked = products
    .map((product) => ({ product, score: recipeScore(product, recipe) }))
    .filter(({ score }) => recipe.terms.length === 0 || score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        String(left.product.category).localeCompare(String(right.product.category)) ||
        left.product.name.localeCompare(right.product.name)
    )
    .map(({ product }) => product);

  const source = recipe.strict || ranked.length >= LINE_COUNT ? ranked : products;
  const diverse = [];
  const groups = new Set();
  for (const product of source) {
    const group = `${product.category || ""}:${product.tribe || ""}`.toLowerCase();
    if (groups.has(group)) continue;
    groups.add(group);
    diverse.push(product);
    if (diverse.length === CANDIDATE_COUNT) break;
  }
  return uniqueProducts([...diverse, ...source]).slice(0, CANDIDATE_COUNT);
};

const weightLabel = (grams) =>
  grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;

function SuggestedOrderCard({ order, personalized = false, added, onAdd }) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border ${
        personalized
          ? "border-[#d8c58f]/35 bg-[#242f27]"
          : "border-white/10 bg-[#171717]"
      }`}
    >
      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d8c58f]">
            {order.eyebrow}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-200">
            <PackageCheck className="h-3 w-3" aria-hidden="true" />
            In-stock only
          </span>
        </div>
        <h3 className="font-headline-md text-xl font-bold text-white">{order.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{order.description}</p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-3">
          {order.selections.map(({ product, optionIndex, quantity }) => {
            const option = product.options[optionIndex];
            return (
              <div key={`${product.id}:${option.sku}`} className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white">
                  {product.image ? (
                    <img src={product.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[#989836]">
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{product.name}</p>
                  <p className="mt-0.5 truncate text-[9px] text-white/40">
                    {option.name} · {option.weightGrams || 0}g
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-white/65">×{quantity}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-white/35">
              Suggested order
            </span>
            <strong className="text-sm text-white">
              {order.selections.length} products · {weightLabel(order.totalWeight)}
            </strong>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border-0 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white transition-colors ${
              added ? "bg-[#989836]" : "bg-[#cc6632] hover:bg-[#b6532a]"
            }`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {added ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function SuggestedOrders({ orders: providedOrders }) {
  const {
    products,
    loading: productsLoading,
    error: productsError,
    reload,
    resolveProduct,
  } = useProducts();
  const { addSelectionsToCart } = useCart();
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [personalized, setPersonalized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const preparedKeyRef = useRef("");
  const orders = providedOrders ?? fetchedOrders;

  useEffect(() => {
    if (providedOrders !== undefined) return undefined;
    let active = true;
    fetch("/api/orders", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (active && response.ok) setFetchedOrders(data.orders || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [providedOrders]);

  const historyItems = useMemo(() => rankHistoricalItems(orders), [orders]);
  const catalogKey = useMemo(
    () => products.map((product) => product.id).sort().join("|"),
    [products]
  );
  const historyKey = useMemo(
    () => orders.map((order) => order.id).join("|"),
    [orders]
  );

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    const preparationKey = `${catalogKey}:${historyKey}:${retryKey}`;
    if (preparedKeyRef.current === preparationKey) return;
    preparedKeyRef.current = preparationKey;
    let active = true;

    async function prepare() {
      setLoading(true);
      setError("");
      try {
        const available = products
          .filter((product) => product.inStock !== false)
          .sort((left, right) => left.name.localeCompare(right.name));
        const candidateMap = new Map(
          SUGGESTED_ORDER_RECIPES.map((recipe) => [
            recipe.id,
            candidatesForRecipe(available, recipe),
          ])
        );
        const historicalProducts = historyItems
          .slice(0, 10)
          .map((item) => findCatalogProduct(products, item, item.storeId))
          .filter(Boolean);
        const candidates = uniqueProducts([
          ...[...candidateMap.values()].flat(),
          ...historicalProducts,
        ]);
        const resolvedPairs = await mapWithClientConcurrency(
          candidates,
          4,
          async (product) => {
            try {
              return [product.id, await resolveProduct(product)];
            } catch {
              return [product.id, null];
            }
          }
        );
        if (!active) return;
        const resolvedById = new Map(resolvedPairs);

        const curated = SUGGESTED_ORDER_RECIPES.flatMap((recipe) => {
          const selections = (candidateMap.get(recipe.id) || [])
            .flatMap((product) => {
              const resolved = resolvedById.get(product.id);
              if (!resolved) return [];
              const optionIndex = preferredStockedOptionIndex(
                resolved,
                recipe.preferredWeight
              );
              return optionIndex >= 0
                ? [{ product: resolved, optionIndex, quantity: 1 }]
                : [];
            })
            .slice(0, LINE_COUNT);
          if (selections.length < 2) return [];
          const totalWeight = selections.reduce(
            (total, selection) =>
              total +
              Number(
                selection.product.options[selection.optionIndex]?.weightGrams || 0
              ) *
                selection.quantity,
            0
          );
          return [{ ...recipe, selections, totalWeight }];
        });

        const historySelections = historyItems
          .flatMap((item) => {
            const summary = findCatalogProduct(products, item, item.storeId);
            const resolved = summary ? resolvedById.get(summary.id) : null;
            if (!resolved) return [];
            const optionIndex = findOptionIndex(resolved, item);
            const option = resolved.options?.[optionIndex];
            const requested = Math.max(1, Number(item.suggestedQuantity) || 1);
            if (optionIndex < 0 || !isStockedOption(option, 1)) return [];
            const quantity =
              option.stockQuantity == null
                ? requested
                : Math.min(requested, Number(option.stockQuantity));
            return isStockedOption(option, quantity)
              ? [{ product: resolved, optionIndex, quantity }]
              : [];
          })
          .slice(0, 5);

        setSuggestions(curated);
        setPersonalized(
          historySelections.length > 0
            ? {
                id: "history-based",
                title: "Your Smart Restock",
                eyebrow: "Based on your order history",
                description:
                  "Frequently ordered products adjusted to current live availability.",
                selections: historySelections,
                totalWeight: historySelections.reduce(
                  (total, selection) =>
                    total +
                    Number(
                      selection.product.options[selection.optionIndex]?.weightGrams || 0
                    ) *
                      selection.quantity,
                  0
                ),
              }
            : null
        );
      } catch (loadError) {
        if (active) setError(loadError.message || "Suggested orders could not be prepared.");
      } finally {
        if (active) setLoading(false);
      }
    }

    prepare();
    return () => {
      active = false;
    };
  }, [
    catalogKey,
    historyItems,
    historyKey,
    products,
    productsLoading,
    resolveProduct,
    retryKey,
  ]);

  const addOrder = (order) => {
    const selections = order.selections.filter(({ product, optionIndex, quantity }) =>
      isStockedOption(product.options?.[optionIndex], quantity)
    );
    if (selections.length !== order.selections.length) {
      setError("Availability changed. Refresh the suggestions before adding this order.");
      return;
    }
    addSelectionsToCart(selections);
    setAddedId(order.id);
  };

  if (error || productsError) {
    return (
      <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-6">
        <p className="text-sm font-bold text-red-100">{error || productsError}</p>
        <button
          type="button"
          onClick={() => {
            preparedKeyRef.current = "";
            setRetryKey((value) => value + 1);
            if (productsError) reload();
          }}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-sm border border-red-200/20 bg-transparent px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-red-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (!productsLoading && products.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
        <p className="text-sm font-bold text-white">
          No products are available for suggestions.
        </p>
        <p className="mt-2 text-xs text-white/45">
          Suggested orders will appear when the live catalog has in-stock products.
        </p>
      </div>
    );
  }

  if (loading || productsLoading) {
    return (
      <div role="status" className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
        <LoaderCircle className="h-9 w-9 animate-spin text-[#d8c58f]" />
        <p className="mt-4 text-sm font-bold text-white">Building current suggestions</p>
        <p className="mt-1 text-xs text-white/45">
          Checking live options and removing unavailable products.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="rounded-xl border border-[#d8c58f]/25 bg-[#242f27] p-6 md:p-8">
        <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d8c58f]">
          <Sparkles className="h-4 w-4" />
          Suggested orders
        </span>
        <h2 className="mt-2 font-headline-md text-2xl font-bold text-white md:text-3xl">
          Ready-to-build wholesale carts
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          Every list is rebuilt from live inventory. Nothing enters your cart until
          you choose it, and unavailable options are excluded.
        </p>
      </div>

      {personalized && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-headline-md text-lg font-bold text-white">
            <History className="h-5 w-5 text-[#d8c58f]" />
            Suggested from your history
          </h2>
          <SuggestedOrderCard
            order={personalized}
            personalized
            added={addedId === personalized.id}
            onAdd={() => addOrder(personalized)}
          />
        </section>
      )}

      <section>
        <h2 className="mb-4 font-headline-md text-lg font-bold text-white">
          Curated assortments
        </h2>
        {suggestions.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {suggestions.map((order) => (
              <SuggestedOrderCard
                key={order.id}
                order={order}
                added={addedId === order.id}
                onAdd={() => addOrder(order)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
            <p className="text-sm font-bold text-white">
              No complete suggested order is available right now.
            </p>
            <p className="mt-2 text-xs text-white/45">
              Suggestions return automatically as qualifying products are restocked.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
