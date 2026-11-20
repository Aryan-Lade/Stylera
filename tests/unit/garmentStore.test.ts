import { describe, it, expect, beforeEach } from 'vitest';
import { useGarmentStore } from '../../src/tryon-app/garments/garmentStore';

describe('Garment Store Tests', () => {
  beforeEach(() => {
    useGarmentStore.setState({
      items: [],
      activeItemId: null,
      isLoading: false,
      loadingMessage: null,
    });
  });

  it('should ingest item from URL correctly', async () => {
    const id = await useGarmentStore.getState().ingestItemFromUrl({
      imageUrl: 'https://example.com/sample-shirt.png',
      title: 'Casual Shirt',
      category: 'shirt',
    });

    expect(id).toBeDefined();
    const items = useGarmentStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Casual Shirt');
    expect(items[0].category).toBe('shirt');
    expect(items[0].visible).toBe(true);
    expect(items[0].scale).toBe(1.0);
  });

  it('should allow toggling item visibility and updating transforms', async () => {
    const id = await useGarmentStore.getState().ingestItemFromUrl({
      imageUrl: 'https://example.com/sample-sunglasses.png',
      category: 'sunglasses/eyeglasses',
    });

    expect(id).not.toBeNull();
    if (!id) return;

    // Toggle visibility
    useGarmentStore.getState().toggleVisibility(id);
    expect(useGarmentStore.getState().items[0].visible).toBe(false);

    // Update transform
    useGarmentStore.getState().updateItemTransform(id, { scale: 1.25, offsetY: -20 });
    const item = useGarmentStore.getState().items[0];
    expect(item.scale).toBe(1.25);
    expect(item.offsetY).toBe(-20);

    // Category override
    useGarmentStore.getState().updateCategory(id, 'cap/hat/beanie');
    expect(useGarmentStore.getState().items[0].category).toBe('cap/hat/beanie');

    // Remove item
    useGarmentStore.getState().removeItem(id);
    expect(useGarmentStore.getState().items.length).toBe(0);
  });
});
