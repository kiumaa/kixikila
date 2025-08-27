import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

interface UseVirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualScrollProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItemsSlice = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItemsSlice.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          height: itemHeight,
          width: '100%'
        }
      });
    }

    return visibleItemsSlice;
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    onScroll
  };
};

// Virtual List Component
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}

export const VirtualList: React.FC<VirtualListProps> = ({
  items,
  itemHeight,
  height,
  renderItem,
  className = ''
}) => {
  const { scrollElementRef, visibleItems, totalHeight, onScroll } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight: height
  });

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, item, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};