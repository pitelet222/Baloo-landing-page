// Test URLs from the brief. Replace the placeholder paths with real product links
// from each retailer before testing — these are shaped correctly but illustrative.

export const TEST_URLS: { label: string; url: string; note: string }[] = [
  {
    label: "Oatly Oat Drink (Ocado)",
    url: "https://www.ocado.com/products/oatly-oat-drink",
    note: "Short, simple list. Good first test.",
  },
  {
    label: "KIND Dark Chocolate Nuts & Sea Salt (Whole Foods)",
    url: "https://www.wholefoodsmarket.com/product/kind-dark-chocolate-nuts-sea-salt",
    note: "Medium complexity, percentages listed.",
  },
  {
    label: "Activia Strawberry Yoghurt (Tesco)",
    url: "https://www.tesco.com/groceries/en-GB/products/activia-strawberry",
    note: "Probiotic / marketing-ingredient context.",
  },
  {
    label: "Pringles Original (Kroger)",
    url: "https://www.kroger.com/p/pringles-original",
    note: "Long list, additives + E-numbers. Stress test for streaming.",
  },
  {
    label: "Kitchen utensil (error path)",
    url: "https://www.target.com/p/kitchen-spatula",
    note: "No ingredient list — should show the friendly error state.",
  },
];
