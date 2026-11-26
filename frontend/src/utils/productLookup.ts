import api from '../api/client';

export interface ProductMeta {
  tagNo: string;
  itemName: string;
  category?: string;
  itemType?: string;
  subItem?: string;
  isSold?: boolean;
  found: boolean;
}

const productCache = new Map<string, ProductMeta>();
const inflightRequests = new Map<string, Promise<ProductMeta | null>>();

export const getCachedProductMeta = (tagNo?: string | null): ProductMeta | undefined => {
  const key = (tagNo || '').trim().toUpperCase();
  if (!key) return undefined;
  return productCache.get(key);
};

export const fetchProductMetaByTag = async (tagNo?: string | null): Promise<ProductMeta | null> => {
  const clean = (tagNo || '').trim();
  const key = clean.toUpperCase();
  if (!clean) return null;

  const cached = productCache.get(key);
  if (cached) return cached;

  const existing = inflightRequests.get(key);
  if (existing) return existing;

  const req = api
    .get('/api/v1/products/by-tag', { params: { tag_no: clean } })
    .then((res) => {
      const data = res.data;
      if (data?.item_name) {
        const meta: ProductMeta = {
          tagNo: data.tag_no || clean,
          itemName: data.item_name,
          category: data.counter || '',
          itemType: data.item_type || '',
          subItem: data.sub_item || '',
          isSold: Boolean(data.is_sold),
          found: true,
        };
        productCache.set(key, meta);
        return meta;
      }
      const miss: ProductMeta = { tagNo: clean, itemName: '', found: false };
      productCache.set(key, miss);
      return miss;
    })
    .catch(() => {
      const miss: ProductMeta = { tagNo: clean, itemName: '', found: false };
      productCache.set(key, miss);
      return miss;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, req);
  return req;
};

export const fetchProductMetaBatch = async (
  tagNos: Array<string | undefined | null>
): Promise<Record<string, ProductMeta>> => {
  const uniqueTags = Array.from(
    new Set(tagNos.map((t) => (t || '').trim()).filter(Boolean))
  );
  const results = await Promise.all(
    uniqueTags.map(async (tag) => ({ tag, meta: await fetchProductMetaByTag(tag) }))
  );
  const mapped: Record<string, ProductMeta> = {};
  for (const { tag, meta } of results) {
    if (meta && meta.found) {
      mapped[tag] = meta;
    }
  }
  return mapped;
};

export const formatProductLabel = (
  name?: string | null,
  category?: string | null,
  itemType?: string | null
): string => {
  const parts = [
    (name || '').trim(),
    (itemType || '').trim(),
    category && category.trim().toUpperCase() !== (name || '').trim().toUpperCase()
      ? category.trim()
      : '',
  ].filter(Boolean);
  return parts.join(' • ');
};
